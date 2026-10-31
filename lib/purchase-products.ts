export const PRODUCT_IDS = {
  monthly: 'innerglow_premium_monthly',
  lifetime: 'innerglow_premium_lifetime',
} as const;
export function productMatchesPlan(
  plan: 'monthly' | 'lifetime',
  product: { identifier: string; subscriptionPeriod?: string | null },
): boolean {
  return (
    product.identifier === PRODUCT_IDS[plan] &&
    (plan !== 'monthly' || product.subscriptionPeriod === 'P1M')
  );
}
