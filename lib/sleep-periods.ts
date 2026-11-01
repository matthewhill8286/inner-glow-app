/**
 * Sleep insights periods (06 §S8 Week, 09 §3.6 Month, §3.7 Year). A night belongs to the local day
 * it ended on. Periods are calendar periods: Monday–Sunday, the month, the year. Each is compared
 * with the one before it.
 */
export type Night = { startISO: string; endISO: string; duration?: number; factors?: string[] };
export type Period = 'week' | 'month' | 'year';

const DAY = 86_400_000;

export function nightHours(n: Night): number {
  if (n.duration && n.duration > 0) return n.duration / 60;
  return Math.max(0, (Date.parse(n.endISO) - Date.parse(n.startISO)) / 3_600_000);
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Hours slept per local wake day; several nights on one day add up (a nap counts with the night). */
export function hoursByDay(nights: Night[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const n of nights) {
    const end = new Date(n.endISO);
    if (!Number.isFinite(end.getTime())) continue;
    const key = dayKey(end);
    out.set(key, (out.get(key) ?? 0) + nightHours(n));
  }
  return out;
}

export function startOfPeriod(period: Period, now: Date, offset = 0): Date {
  if (period === 'week') {
    const monday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - ((now.getDay() + 6) % 7),
    );
    return new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 7 * offset);
  }
  if (period === 'month') return new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return new Date(now.getFullYear() + offset, 0, 1);
}

function endOfPeriod(period: Period, start: Date): Date {
  if (period === 'week')
    return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
  if (period === 'month') return new Date(start.getFullYear(), start.getMonth() + 1, 1);
  return new Date(start.getFullYear() + 1, 0, 1);
}

/**
 * The chart series: Week and Month have one value per day (null without a night or in the future),
 * Year has one monthly average per month (null for months without nights or still to come).
 */
export function periodSeries(
  nights: Night[],
  period: Period,
  now = new Date(),
  offset = 0,
): (number | null)[] {
  const byDay = hoursByDay(nights);
  const start = startOfPeriod(period, now, offset);
  if (period === 'year') {
    return Array.from({ length: 12 }, (_, m) => {
      const values: number[] = [];
      const days = new Date(start.getFullYear(), m + 1, 0).getDate();
      for (let d = 1; d <= days; d++) {
        const v = byDay.get(dayKey(new Date(start.getFullYear(), m, d)));
        if (v !== undefined) values.push(v);
      }
      return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
    });
  }
  const length =
    period === 'week' ? 7 : new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
  return Array.from({ length }, (_, i) => {
    const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return day.getTime() > now.getTime() ? null : (byDay.get(dayKey(day)) ?? null);
  });
}

/** Average hours per night with data in the period (offset −1 is the period before), or null. */
export function periodAverage(
  nights: Night[],
  period: Period,
  now = new Date(),
  offset = 0,
): number | null {
  const byDay = hoursByDay(nights);
  const start = startOfPeriod(period, now, offset);
  const end = Math.min(endOfPeriod(period, start).getTime(), now.getTime() + DAY);
  const values: number[] = [];
  for (let t = start.getTime(); t < end; t += DAY) {
    const v = byDay.get(dayKey(new Date(t)));
    if (v !== undefined) values.push(v);
  }
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

export function nightsInPeriod(nights: Night[], period: Period, now = new Date()): Night[] {
  const start = startOfPeriod(period, now).getTime();
  const end = endOfPeriod(period, startOfPeriod(period, now)).getTime();
  return nights.filter((n) => {
    const t = Date.parse(n.endISO);
    return t >= start && t < end;
  });
}

/**
 * How each logged factor moves sleep: the average of nights with it minus nights without it, in
 * minutes. Needs at least two nights each way; helps are the two largest gains, the way-getters the
 * two largest losses.
 */
export function factorImpacts(
  nights: Night[],
  minEach = 2,
): { helps: { key: string; minutes: number }[]; hurts: { key: string; minutes: number }[] } {
  const keys = [...new Set(nights.flatMap((n) => n.factors ?? []))];
  const impacts = keys
    .map((key) => {
      const withIt = nights.filter((n) => n.factors?.includes(key)).map(nightHours);
      const without = nights.filter((n) => !n.factors?.includes(key)).map(nightHours);
      if (withIt.length < minEach || without.length < minEach) return null;
      const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
      return { key, minutes: Math.round((avg(withIt) - avg(without)) * 60) };
    })
    .filter((x): x is { key: string; minutes: number } => !!x && x.minutes !== 0);
  return {
    helps: impacts
      .filter((i) => i.minutes > 0)
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 2),
    hurts: impacts
      .filter((i) => i.minutes < 0)
      .sort((a, b) => a.minutes - b.minutes)
      .slice(0, 2),
  };
}

/** Chart y for hours: 8 h at 32 and 5 h at 150 (39.33 pt per hour), clamped to the frame. */
export function chartY(hours: number, max = 150): number {
  return Math.min(max, Math.max(0, 150 - (hours - 5) * 39.33));
}

/** "7h 18m". */
export function formatHours(hours: number): string {
  const total = Math.round(hours * 60);
  return `${Math.floor(total / 60)}h ${String(total % 60).padStart(2, '0')}m`;
}
