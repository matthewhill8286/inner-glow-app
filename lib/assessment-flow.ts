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
  | 'sound';

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
];

/** Use the same visible steps for Next, Back, progress and completion. */
export function getAssessmentSteps(takingMeds?: string | null): AssessmentStep[] {
  return ASSESSMENT_STEPS.filter((step) => step !== 'medsSpecify' || takingMeds === 'Yes');
}
