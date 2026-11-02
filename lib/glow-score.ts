/**
 * Rules for the Glow score screens (03 §2.2–2.7, §4.1–4.5), kept pure so they are unit tested.
 * A day's score is the last snapshot saved that local day. Periods are calendar periods: 1W is
 * Monday–Sunday, 1M the month, 3M this month and the two before it, 1Y the year. Each is compared
 * with the one before it.
 */

export type ScorePeriod = '1W' | '1M' | '3M' | '1Y';
export const SCORE_PERIODS: ScorePeriod[] = ['1W', '1M', '3M', '1Y'];

export type DayScore = { key: string; date: Date; score: number };

const DAY = 86_400_000;

export function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** One score per local day, newest first. Later snapshots on the same day replace earlier ones. */
export function dailyScores(history: { score: number; createdAt: string }[]): DayScore[] {
  const latest = new Map<string, { at: number; score: number }>();
  for (const h of history) {
    const at = Date.parse(h.createdAt);
    if (!Number.isFinite(at) || !Number.isFinite(h.score)) continue;
    const key = dayKey(new Date(at));
    const prev = latest.get(key);
    if (!prev || at > prev.at) latest.set(key, { at, score: Math.round(h.score) });
  }
  return [...latest.entries()]
    .map(([key, v]) => ({ key, date: startOfDay(new Date(v.at)), score: v.score }))
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function periodStart(period: ScorePeriod, now: Date, offset = 0): Date {
  if (period === '1W') {
    const monday = now.getDate() - ((now.getDay() + 6) % 7);
    return new Date(now.getFullYear(), now.getMonth(), monday + 7 * offset);
  }
  if (period === '1M') return new Date(now.getFullYear(), now.getMonth() + offset, 1);
  if (period === '3M') return new Date(now.getFullYear(), now.getMonth() - 2 + 3 * offset, 1);
  return new Date(now.getFullYear() + offset, 0, 1);
}

export function periodEnd(period: ScorePeriod, start: Date): Date {
  if (period === '1W') return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
  if (period === '1M') return new Date(start.getFullYear(), start.getMonth() + 1, 1);
  if (period === '3M') return new Date(start.getFullYear(), start.getMonth() + 3, 1);
  return new Date(start.getFullYear() + 1, 0, 1);
}

/** Days in the period, newest first. */
export function daysInPeriod(days: DayScore[], period: ScorePeriod, now: Date, offset = 0) {
  const start = periodStart(period, now, offset).getTime();
  const end = periodEnd(period, periodStart(period, now, offset)).getTime();
  return days.filter((d) => d.date.getTime() >= start && d.date.getTime() < end);
}

export type PeriodSummary = {
  count: number;
  average: number | null;
  best: number | null;
  lowest: number | null;
  /** Rounded change in average against the period before; null when either has no days. */
  delta: number | null;
};

const mean = (values: number[]) => values.reduce((a, v) => a + v, 0) / values.length;

export function periodSummary(days: DayScore[], period: ScorePeriod, now: Date): PeriodSummary {
  const current = daysInPeriod(days, period, now).map((d) => d.score);
  const previous = daysInPeriod(days, period, now, -1).map((d) => d.score);
  if (!current.length) return { count: 0, average: null, best: null, lowest: null, delta: null };
  const average = Math.round(mean(current));
  return {
    count: current.length,
    average,
    best: Math.max(...current),
    lowest: Math.min(...current),
    delta: previous.length ? average - Math.round(mean(previous)) : null,
  };
}

/**
 * Ring and row colour by score band. Figma gives no rule (03 §8); this one matches every mock
 * value: 95 lavender, 81 sky, 72 mustard, 65 plum.
 */
export function scoreColor(score: number): string {
  if (score >= 90) return '#8E7FA6';
  if (score >= 80) return '#7FC6F1';
  if (score >= 70) return '#E2CC40';
  return '#6B5279';
}

/** The status chip under the ring ("Normal range"), with the mood face it shows. */
export function scoreRange(score: number): { key: 'normal' | 'watch' | 'low'; face: 'mood/happy' | 'mood/neutral' | 'mood/sad' } {
  if (score >= 60) return { key: 'normal', face: 'mood/happy' };
  if (score >= 40) return { key: 'watch', face: 'mood/neutral' };
  return { key: 'low', face: 'mood/sad' };
}

/** "Above Average" → "aboveAverage", the `freudScore.*` translation keys. */
export function labelKey(label: string) {
  return label
    .toLowerCase()
    .split(' ')
    .map((w, i) => (i ? w[0].toUpperCase() + w.slice(1) : w))
    .join('');
}

/** Ring geometry (03 §4.1): sweep starts at 12 o'clock, clockwise, value × 3.6°. */
export function ringPoint(size: number, thickness: number, value: number) {
  const r = (size - thickness) / 2;
  const angle = ((Math.max(0, Math.min(100, value)) * 3.6 - 90) * Math.PI) / 180;
  return { x: size / 2 + r * Math.cos(angle), y: size / 2 + r * Math.sin(angle) };
}

/**
 * Range bar (03 §4.2): x for a value on a bar `width` wide. The domain is 50–100, widened to
 * lowest − 5 when the period dips under 50.
 */
export function rangeDomainMin(lowest: number | null) {
  return lowest !== null && lowest < 50 ? Math.max(0, lowest - 5) : 50;
}
export function rangeX(value: number, width: number, min: number) {
  const t = (Math.max(min, Math.min(100, value)) - min) / (100 - min);
  return t * width;
}

/** Trend chart points (03 §4.3): evenly spaced, [min − 2, max + 2] mapped onto 77.6 → 17.6 of a 104 tall frame. */
export function trendPoints(values: number[], width: number, height = 104) {
  if (!values.length) return [];
  const lo = Math.min(...values) - 2;
  const hi = Math.max(...values) + 2;
  const sy = height / 104;
  const step = values.length > 1 ? width / (values.length - 1) : 0;
  return values.map((v, i) => ({
    x: values.length > 1 ? i * step : width,
    y: (77.6 - ((v - lo) / (hi - lo)) * 60) * sy,
  }));
}

/** Oldest-first scores for the chart: one per day in the period. */
export function trendSeries(days: DayScore[], period: ScorePeriod, now: Date) {
  return daysInPeriod(days, period, now)
    .slice()
    .reverse()
    .map((d) => d.score);
}

export type MoodBucket = 'good' | 'okay' | 'low' | 'tense';
export const MOOD_BUCKETS: MoodBucket[] = ['good', 'okay', 'low', 'tense'];

/** The five check-in moods in four buckets (03 §8): Great and Good are both Good, Bad is Tense. */
export function moodBucket(mood: string): MoodBucket {
  if (mood === 'Great' || mood === 'Good') return 'good';
  if (mood === 'Okay') return 'okay';
  if (mood === 'Low') return 'low';
  return 'tense';
}

/** Whole-number shares that add up to 100 (largest remainder). */
export function moodMix(moods: string[]): { total: number; shares: Record<MoodBucket, number> } {
  const counts: Record<MoodBucket, number> = { good: 0, okay: 0, low: 0, tense: 0 };
  for (const m of moods) counts[moodBucket(m)]++;
  const total = moods.length;
  const shares: Record<MoodBucket, number> = { good: 0, okay: 0, low: 0, tense: 0 };
  if (!total) return { total, shares };
  const raw = MOOD_BUCKETS.map((b) => ({ b, v: (counts[b] * 100) / total }));
  for (const r of raw) shares[r.b] = Math.floor(r.v);
  let left = 100 - MOOD_BUCKETS.reduce((a, b) => a + shares[b], 0);
  for (const r of [...raw].sort((x, y) => (y.v % 1) - (x.v % 1))) {
    if (left <= 0) break;
    if (r.v > 0) {
      shares[r.b]++;
      left--;
    }
  }
  return { total, shares };
}

/**
 * Gradient stops for the mood mix bar (03 §4.4): each bucket holds its colour across its share,
 * with a 0.05 blend into the next one. Empty buckets are skipped.
 */
export function mixStops(shares: Record<MoodBucket, number>) {
  const stops: { offset: number; bucket: MoodBucket }[] = [];
  const present = MOOD_BUCKETS.filter((b) => shares[b] > 0);
  let at = 0;
  present.forEach((b, i) => {
    const end = at + shares[b] / 100;
    stops.push({ offset: i === 0 ? 0 : Math.min(end, at + 0.025), bucket: b });
    stops.push({ offset: i === present.length - 1 ? 1 : Math.max(at, end - 0.025), bucket: b });
    at = end;
  });
  return stops;
}

/**
 * What helps and what pulls the score down (03 §2.4): for each factor, the average score on days
 * with it minus the average on days without it. A factor needs two days on each side.
 */
export function factorImpacts(days: DayScore[], factorsByDay: Map<string, Set<string>>) {
  const keys = new Set<string>();
  for (const set of factorsByDay.values()) for (const k of set) keys.add(k);
  const impacts: { key: string; impact: number }[] = [];
  for (const key of keys) {
    const withIt = days.filter((d) => factorsByDay.get(d.key)?.has(key)).map((d) => d.score);
    const without = days.filter((d) => !factorsByDay.get(d.key)?.has(key)).map((d) => d.score);
    if (withIt.length < 2 || without.length < 2) continue;
    const impact = Math.round(mean(withIt) - mean(without));
    if (impact !== 0) impacts.push({ key, impact });
  }
  return {
    helps: impacts.filter((i) => i.impact > 0).sort((a, b) => b.impact - a.impact).slice(0, 3),
    hurts: impacts.filter((i) => i.impact < 0).sort((a, b) => a.impact - b.impact).slice(0, 2),
  };
}

/** "+8" / "−7" with a true minus sign. */
export function signed(n: number) {
  return `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n)}`;
}

/** Group label for a history card: this week, last week, or the month it belongs to. */
export function historyGroup(date: Date, now: Date): 'thisWeek' | 'lastWeek' | 'earlier' {
  const thisWeek = periodStart('1W', now).getTime();
  if (date.getTime() >= thisWeek) return 'thisWeek';
  if (date.getTime() >= thisWeek - 7 * DAY) return 'lastWeek';
  return 'earlier';
}

/** Minutes in a suggestion duration such as "15 min", "1 hour" or "1h 30m". */
export function durationMinutes(d: string | null | undefined): number | null {
  if (!d) return null;
  const lower = d.toLowerCase();
  const hours = lower.match(/(\d+(?:\.\d+)?)\s*h/);
  const mins = lower.match(/(\d+)\s*m/);
  let total = 0;
  if (hours) total += parseFloat(hours[1]) * 60;
  if (mins) total += parseInt(mins[1], 10);
  if (!total) {
    const n = parseInt(lower.replace(/\D/g, ''), 10);
    return n > 0 ? n : null;
  }
  return Math.round(total);
}

/** "25 min", "1 h", "1.5 h". */
export function formatMinutes(minutes: number) {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.round((minutes / 60) * 2) / 2;
  return `${Number.isInteger(h) ? h : h.toFixed(1)} h`;
}

export type PlanCategory = 'mindfulness' | 'physical' | 'social' | 'professional';
export const PLAN_CATEGORIES: PlanCategory[] = ['mindfulness', 'physical', 'social', 'professional'];

type PlanItem = { category: string; completed: boolean; completedAt: string | null; duration: string | null; points?: number | null };

/** Today's plan: everything still to do, plus what was done today. */
export function planItems<T extends PlanItem>(suggestions: T[], now: Date): T[] {
  const today = startOfDay(now).getTime();
  return suggestions.filter((s) => !s.completed || (s.completedAt !== null && Date.parse(s.completedAt) >= today));
}

/** One row per category in the plan (03 §2.5), with the summed duration and what is left. */
export function planCategories<T extends PlanItem>(items: T[]) {
  return PLAN_CATEGORIES.map((category) => {
    const inCategory = items.filter((s) => s.category === category);
    const minutes = inCategory.reduce((a, s) => a + (durationMinutes(s.duration) ?? 0), 0);
    return {
      category,
      items: inCategory,
      pending: inCategory.filter((s) => !s.completed).length,
      minutes,
    };
  }).filter((c) => c.items.length > 0);
}

/** Points a completed suggestion adds to the score, as `useFreudScore` applies them. */
export function suggestionBonus(points: number | null | undefined) {
  return Math.max(1, Math.min(points ?? 5, 5));
}
