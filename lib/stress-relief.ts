import type { StressKit } from '@/lib/types';

/** The id the grounding exercise saves to stress history. */
export const GROUNDING_ID = 'grounding-54321';

/** Grounding 5-4-3-2-1: the senses in order and how many things each asks for. */
export const SENSES = [
  { key: 'see', count: 5 },
  { key: 'feel', count: 4 },
  { key: 'hear', count: 3 },
  { key: 'smell', count: 2 },
  { key: 'taste', count: 1 },
] as const;

export type SenseKey = (typeof SENSES)[number]['key'];
export type GroundingAnswers = Record<SenseKey, string[]>;

export const GROUNDING_TOTAL = SENSES.reduce((n, s) => n + s.count, 0);

export function emptyGrounding(): GroundingAnswers {
  return Object.fromEntries(SENSES.map((s) => [s.key, Array(s.count).fill('')])) as GroundingAnswers;
}

export function groundingFilled(answers: GroundingAnswers) {
  return Object.values(answers)
    .flat()
    .filter((v) => v.trim().length > 0).length;
}

/** The encouragement line for how far through grounding someone is. */
export function groundingStage(filled: number): 'start' | 'early' | 'middle' | 'late' | 'done' {
  if (filled >= GROUNDING_TOTAL) return 'done';
  if (filled === 0) return 'start';
  if (filled < 5) return 'early';
  if (filled < 10) return 'middle';
  return 'late';
}

/** Breathing exercises from the old stress player, mapped to the practice that replaced each one. */
const OLD_BREATHING: Record<string, string> = {
  '478': 'four-seven-eight',
  box: 'box-breathing',
  '444': 'box-breathing',
  equal: 'coherent',
};

/**
 * Where a stress history entry reopens: grounding, or the breathing practice it was (old stress
 * exercises map to the practice that replaced them). Anything else has no screen to return to.
 */
export function stressEntryRoute(exerciseId: string, practiceIds: readonly string[]): string | null {
  if (exerciseId === GROUNDING_ID) return '/(tabs)/stress/grounding';
  const id = OLD_BREATHING[exerciseId] ?? exerciseId;
  return practiceIds.includes(id) ? `/(tabs)/mindful/practice/${id}` : null;
}

/** The plan sections the hub and plan count as filled: the phrase and the three lists. */
export function planFilled(kit: Pick<StressKit, 'quickPhrase' | 'triggers' | 'helpfulActions' | 'people'> | null | undefined) {
  if (!kit) return 0;
  return [!!kit.quickPhrase?.trim(), kit.triggers.length > 0, kit.helpfulActions.length > 0, kit.people.length > 0].filter(Boolean)
    .length;
}

/** Adds a trimmed item to a plan list, ignoring blanks and repeats (case-insensitive). */
export function addPlanItem(list: string[], value: string) {
  const v = value.trim();
  if (!v || list.some((x) => x.toLowerCase() === v.toLowerCase())) return list;
  return [...list, v];
}
