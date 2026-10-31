export type SubscriptionPlan = 'trial' | 'monthly' | 'lifetime';
export type SubscriptionStatus =
  | 'pending'
  | 'active'
  | 'past_due'
  | 'canceling'
  | 'canceled'
  | 'expired';
export type Subscription = {
  type: SubscriptionPlan;
  status: SubscriptionStatus;
  expiryDate?: string | null;
  stripeCustomerId?: string | null;
  pending?: boolean;
  /** Short-lived native proof covers billing grace periods reported by StoreKit. */
  storeVerifiedUntil?: number;
};

export function subscriptionHasAccess(
  subscription: Subscription | null,
  now = Date.now(),
): boolean {
  if (!subscription || subscription.pending) return false;
  if (subscription.status !== 'active' && subscription.status !== 'canceling') return false;
  if (subscription.type === 'lifetime') return subscription.status === 'active';
  if (subscription.storeVerifiedUntil && subscription.storeVerifiedUntil > now) return true;
  const expiry = subscription.expiryDate ? Date.parse(subscription.expiryDate) : NaN;
  return Number.isFinite(expiry) && expiry > now;
}

export function subscriptionFromEntitlement(
  entitlement:
    | {
        isActive: boolean;
        productIdentifier: string;
        expirationDate: string | null;
        willRenew: boolean;
      }
    | undefined,
): Subscription | null {
  if (!entitlement?.isActive) return null;
  if (entitlement.productIdentifier === 'innerglow_premium_lifetime') {
    return { type: 'lifetime', status: 'active', expiryDate: null };
  }
  if (entitlement.productIdentifier !== 'innerglow_premium_monthly') return null;
  return {
    type: 'monthly',
    status: entitlement.willRenew ? 'active' : 'canceling',
    expiryDate: entitlement.expirationDate,
    storeVerifiedUntil:
      entitlement.expirationDate && Date.parse(entitlement.expirationDate) <= Date.now()
        ? Date.now() + 60000
        : undefined,
  };
}

/** Only accept the fields and enum values we persist; malformed caches never grant access. */
export function parseSubscriptionCache(raw: string | null): Subscription | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (
      !value ||
      !['trial', 'monthly', 'lifetime'].includes(value.type) ||
      !['pending', 'active', 'past_due', 'canceling', 'canceled', 'expired'].includes(value.status)
    )
      return null;
    if (
      value.expiryDate != null &&
      (typeof value.expiryDate !== 'string' || !Number.isFinite(Date.parse(value.expiryDate)))
    )
      return null;
    if (value.type !== 'lifetime' && !value.expiryDate) return null;
    return {
      type: value.type,
      status: value.status,
      expiryDate: value.expiryDate ?? null,
      pending: value.pending === true,
    };
  } catch {
    return null;
  }
}

/** Trials do not own products; lifetime covers every plan, monthly only itself. */
export function alreadyOwnsPlan(
  subscription: Subscription | null,
  plan: 'monthly' | 'lifetime',
): boolean {
  return (
    subscriptionHasAccess(subscription) &&
    (subscription?.type === 'lifetime' || subscription?.type === plan)
  );
}
