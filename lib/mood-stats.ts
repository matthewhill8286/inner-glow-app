/**
 * Mood stats (no frame): the chart buckets and the summary for a period. Kept free of imports so the
 * tests can load it on its own; days are matched in local time.
 */

export type MoodPeriod = 'day' | 'week' | 'month';
type Log = {
  createdAt: string;
  mood: string;
  energy?: number | null;
  stress?: number | null;
  factors?: string[] | null;
};

const SCORES: Record<string, number> = { Bad: 1, Low: 2, Okay: 3, Good: 4, Great: 5 };
const scoreOf = (mood: string) => SCORES[mood] ?? 3;
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** The check-ins inside the period: today, the last 7 days, or the last 4 weeks (both including today). */
export function inPeriod<T extends Log>(logs: T[], period: MoodPeriod, now = new Date()): T[] {
  const today = startOfDay(now);
  const from =
    period === 'day'
      ? today
      : new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - (period === 'week' ? 6 : 27),
        );
  return logs.filter((l) => {
    const t = Date.parse(l.createdAt);
    return t >= from.getTime() && t <= now.getTime();
  });
}

/**
 * Chart buckets. Day: six three-hour slots from 06:00. Week: the last seven days, oldest first.
 * Month: the last four weeks, oldest first. `avg` is the mean mood score (1–5), or null when empty.
 */
export function moodBuckets(
  logs: Log[],
  period: MoodPeriod,
  now = new Date(),
): { start: Date; avg: number | null; count: number }[] {
  const today = startOfDay(now);
  const ranges: [Date, Date][] =
    period === 'day'
      ? Array.from({ length: 6 }, (_, i) => [
          new Date(today.getFullYear(), today.getMonth(), today.getDate(), 6 + i * 3),
          new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            i === 5 ? 24 : 9 + i * 3,
          ),
        ])
      : period === 'week'
        ? Array.from({ length: 7 }, (_, i) => {
            const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6 + i);
            return [d, new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)];
          })
        : Array.from({ length: 4 }, (_, i) => {
            const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 27 + i * 7);
            return [d, new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7)];
          });
  return ranges.map(([start, end]) => {
    const inside = logs.filter((l) => {
      const t = Date.parse(l.createdAt);
      return t >= start.getTime() && t < end.getTime();
    });
    return { start, avg: avg(inside.map((l) => scoreOf(l.mood))), count: inside.length };
  });
}

/** Average mood, the optional older energy and stress, the most common mood and the top three factors. */
export function moodSummary(logs: Log[]) {
  if (!logs.length) return null;
  const moods = new Map<string, number>();
  const factors = new Map<string, number>();
  for (const l of logs) {
    moods.set(l.mood, (moods.get(l.mood) ?? 0) + 1);
    for (const f of l.factors ?? []) factors.set(f, (factors.get(f) ?? 0) + 1);
  }
  const top = [...moods.entries()].sort((a, b) => b[1] - a[1] || scoreOf(b[0]) - scoreOf(a[0]))[0];
  return {
    count: logs.length,
    avgMood: avg(logs.map((l) => scoreOf(l.mood)))!,
    avgEnergy: avg(logs.map((l) => l.energy).filter((v): v is number => typeof v === 'number')),
    avgStress: avg(logs.map((l) => l.stress).filter((v): v is number => typeof v === 'number')),
    topMood: top[0],
    topMoodCount: top[1],
    topFactors: [...factors.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([f]) => f),
  };
}
