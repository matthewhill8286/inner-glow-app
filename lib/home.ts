import type { MoodCheckIn, SleepEntry } from './types';

/** Rules for the Home screen (03 §2.1, 09 §3.9), kept pure so they are unit tested. */

export type Trend = 'up' | 'down' | null;

export function greetingKey(hour: number): 'goodMorning' | 'goodAfternoon' | 'goodEvening' {
  if (hour < 12) return 'goodMorning';
  if (hour < 17) return 'goodAfternoon';
  return 'goodEvening';
}

/** First day: nothing logged yet, so Home shows the empty state instead of a zero score (09 §3.9). */
export function isFirstDay(moodCount: number, scoreCount: number) {
  return moodCount === 0 && scoreCount === 0;
}

/**
 * Glow score history appears after check-ins on three different days (09 §3.10); until then the
 * screen shows its empty state. Days are counted in local time.
 */
export const SCORE_HISTORY_MIN_DAYS = 3;
export function checkInDays(checkIns: { createdAt: string }[]): number {
  return new Set(
    checkIns.map((c) => {
      const d = new Date(c.createdAt);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }),
  ).size;
}

export function trend(current: number | null | undefined, previous: number | null | undefined): Trend {
  if (current == null || previous == null || current === previous) return null;
  return current > previous ? 'up' : 'down';
}

/** Stress 0–10 from the check-in, bucketed into the words the legend shows. */
export function stressLevel(stress: number): 'low' | 'medium' | 'high' {
  if (stress <= 3) return 'low';
  if (stress <= 6) return 'medium';
  return 'high';
}

const byNewest = <T>(items: T[], at: (item: T) => number) =>
  items.filter((i) => Number.isFinite(at(i))).sort((a, b) => at(b) - at(a));

/** Latest check-in and the one before it, for the mood and stress rows. */
export function latestTwoCheckIns(checkIns: MoodCheckIn[]) {
  const sorted = byNewest(checkIns, (c) => Date.parse(c.createdAt));
  return { latest: sorted[0] ?? null, previous: sorted[1] ?? null };
}

/** Today's check-in, if there is one: the slider then edits it instead of creating a new one. */
export function todaysCheckIn(checkIns: MoodCheckIn[], now = Date.now()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return byNewest(checkIns, (c) => Date.parse(c.createdAt)).find((c) => Date.parse(c.createdAt) >= start.getTime()) ?? null;
}

const asleepMinutes = (e: Pick<SleepEntry, 'startISO' | 'endISO'>) => (Date.parse(e.endISO) - Date.parse(e.startISO)) / 60000;

/** Last two nights by wake time, as minutes in bed. */
export function latestTwoNights(entries: SleepEntry[]) {
  const sorted = byNewest(
    entries.filter((e) => asleepMinutes(e) > 0),
    (e) => Date.parse(e.endISO),
  );
  return {
    latest: sorted[0] ? asleepMinutes(sorted[0]) : null,
    previous: sorted[1] ? asleepMinutes(sorted[1]) : null,
  };
}

/** The most recent saved score from an earlier day, to compare today's live score against. */
export function previousDayScore(history: { score: number; createdAt: string }[], now = Date.now()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return byNewest(history, (h) => Date.parse(h.createdAt)).find((h) => Date.parse(h.createdAt) < start.getTime())?.score ?? null;
}

/** "6h 40m". */
export function formatSleep(minutes: number) {
  const total = Math.round(minutes);
  return `${Math.floor(total / 60)}h ${String(total % 60).padStart(2, '0')}m`;
}
