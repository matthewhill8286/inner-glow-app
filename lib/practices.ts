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
