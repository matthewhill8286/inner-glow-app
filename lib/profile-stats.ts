/**
 * Profile numbers (06 P1) and Your streak (`6801:6342`). A day "counts" when there is any mood
 * check-in, journal entry or mindful session on it, in local time.
 */

export type MoodName = 'Great' | 'Good' | 'Okay' | 'Low' | 'Bad';
const MOOD_VALUE: Record<MoodName, number> = { Great: 5, Good: 4, Okay: 3, Low: 2, Bad: 1 };

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export function activeDays(isoDates: (string | null | undefined)[]): Set<string> {
  const out = new Set<string>();
  for (const iso of isoDates) {
    const t = iso ? Date.parse(iso) : NaN;
    if (Number.isFinite(t)) out.add(dayKey(new Date(t)));
  }
  return out;
}

/**
 * The current streak. Today does not break it before it is over. One missed day pauses the streak
 * (it neither counts nor resets); two missed days in a row end it. Returns the count and the days in it.
 */
export function streak(
  active: Set<string>,
  today = new Date(),
): { count: number; days: Set<string> } {
  const days = new Set<string>();
  let d = active.has(dayKey(today)) ? today : addDays(today, -1);
  let missed = 0;
  for (let i = 0; i < 3660; i++, d = addDays(d, -1)) {
    if (active.has(dayKey(d))) {
      days.add(dayKey(d));
      missed = 0;
    } else if (++missed >= 2) break;
  }
  return { count: days.size, days };
}

export type StreakDayState = 'none' | 'active' | 'streak' | 'today';

/** One entry per day of `today`'s month: in the streak, active before it, today (not yet done) or none. */
export function monthDays(
  active: Set<string>,
  streakDays: Set<string>,
  today = new Date(),
): { day: number; state: StreakDayState }[] {
  const last = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const out: { day: number; state: StreakDayState }[] = [];
  for (let day = 1; day <= Math.min(last, today.getDate()); day++) {
    const key = dayKey(new Date(today.getFullYear(), today.getMonth(), day));
    const state: StreakDayState = streakDays.has(key)
      ? 'streak'
      : active.has(key)
        ? 'active'
        : day === today.getDate()
          ? 'today'
          : 'none';
    out.push({ day, state });
  }
  return out;
}

export const STREAK_MILESTONES = [3, 7, 14, 30] as const;

/** Average mood (1–5) for each day Monday to Sunday of the current week, or null for a day without one. */
export function weekMoodBars(
  checkIns: { createdAt: string; mood: MoodName }[],
  now = new Date(),
): (number | null)[] {
  const monday = addDays(now, -((now.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const key = dayKey(addDays(monday, i));
    const values = checkIns
      .filter((c) => dayKey(new Date(c.createdAt)) === key)
      .map((c) => MOOD_VALUE[c.mood] ?? 3);
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  });
}

/** The most common mood this week (latest wins a tie), or null without check-ins. */
export function weekMood(
  checkIns: { createdAt: string; mood: MoodName }[],
  now = new Date(),
): MoodName | null {
  const monday = addDays(now, -((now.getDay() + 6) % 7)).getTime();
  const week = checkIns
    .filter((c) => Date.parse(c.createdAt) >= monday)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const counts = new Map<MoodName, number>();
  for (const c of week) counts.set(c.mood, (counts.get(c.mood) ?? 0) + 1);
  let best: MoodName | null = null;
  for (const c of week)
    if (best === null || (counts.get(c.mood) ?? 0) > (counts.get(best) ?? 0)) best = c.mood;
  return best;
}

/** Score change against the last saved score from at least seven days ago; null without one. */
export function scoreChange(
  current: number,
  history: { score: number; createdAt: string }[],
  now = Date.now(),
): number | null {
  const cutoff = now - 7 * 86_400_000;
  const before = history
    .filter((h) => Date.parse(h.createdAt) <= cutoff)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
  return before ? Math.round(current - before.score) : null;
}

/** The name to greet someone by: their nickname, else the first word of their name. */
export function greetingName(
  profile: { nickname?: string | null; name?: string | null } | null | undefined,
): string {
  return profile?.nickname?.trim() || (profile?.name ?? '').trim().split(/\s+/)[0] || '';
}
