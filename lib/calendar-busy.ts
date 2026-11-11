/**
 * Calendar in Connected apps (`6839:8758`). Inner Glow reads event counts only, never titles or
 * attendees, to compare mood on busy days with quieter ones.
 */
export const BUSY_EVENTS = 4;
export const MIN_DAYS_EACH = 3;

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

/** Timed events per local day. All-day events (holidays, birthdays) don't make a day busy. */
export function eventsPerDay(
  events: { startDate: string | Date; allDay?: boolean }[],
): Map<string, number> {
  const out = new Map<string, number>();
  for (const e of events) {
    if (e.allDay) continue;
    const d = new Date(e.startDate);
    if (!Number.isFinite(d.getTime())) continue;
    const k = dayKey(d);
    out.set(k, (out.get(k) ?? 0) + 1);
  }
  return out;
}

/** Average mood (1–5) on busy and quieter days, or null until each side has enough days. */
export function moodByBusyness(
  checkIns: { createdAt: string; score: number }[],
  perDay: Map<string, number>,
): { busy: number; quiet: number; busyDays: number; quietDays: number } | null {
  const byDay = new Map<string, number[]>();
  for (const c of checkIns) {
    const d = new Date(c.createdAt);
    if (!Number.isFinite(d.getTime())) continue;
    const k = dayKey(d);
    byDay.set(k, [...(byDay.get(k) ?? []), c.score]);
  }
  const busy: number[] = [];
  const quiet: number[] = [];
  for (const [k, scores] of byDay) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    ((perDay.get(k) ?? 0) >= BUSY_EVENTS ? busy : quiet).push(avg);
  }
  if (busy.length < MIN_DAYS_EACH || quiet.length < MIN_DAYS_EACH) return null;
  const mean = (xs: number[]) => Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10;
  return { busy: mean(busy), quiet: mean(quiet), busyDays: busy.length, quietDays: quiet.length };
}
