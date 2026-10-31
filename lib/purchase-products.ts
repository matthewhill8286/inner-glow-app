export const PRODUCT_IDS = {
  yearly: 'innerglow_premium_yearly',
  monthly: 'innerglow_premium_monthly',
  // No longer sold; kept so earlier lifetime buyers keep their access.
  lifetime: 'innerglow_premium_lifetime',
} as const;

/** Plans offered on the paywall (Figma `6600:2039`): Yearly with a 7-day intro trial, and Monthly. */
export type PurchasablePlan = 'yearly' | 'monthly';
export const PURCHASABLE_PLANS: readonly PurchasablePlan[] = ['yearly', 'monthly'];

const PERIODS: Record<PurchasablePlan, string> = { yearly: 'P1Y', monthly: 'P1M' };

export function productMatchesPlan(
  plan: PurchasablePlan,
  product: { identifier: string; subscriptionPeriod?: string | null },
): boolean {
  return product.identifier === PRODUCT_IDS[plan] && product.subscriptionPeriod === PERIODS[plan];
}
