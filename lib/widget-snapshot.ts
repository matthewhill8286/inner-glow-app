/**
 * The data Home writes for the widgets (`targets/widget/Shared.swift` reads it). Only summaries are
 * shared: no journal text, notes or chats.
 */
export type WidgetSnapshot = {
  score?: number;
  scoreTrend?: 'up' | 'down' | 'stable';
  scoreWeekDelta?: number;
  scoreSeries?: number[];
  mood?: string;
  sleep?: string;
  sleepNote?: string;
  sleepBars?: number[];
  stress?: string;
  streak?: number;
  nextPractice?: string;
  nextPracticeURL?: string;
  windDownAt?: number;
  weekMoods?: number[];
  glowPrompt?: string;
  labels?: Record<string, string>;
};

const DAY = 86_400_000;

/** Score points in time order, the last seven, and the change against a week ago. */
export function scoreSummary(
  history: { score: number; createdAt: string }[],
  current: number,
  now = Date.now(),
) {
  const sorted = [...history].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  const series = [...sorted.slice(-6).map((h) => Math.round(h.score)), Math.round(current)];
  const weekAgo = [...sorted].reverse().find((h) => Date.parse(h.createdAt) <= now - 7 * DAY);
  return { series, weekDelta: weekAgo ? Math.round(current - weekAgo.score) : undefined };
}

/** Mood score per day for the last seven days (oldest first), 0 where there was no check-in. */
export function weekMoodDots(
  checkIns: { createdAt: string; score: number }[],
  now = new Date(),
): number[] {
  const out: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const next = day.getTime() + DAY;
    const today = checkIns
      .filter((c) => {
        const t = Date.parse(c.createdAt);
        return t >= day.getTime() && t < next;
      })
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    out.push(today[0]?.score ?? 0);
  }
  return out;
}

/** Up to seven nights (oldest first), scaled 0–1 against the longest. */
export function sleepBars(minutes: number[]): number[] {
  const last = minutes.slice(-7);
  const max = Math.max(...last, 1);
  return last.map((m) => Math.round((m / max) * 100) / 100);
}

/** A short reflection prompt for the Glow AI widget, changing once a day. */
export function dailyPrompt(prompts: string[], now = new Date()): string | undefined {
  if (!prompts.length) return undefined;
  const dayIndex = Math.floor(
    new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / DAY,
  );
  return prompts[Math.abs(dayIndex) % prompts.length];
}
