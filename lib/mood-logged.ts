import type { MoodCheckIn, MoodFactor } from './types';
import { moodScoreOf, type MoodScore } from './mood-scale';

/** Rules for the check-in's factor step and the Mood logged screen (04 §M4, §M5). */

export const MOOD_FACTORS: { key: MoodFactor; icon: 'line/journal' | 'line/moon' | 'line/users' | 'line/heart' | 'line/activity' | 'line/health' | 'line/leaf' | 'line/chart' | 'line/meditate' }[] = [
  { key: 'work', icon: 'line/journal' },
  { key: 'sleep', icon: 'line/moon' },
  { key: 'friends', icon: 'line/users' },
  { key: 'family', icon: 'line/heart' },
  { key: 'exercise', icon: 'line/activity' },
  { key: 'health', icon: 'line/health' },
  { key: 'weather', icon: 'line/leaf' },
  { key: 'money', icon: 'line/chart' },
  { key: 'alone_time', icon: 'line/meditate' },
];

/** "a", "a and b", "a, b and c" with the locale's word for "and". */
export function joinNatural(items: string[], and: string) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`;
}

/** A good day is one whose best check-in is Good or Great. Counts Monday to today. */
export function goodDaysThisWeek(checkIns: Pick<MoodCheckIn, 'createdAt' | 'mood'>[], now = Date.now()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const best = new Map<string, number>();
  for (const c of checkIns) {
    const at = Date.parse(c.createdAt);
    if (!Number.isFinite(at) || at < start.getTime() || at > now) continue;
    const d = new Date(at);
    const day = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    best.set(day, Math.max(best.get(day) ?? 0, moodScoreOf(c.mood)));
  }
  return [...best.values()].filter((s) => s >= 4).length;
}

/** Which follow-up line and suggestion fit the mood: celebrate, reflect, or be gentle. */
export function moodTone(score: MoodScore): 'positive' | 'neutral' | 'low' {
  if (score >= 4) return 'positive';
  if (score === 3) return 'neutral';
  return 'low';
}
