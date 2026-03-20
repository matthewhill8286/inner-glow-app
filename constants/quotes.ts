import type { TFunction } from 'i18next';

export const STRESS_QUOTE_KEYS = [
  'quote1',
  'quote2',
  'quote3',
  'quote4',
  'quote5',
  'quote6',
  'quote7',
  'quote8',
] as const;

export function getStressQuotes(t: TFunction): string[] {
  return STRESS_QUOTE_KEYS.map((key) => t(`stressQuotes.${key}`));
}
