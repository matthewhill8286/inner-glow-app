import type { SleepEntry } from './types';

/**
 * Data for the Sleep home screen S1 (06 §S1, §4.4). Pure functions so the
 * screen stays a thin view and the rules are unit tested.
 */

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

export type NightSummary = {
  entry: SleepEntry;
  startMs: number;
  endMs: number;
  /** Time asleep: the stage time minus awake stages when stages exist, else bedtime to wake. */
  asleepMinutes: number;
  deepMinutes: number | null;
  awakenings: number | null;
};

function bounds(e: Pick<SleepEntry, 'startISO' | 'endISO'>) {
  const startMs = Date.parse(e.startISO);
  const endMs = Date.parse(e.endISO);
  return Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs ? { startMs, endMs } : null;
}

export function summariseNight(entry: SleepEntry): NightSummary | null {
  const b = bounds(entry);
  if (!b) return null;
  const span = (b.endMs - b.startMs) / MINUTE;
  let asleepMinutes = span;
  let deepMinutes: number | null = null;
  if (entry.stages?.length) {
    let awake = 0;
    deepMinutes = 0;
    for (const s of entry.stages) {
      const m = (Date.parse(s.endISO) - Date.parse(s.startISO)) / MINUTE;
      if (!Number.isFinite(m) || m <= 0) continue;
      if (s.stage === 'awake') awake += m;
      if (s.stage === 'deep') deepMinutes += m;
    }
    asleepMinutes = Math.max(0, span - awake);
  }
  return { entry, ...b, asleepMinutes, deepMinutes, awakenings: entry.awakenings ?? null };
}

/** The most recent night by wake time. */
export function lastNight(entries: SleepEntry[]): NightSummary | null {
  let best: NightSummary | null = null;
  for (const e of entries) {
    const n = summariseNight(e);
    if (n && (!best || n.endMs > best.endMs)) best = n;
  }
  return best;
}

/**
 * "Best this month": the longest sleep among at least three nights that woke in the
 * same calendar month as this one. Ties count as best.
 */
export function isBestThisMonth(night: NightSummary, entries: SleepEntry[]): boolean {
  const month = (ms: number) => {
    const d = new Date(ms);
    return d.getFullYear() * 12 + d.getMonth();
  };
  const sameMonth = entries
    .map(summariseNight)
    .filter((n): n is NightSummary => !!n && month(n.endMs) === month(night.endMs));
  if (sameMonth.length < 3) return false;
  return sameMonth.every((n) => n.asleepMinutes <= night.asleepMinutes);
}

export type WeekBar = { dayStartMs: number; hours: number | null };

/** Monday-to-Sunday bars for the week containing `now`. A night belongs to the day it ended. */
export function weekBars(entries: SleepEntry[], now = Date.now()): { bars: WeekBar[]; avgHours: number | null } {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const mondayOffset = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayOffset);

  const bars: WeekBar[] = [];
  for (let i = 0; i < 7; i++) {
    const start = new Date(monday);
    start.setDate(monday.getDate() + i);
    bars.push({ dayStartMs: start.getTime(), hours: null });
  }
  for (const e of entries) {
    const n = summariseNight(e);
    if (!n) continue;
    const idx = bars.findIndex((b, i) => n.endMs >= b.dayStartMs && n.endMs < (bars[i + 1]?.dayStartMs ?? b.dayStartMs + DAY));
    if (idx >= 0) bars[idx].hours = (bars[idx].hours ?? 0) + n.asleepMinutes / 60;
  }
  const withData = bars.filter((b) => b.hours != null);
  const avgHours = withData.length ? withData.reduce((s, b) => s + (b.hours ?? 0), 0) / withData.length : null;
  return { bars, avgHours };
}

/** Bar height in the 96pt track: hours capped at 9 (06 §4.4). */
export function barHeight(hours: number, track = 96) {
  return (Math.min(Math.max(hours, 0), 9) / 9) * track;
}

/** "7h 50m", or "45m" under an hour. */
export function formatDuration(minutes: number) {
  const total = Math.round(minutes);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}

/** 24-hour "23:10" in the device's time zone. */
export function formatClock(ms: number) {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function clockFrom(hour: number, minute: number) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** Wind-down starts 30 minutes before bedtime (lib/notifications.ts uses the same offset). */
export function windDownClock(hour: number, minute: number) {
  const total = (hour * 60 + minute - 30 + 24 * 60) % (24 * 60);
  return clockFrom(Math.floor(total / 60), total % 60);
}

/** Whether a night still counts as "last night": it ended within the last 36 hours. */
export function isRecent(night: NightSummary, now = Date.now()) {
  return now - night.endMs < 36 * 60 * MINUTE;
}
