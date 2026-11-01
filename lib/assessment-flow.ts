export type AssessmentStep =
  | 'goal'
  | 'gender'
  | 'age'
  | 'weight'
  | 'mood'
  | 'help'
  | 'physical'
  | 'sleep'
  | 'meds'
  | 'medsSpecify'
  | 'symptoms'
  | 'stress'
  | 'sound'
  | 'write';

const ASSESSMENT_STEPS: AssessmentStep[] = [
  'goal',
  'gender',
  'age',
  'weight',
  'mood',
  'help',
  'physical',
  'sleep',
  'meds',
  'medsSpecify',
  'symptoms',
  'stress',
  'sound',
  'write',
];

/** A9 answers (02 §3 A9). The first two lead to the medication search (10 §3.1). */
export const TAKING_MEDS = ['prescription', 'otc', 'none', 'prefer_not'] as const;
export type TakingMeds = (typeof TAKING_MEDS)[number];

/** Older drafts and rows stored Yes / No / Not sure; Yes still means "takes medication". */
export function takesMedication(takingMeds?: string | null): boolean {
  return takingMeds === 'prescription' || takingMeds === 'otc' || takingMeds === 'Yes';
}

/** Use the same visible steps for Next, Back, the "N of M" tag and completion. */
export function getAssessmentSteps(takingMeds?: string | null): AssessmentStep[] {
  return ASSESSMENT_STEPS.filter((step) => step !== 'medsSpecify' || takesMedication(takingMeds));
}

/**
 * Top glow colour per step (02 §2): a ramp from mustard to sky, one colour per position.
 * The ramp has 14 colours; a 13-step route skips none and simply ends one colour early.
 */
export const STEP_GLOW_RAMP = [
  '#E2CC40', '#E7C654', '#ECC067', '#F1BA7B', '#F5B78E', '#F9B5A1', '#FDB4B4',
  '#F9B3C2', '#EDB3CA', '#E1B4D2', '#D1B5DA', '#B6BBE2', '#9AC0E9', '#7FC6F1',
] as const;

export function stepGlow(index: number): string {
  return STEP_GLOW_RAMP[Math.min(STEP_GLOW_RAMP.length - 1, Math.max(0, index))];
}

/** Stress lights (02 §3 A12) are stored as a 1–5 band. */
export const STRESS_BANDS = [1, 2, 3, 4, 5] as const;
export type StressBand = (typeof STRESS_BANDS)[number];

/** The Glow score's stress component: Calm 100 … Intense 0. */
export function stressBandScore(band: number): number {
  return Math.round(100 - (Math.min(5, Math.max(1, band)) - 1) * 25);
}

/** Old 0–10 drafts become the nearest band, so a resumed draft keeps its answer. */
export function stressBandFromLevel(level: number): StressBand {
  return Math.min(5, Math.max(1, Math.round(level / 2))) as StressBand;
}
