import type { IconName } from '@/components/icons/iconData';
import type { MoodCheckIn } from './types';

/**
 * The canonical five-step mood scale (04 §A). Score is what `mood_logs.mood_score` stores.
 * The app's older mood words map onto it: Bad is Tense.
 */
export type MoodScore = 1 | 2 | 3 | 4 | 5;

export type MoodStep = {
  score: MoodScore;
  /** i18n key under `moodScale.` */
  key: 'tense' | 'low' | 'okay' | 'good' | 'great';
  color: string;
  /** Position of this colour on the slider gradient, 0–1. */
  stop: number;
  /** Gradient colour at `stop` (Okay uses a lighter tone on the track). */
  trackColor: string;
  face: IconName;
  checkIn: MoodCheckIn['mood'];
};

export const MOOD_SCALE: MoodStep[] = [
  { score: 1, key: 'tense', color: '#FFB3BE', stop: 0, trackColor: '#FFB3BE', face: 'mood/angry', checkIn: 'Bad' },
  { score: 2, key: 'low', color: '#D8B4D8', stop: 0.27, trackColor: '#D8B4D8', face: 'mood/sad', checkIn: 'Low' },
  { score: 3, key: 'okay', color: '#E8DFD2', stop: 0.5, trackColor: '#EFE6DA', face: 'mood/neutral', checkIn: 'Okay' },
  { score: 4, key: 'good', color: '#E2CC40', stop: 0.73, trackColor: '#E2CC40', face: 'mood/happy', checkIn: 'Good' },
  { score: 5, key: 'great', color: '#7FC6F1', stop: 1, trackColor: '#7FC6F1', face: 'mood/very-happy', checkIn: 'Great' },
];

export function moodStep(score: number): MoodStep {
  return MOOD_SCALE[Math.min(5, Math.max(1, Math.round(score))) - 1];
}

export function moodScoreOf(mood: MoodCheckIn['mood']): MoodScore {
  return (MOOD_SCALE.find((m) => m.checkIn === mood)?.score ?? 3) as MoodScore;
}

/** Slider stop for a horizontal position on a track `width` wide with 10pt end insets (04 §B1). */
export function scoreAtX(x: number, width: number, inset = 10): MoodScore {
  const usable = Math.max(1, width - inset * 2);
  const index = Math.round(((x - inset) / usable) * 4);
  return (Math.min(4, Math.max(0, index)) + 1) as MoodScore;
}

export function xForScore(score: MoodScore, width: number, inset = 10) {
  return inset + ((score - 1) / 4) * (width - inset * 2);
}

/** Average of the values that are present; null when none are (energy and stress are optional). */
export function averageOf(values: (number | null | undefined)[]): number | null {
  const present = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  return present.length ? present.reduce((a, v) => a + v, 0) / present.length : null;
}

/**
 * Mood orb colours per mood (04 §A, §B3): outer and inner glow. The aura contours are the
 * Figma art: Tense has its own wavy aura, the other moods share the Good one (Low flattened).
 */
export const ORB_LOOK: Record<MoodScore, { outer: string; inner: string; aura: 'good' | 'tense'; squash: number }> = {
  1: { outer: '#FFB3BE', inner: '#D8B4D8', aura: 'tense', squash: 1 },
  2: { outer: '#D8B4D8', inner: '#FFB3BE', aura: 'good', squash: 0.88 },
  3: { outer: '#E8DFD2', inner: '#FFF6D6', aura: 'good', squash: 1 },
  4: { outer: '#E2CC40', inner: '#FFF6D6', aura: 'good', squash: 1 },
  5: { outer: '#7FC6F1', inner: '#E2CC40', aura: 'good', squash: 1 },
};
