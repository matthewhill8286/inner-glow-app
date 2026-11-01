/**
 * Reminder schedules for Notifications (06 P4) and the Edit reminder time sheet (08 §2.9).
 * Weekdays use expo-notifications numbering: 1 = Sunday … 7 = Saturday.
 */
export type ReminderSchedule = { hour: number; minute: number; weekdays: number[] };

export const ALL_DAYS = [2, 3, 4, 5, 6, 7, 1]; // Monday first, as the sheet draws them
const WEEKDAYS = [2, 3, 4, 5, 6];
const WEEKEND = [1, 7];

export function clock(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

const sameSet = (a: number[], b: number[]) =>
  a.length === b.length && b.every((d) => a.includes(d));

/** What the row subtitle says: every day, weekdays, weekends, or the listed days, then the time. */
export function scheduleSummary(weekdays: number[]): {
  kind: 'everyDay' | 'weekdays' | 'weekends' | 'days';
  days: number[];
} {
  const days = ALL_DAYS.filter((d) => weekdays.includes(d));
  if (days.length === 7) return { kind: 'everyDay', days };
  if (sameSet(days, WEEKDAYS)) return { kind: 'weekdays', days };
  if (sameSet(days, WEEKEND)) return { kind: 'weekends', days };
  return { kind: 'days', days };
}

/** One daily trigger when every day is on, otherwise one weekly trigger per chosen day. */
export function triggerPlan(
  schedule: ReminderSchedule,
): { daily: true } | { daily: false; weekdays: number[] } {
  const days = ALL_DAYS.filter((d) => schedule.weekdays.includes(d));
  return days.length === 7 ? { daily: true } : { daily: false, weekdays: days };
}

/** "22:30" → minutes after midnight. */
export function minutesOf(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Whether a time falls inside quiet hours, which may run past midnight (22:30 → 07:30). */
export function inQuietHours(hour: number, minute: number, from: string, to: string): boolean {
  const t = hour * 60 + minute;
  const a = minutesOf(from);
  const b = minutesOf(to);
  if (a === b) return false;
  return a < b ? t >= a && t < b : t >= a || t < b;
}

/** Minute choices in the sheet: every 5 minutes, with an off-step saved time kept as its own entry. */
export function minuteOptions(current: number): number[] {
  const steps = Array.from({ length: 12 }, (_, i) => i * 5);
  return steps.includes(current) ? steps : [...steps, current].sort((a, b) => a - b);
}

/** Password rule for Change password (08 §2.2): at least 8 characters with a number or symbol. */
export function passwordMeetsRule(password: string): boolean {
  return password.length >= 8 && /[^A-Za-z]/.test(password);
}
