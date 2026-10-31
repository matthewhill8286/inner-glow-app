export const PRODUCTS = {
  innerglow_premium_monthly: 'monthly',
  innerglow_premium_lifetime: 'lifetime',
} as const;

export type Subscriber = {
  entitlements?: Record<
    string,
    {
      product_identifier: string;
      expires_date: string | null;
      grace_period_expires_date?: string | null;
    }
  >;
  subscriptions?: Record<
    string,
    {
      expires_date?: string | null;
      grace_period_expires_date?: string | null;
      unsubscribe_detected_at?: string | null;
      billing_issues_detected_at?: string | null;
      refunded_at?: string | null;
      is_sandbox?: boolean;
      store?: string;
    }
  >;
  non_subscriptions?: Record<string, { is_sandbox?: boolean; store?: string }[]>;
};

export function subscriberState(subscriber: Subscriber, now = Date.now()) {
  const premium = subscriber.entitlements?.premium;
  if (!premium || !Object.hasOwn(PRODUCTS, premium.product_identifier)) return null;
  const product = premium.product_identifier as keyof typeof PRODUCTS;
  const subscription = subscriber.subscriptions?.[product];
  const purchase = subscriber.non_subscriptions?.[product]?.at(-1);
  const expires =
    subscription?.grace_period_expires_date ||
    premium.grace_period_expires_date ||
    premium.expires_date;
  const active =
    !subscription?.refunded_at &&
    (expires === null || (typeof expires === 'string' && Date.parse(expires) > now));
  return {
    plan: PRODUCTS[product],
    status: !active ? 'expired' : subscription?.unsubscribe_detected_at ? 'canceling' : 'active',
    product_id: product,
    current_period_end: expires,
    environment: (subscription?.is_sandbox ?? purchase?.is_sandbox) ? 'SANDBOX' : 'PRODUCTION',
    store: 'app_store',
  };
}

export function webhookUserIds(event: {
  type: string;
  app_user_id?: string;
  original_app_user_id?: string;
  aliases?: string[];
  transferred_from?: string[];
  transferred_to?: string[];
}) {
  const values =
    event.type === 'TRANSFER'
      ? [...(event.transferred_from ?? []), ...(event.transferred_to ?? [])]
      : [event.app_user_id, event.original_app_user_id, ...(event.aliases ?? [])];
  return [
    ...new Set(
      values.filter(
        (id): id is string =>
          typeof id === 'string' &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id),
      ),
    ),
  ];
}
