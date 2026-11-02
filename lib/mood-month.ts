/**
 * Mood history month (04 §M6): a Monday-first calendar with one disc per day, and the month's mood
 * mix. A day with several check-ins shows the latest, which is also the one Day details opens, as
 * on the Mood home week (`lib/mood-week.ts`). Kept pure so it is unit tested.
 */

export type MonthLog = { id: string; createdAt: string; mood: 'Great' | 'Good' | 'Okay' | 'Low' | 'Bad' };

const SCORE: Record<MonthLog['mood'], 1 | 2 | 3 | 4 | 5> = { Bad: 1, Low: 2, Okay: 3, Good: 4, Great: 5 };

export type DayCell<T> = {
  day: number;
  /** 0 = Monday … 6 = Sunday. */
  column: number;
  row: number;
  log: T | null;
  score: 1 | 2 | 3 | 4 | 5 | null;
  today: boolean;
  future: boolean;
};

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/** The month's first day, `offset` months from `now`. */
export const monthStart = (now: Date, offset = 0) => new Date(now.getFullYear(), now.getMonth() + offset, 1);

/** One cell per day of the month, placed in Monday-first weeks. */
export function monthGrid<T extends MonthLog>(logs: T[], month: Date, now = new Date()): DayCell<T>[] {
  const latest = new Map<string, T>();
  for (const l of logs) {
    const key = dayKey(new Date(l.createdAt));
    const prev = latest.get(key);
    if (!prev || Date.parse(l.createdAt) > Date.parse(prev.createdAt)) latest.set(key, l);
  }
  const lead = (month.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const todayKey = dayKey(now);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(month.getFullYear(), month.getMonth(), i + 1);
    const log = latest.get(dayKey(date)) ?? null;
    const slot = lead + i;
    return {
      day: i + 1,
      column: slot % 7,
      row: Math.floor(slot / 7),
      log,
      score: log ? SCORE[log.mood] : null,
      today: dayKey(date) === todayKey,
      future: date.getTime() >= endOfToday,
    };
  });
}

/** Number of week rows the month needs (4 to 6). */
export const monthRows = (month: Date) => {
  const lead = (month.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return Math.ceil((lead + days) / 7);
};

/**
 * The month's mix (04 §M6): every check-in counts. `mostly` is the most common score; a tie goes to
 * the higher score. `shares` are fractions per score, 5 (Great) first, as the bar is drawn.
 */
export function monthSummary(logs: MonthLog[], month: Date) {
  const start = month.getTime();
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 1).getTime();
  const inMonth = logs.filter((l) => {
    const t = Date.parse(l.createdAt);
    return t >= start && t < end;
  });
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const l of inMonth) counts[SCORE[l.mood]]++;
  const order = [5, 4, 3, 2, 1] as const;
  const mostly = inMonth.length ? order.reduce((best, s) => (counts[s] > counts[best] ? s : best), 5 as 1 | 2 | 3 | 4 | 5) : null;
  const shares = order.map((score) => ({ score, share: inMonth.length ? counts[score] / inMonth.length : 0 }));
  return { total: inMonth.length, mostly, shares };
}

/** Bar gradient stops: each present score holds its colour with a 0.03 blend into the next. */
export function mixStops(shares: { score: 1 | 2 | 3 | 4 | 5; share: number }[]) {
  const present = shares.filter((s) => s.share > 0);
  const stops: { offset: number; score: 1 | 2 | 3 | 4 | 5 }[] = [];
  let at = 0;
  present.forEach((s, i) => {
    const end = at + s.share;
    stops.push({ offset: i === 0 ? 0 : Math.min(end, at + 0.015), score: s.score });
    stops.push({ offset: i === present.length - 1 ? 1 : Math.max(at, end - 0.015), score: s.score });
    at = end;
  });
  return stops;
}
