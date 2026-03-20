import type { TFunction } from 'i18next';

export const AFFIRMATION_KEYS = [
  'affirmation1',
  'affirmation2',
  'affirmation3',
  'affirmation4',
  'affirmation5',
  'affirmation6',
  'affirmation7',
  'affirmation8',
  'affirmation9',
  'affirmation10',
  'affirmation11',
  'affirmation12',
  'affirmation13',
  'affirmation14',
  'affirmation15',
] as const;

export function getAffirmations(t: TFunction): string[] {
  return AFFIRMATION_KEYS.map((key) => t(`affirmations.${key}`));
}
