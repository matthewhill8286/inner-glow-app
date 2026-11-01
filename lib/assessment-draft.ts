import type { PickedMedication } from './medications';
import { stressBandFromLevel, TAKING_MEDS, type AssessmentStep, type TakingMeds } from './assessment-flow';

export type SoundCheckAnswer = {
  uri: string;
  durationMs: number;
  transcript: string;
  metrics: { words: number; wpm: number; fillerCount: number };
};

/** Answers of the redesigned assessment, as kept in the local draft and sent to `saveAssessment`. */
export type AssessmentAnswers = {
  goal?: string | null;
  gender?: 'Man' | 'Woman' | 'Prefer not to say' | null;
  age?: string | null;
  weight?: number | null;
  weightUnit?: 'kg' | 'lbs' | null;
  /** English mood-scale word (Tense … Great), kept for the summary and AI context. */
  mood?: string | null;
  moodScore?: number | null;
  soughtHelpBefore?: 'Yes' | 'No' | null;
  physicalDistress?: 'Yes' | 'No' | null;
  sleepQuality?: number | null;
  takingMeds?: TakingMeds | null;
  medications?: PickedMedication[];
  otherSymptoms?: string | null;
  stressBand?: number | null;
  soundCheck?: SoundCheckAnswer | null;
  reflectionText?: string | null;
  createdAt: string;
};

export type AssessmentDraft = { answers: AssessmentAnswers; step?: AssessmentStep };

const MOOD_WORDS = ['Tense', 'Low', 'Okay', 'Good', 'Great'];
const str = (v: unknown) => (typeof v === 'string' ? v : null);
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const inRange = (v: unknown, lo: number, hi: number) => {
  const n = num(v);
  return n != null && n >= lo && n <= hi ? n : null;
};

/**
 * Reads a saved draft, from this version or the previous screen, and drops anything malformed.
 * Old answers are carried over where they still mean the same thing: Yes / No medication answers,
 * the 0–10 stress level, a typed medication list, and Woman / Man / Prefer not to say.
 */
export function normaliseDraft(raw: unknown): AssessmentDraft | null {
  if (!raw || typeof raw !== 'object') return null;
  const draft = raw as { answers?: Record<string, unknown>; step?: unknown };
  const a = draft.answers;
  if (!a || typeof a !== 'object' || typeof a.createdAt !== 'string') return null;

  const gender = str(a.gender);
  const help = str(a.soughtHelpBefore);
  const physical = str(a.physicalDistress);
  const takingRaw = str(a.takingMeds);
  const takingMeds: TakingMeds | null = (TAKING_MEDS as readonly string[]).includes(takingRaw ?? '')
    ? (takingRaw as TakingMeds)
    : takingRaw === 'Yes'
      ? 'prescription'
      : takingRaw === 'No'
        ? 'none'
        : null;
  const mood = str(a.mood);
  const moodScore = inRange(a.moodScore, 1, 5) ?? (mood && MOOD_WORDS.includes(mood) ? MOOD_WORDS.indexOf(mood) + 1 : null);
  const medications = Array.isArray(a.medications)
    ? (a.medications as unknown[]).filter((m): m is PickedMedication => !!m && typeof (m as PickedMedication).name === 'string')
    : (str(a.meds) ?? '')
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean)
        .map((name) => ({ name, custom: true }));
  const sound = a.soundCheck as SoundCheckAnswer | null | undefined;
  const unit = str(a.weightUnit);

  return {
    step: typeof draft.step === 'string' ? (draft.step as AssessmentStep) : undefined,
    answers: {
      createdAt: a.createdAt,
      goal: str(a.goal),
      gender: gender === 'Man' || gender === 'Woman' || gender === 'Prefer not to say' ? gender : null,
      age: str(a.age),
      weight: num(a.weight),
      weightUnit: unit === 'kg' || unit === 'lbs' ? unit : null,
      mood: moodScore ? MOOD_WORDS[moodScore - 1] : null,
      moodScore,
      soughtHelpBefore: help === 'Yes' || help === 'No' ? help : null,
      physicalDistress: physical === 'Yes' || physical === 'No' ? physical : null,
      sleepQuality: inRange(a.sleepQuality, 1, 5),
      takingMeds,
      medications,
      otherSymptoms: str(a.otherSymptoms),
      stressBand: inRange(a.stressBand, 1, 5) ?? (num(a.stressLevel) != null ? stressBandFromLevel(num(a.stressLevel)!) : null),
      soundCheck: sound && typeof sound.uri === 'string' ? sound : null,
      reflectionText: str(a.reflectionText)?.slice(0, 250) ?? null,
    },
  };
}
