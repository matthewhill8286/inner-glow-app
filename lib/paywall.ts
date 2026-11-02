/**
 * Copy and price logic for the shared paywall (01 §2.7, 08 §2.4–2.5).
 * Kept free of imports so the tests can load it on its own.
 */

export type PaywallVariant = 'default' | 'home' | 'practice' | 'plan';
export type PaywallPlan = 'yearly' | 'monthly';

export const PAYWALL_VARIANTS: readonly PaywallVariant[] = ['default', 'home', 'practice', 'plan'];

export function paywallVariant(value?: string | null): PaywallVariant {
  return PAYWALL_VARIANTS.includes(value as PaywallVariant) ? (value as PaywallVariant) : 'default';
}

/** "Save 50%": how much cheaper yearly is per month. Hidden (null) under 10 %. */
export function savingPercent(
  yearlyPrice?: number | null,
  monthlyPrice?: number | null,
): number | null {
  if (!yearlyPrice || !monthlyPrice) return null;
  const saving = Math.round((1 - yearlyPrice / 12 / monthlyPrice) * 100);
  return saving >= 10 ? saving : null;
}

/** Trial length in days from a store period such as "P1W" or "P7D". */
export function periodDays(period?: string | null): number | null {
  const m = /^P(\d+)([DWM])$/.exec(period ?? '');
  if (!m) return null;
  const n = Number(m[1]);
  return m[2] === 'D' ? n : m[2] === 'W' ? n * 7 : n * 30;
}

type Line = { key: string; params?: Record<string, string | number> };

/**
 * The 08 §2.5 table. Trial-eligible users see the variant's title and subtitle; picking Monthly
 * swaps the subtitle for "Monthly has no free trial". Users who had the trial see "Welcome back to
 * Pro" and plain prices whichever plan is picked.
 */
export function paywallCopy({
  variant,
  eligible,
  plan,
  days,
  yearly,
  monthly,
}: {
  variant: PaywallVariant;
  eligible: boolean;
  plan: PaywallPlan;
  days: number;
  yearly: string;
  monthly: string;
}): { title: Line; subtitle: Line; yearlySub: Line; monthlySub: Line; cta: Line } {
  const v = `paywall.variants.${variant}`;
  const subscribe: Line =
    plan === 'yearly'
      ? { key: 'paywall.subscribeYear', params: { price: yearly } }
      : { key: 'paywall.subscribeMonth', params: { price: monthly } };
  if (!eligible) {
    return {
      title: { key: 'paywall.welcomeBack' },
      subtitle: { key: 'paywall.trialUsed' },
      yearlySub: { key: 'paywall.yearlyBilled', params: { price: yearly } },
      monthlySub: { key: 'paywall.monthlySub', params: { price: monthly } },
      cta: subscribe,
    };
  }
  return {
    title: { key: `${v}.title`, params: { days } },
    subtitle:
      plan === 'monthly'
        ? { key: 'paywall.monthlyNoTrial', params: { days } }
        : { key: `${v}.subtitle`, params: { days } },
    yearlySub: { key: 'paywall.yearlyTrial', params: { days, price: yearly } },
    monthlySub:
      plan === 'monthly'
        ? { key: 'paywall.monthlyCancel', params: { price: monthly } }
        : { key: 'paywall.monthlySub', params: { price: monthly } },
    cta: plan === 'monthly' ? subscribe : { key: `${v}.cta`, params: { days } },
  };
}
