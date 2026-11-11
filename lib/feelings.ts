/**
 * Feelings (TestFlight report 38): people can feel several things at once, so the assessment and
 * the mood check-in let them pick any number alongside the five-step mood. They are stored in
 * English, like the mood words, so the AI context and history read the same in every language.
 */
export const FEELINGS = [
  'calm',
  'happy',
  'hopeful',
  'grateful',
  'tired',
  'anxious',
  'sad',
  'overwhelmed',
  'angry',
] as const;
export type Feeling = (typeof FEELINGS)[number];

const EN: Record<Feeling, string> = {
  calm: 'Calm',
  happy: 'Happy',
  hopeful: 'Hopeful',
  grateful: 'Grateful',
  tired: 'Tired',
  anxious: 'Anxious',
  sad: 'Sad',
  overwhelmed: 'Overwhelmed',
  angry: 'Angry',
};

export const feelingWord = (f: Feeling) => EN[f];

/** Stored English words back to keys, ignoring anything unknown. */
export function feelingsFromWords(words: readonly string[] | null | undefined): Feeling[] {
  const byWord = new Map(FEELINGS.map((f) => [EN[f].toLowerCase(), f]));
  const out: Feeling[] = [];
  for (const w of words ?? []) {
    const f = byWord.get(String(w).trim().toLowerCase());
    if (f && !out.includes(f)) out.push(f);
  }
  return out;
}

export function toggleFeeling(list: readonly Feeling[], f: Feeling): Feeling[] {
  return list.includes(f) ? list.filter((x) => x !== f) : [...list, f];
}

/** The assessment's mood text: the scale word first, then each feeling on its own line. */
export function moodWithFeelings(
  mood: string | null | undefined,
  feelings: readonly Feeling[],
): string | null {
  const lines = [mood, ...feelings.map(feelingWord)].filter(Boolean) as string[];
  return lines.length ? lines.join('\n') : null;
}
