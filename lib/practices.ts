/**
 * Practice timing and goal maths (07 §2.7, §3.1; 10 §3.7, §3.9–3.10).
 */
export type Pace = 'slow' | 'normal' | 'fast';
export const PACE_FACTOR: Record<Pace, number> = { slow: 1.25, normal: 1, fast: 0.8 };

export type Phase = 'inhale' | 'hold' | 'exhale' | 'holdAfter';
type Pattern = { inhale: number; hold: number; exhale: number; holdAfter: number };

/** Phases with their seconds at this pace, skipping phases of length 0. */
export function phaseSteps(
  pattern: Pattern,
  pace: Pace = 'normal',
): { phase: Phase; seconds: number }[] {
  const f = PACE_FACTOR[pace];
  return (['inhale', 'hold', 'exhale', 'holdAfter'] as Phase[])
    .map((phase) => ({ phase, seconds: pattern[phase] * f }))
    .filter((s) => s.seconds > 0);
}

export function cycleSeconds(pattern: Pattern, pace: Pace = 'normal'): number {
  return phaseSteps(pattern, pace).reduce((a, s) => a + s.seconds, 0);
}

/** Where `elapsed` seconds fall: the phase, how far into it (0–1), and completed breaths. */
export function breathAt(
  pattern: Pattern,
  pace: Pace,
  elapsed: number,
): { phase: Phase; progress: number; breath: number } {
  const steps = phaseSteps(pattern, pace);
  const cycle = cycleSeconds(pattern, pace);
  const breath = Math.floor(elapsed / cycle);
  let t = elapsed - breath * cycle;
  for (const s of steps) {
    if (t < s.seconds) return { phase: s.phase, progress: t / s.seconds, breath };
    t -= s.seconds;
  }
  return { phase: steps[steps.length - 1].phase, progress: 1, breath };
}

/** Breaths in a session: whole cycles that fit in the duration, at least one. */
export function totalBreaths(pattern: Pattern, pace: Pace, minutes: number): number {
  return Math.max(1, Math.floor((minutes * 60) / cycleSeconds(pattern, pace)));
}

/** Orb scale for the phase: in grows 0.8 → 1, hold keeps 1, out shrinks 1 → 0.8, hold-after keeps 0.8. */
export function orbScale(phase: Phase, progress: number): number {
  const ease = (x: number) => 0.5 - Math.cos(Math.PI * x) / 2;
  if (phase === 'inhale') return 0.8 + 0.2 * ease(progress);
  if (phase === 'exhale') return 1 - 0.2 * ease(progress);
  return phase === 'hold' ? 1 : 0.8;
}

/** "01:08". */
export function mmss(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/** End early copy: "48 seconds" under a minute, otherwise whole minutes (07 §2.8, 10 §3.8). */
export function doneSoFar(seconds: number): { unit: 'seconds' | 'minutes'; value: number } {
  return seconds < 60
    ? { unit: 'seconds', value: Math.floor(seconds) }
    : { unit: 'minutes', value: Math.floor(seconds / 60) };
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Mindful minutes today and yesterday, for the hub ring and its delta pill. */
export function minutesTodayAndYesterday(
  sessions: { seconds: number; dateISO: string }[],
  now = new Date(),
): { today: number; yesterday: number } {
  const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  let today = 0;
  let yesterday = 0;
  for (const s of sessions) {
    const d = new Date(s.dateISO);
    if (sameDay(d, now)) today += s.seconds;
    else if (sameDay(d, y)) yesterday += s.seconds;
  }
  return { today: Math.round(today / 60), yesterday: Math.round(yesterday / 60) };
}

export const GOAL_MIN = 5;
export const GOAL_MAX = 60;
export const GOAL_STEP = 5;
export const DEFAULT_GOAL = 10;

export function stepGoal(value: number, direction: 1 | -1): number {
  return Math.min(
    GOAL_MAX,
    Math.max(GOAL_MIN, Math.round(value / GOAL_STEP) * GOAL_STEP + direction * GOAL_STEP),
  );
}

/** When the goal nudge should fire next: 19:00 today if the goal is not met and it is not past 19:00, else tomorrow. */
export function nextNudge(todayMinutes: number, goal: number, now = new Date(), hour = 19): Date {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour);
  if (todayMinutes < goal && now.getTime() < today.getTime()) return today;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, hour);
}

/** Bar colour per category (07 §2.3): the day takes the category of its longest session. */
export const CATEGORY_COLOR: Record<string, string> = {
  breathing: '#7FC6F1',
  'relax-body': '#E2CC40',
  'relax-mind': '#E2CC40',
  sleep: '#D8B4D8',
  mindfulness: '#8E7FA6',
};

/**
 * Your sessions week card: minutes and the longest session's category for each day Monday–Sunday,
 * plus this week's total minutes and session count.
 */
export function practiceWeek(
  sessions: { seconds: number; dateISO: string; category?: string | null }[],
  now = new Date(),
): { days: { minutes: number; category: string | null }[]; minutes: number; count: number } {
  const monday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - ((now.getDay() + 6) % 7),
  );
  const days = Array.from({ length: 7 }, () => ({
    seconds: 0,
    longest: 0,
    category: null as string | null,
  }));
  let count = 0;
  for (const s of sessions) {
    const d = new Date(s.dateISO);
    const i = Math.floor(
      (new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - monday.getTime()) /
        86_400_000,
    );
    if (i < 0 || i > 6) continue;
    count++;
    days[i].seconds += s.seconds;
    if (s.seconds > days[i].longest) {
      days[i].longest = s.seconds;
      days[i].category = s.category ?? null;
    }
  }
  return {
    days: days.map((d) => ({ minutes: Math.round(d.seconds / 60), category: d.category })),
    minutes: Math.round(days.reduce((a, d) => a + d.seconds, 0) / 60),
    count,
  };
}
