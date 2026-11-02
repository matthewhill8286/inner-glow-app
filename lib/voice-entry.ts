/**
 * Helpers for voice entry (04 J3, J4). Kept free of imports so the tests can load it on its own.
 */

export const WAVE_BARS = 40;
export const WAVE_MIN = 6;
export const WAVE_MAX = 36;

/** Microphone level in dBFS (about −60 when quiet, 0 at the loudest) as 0–1. */
export function levelFromDb(db?: number | null): number {
  if (db == null || !Number.isFinite(db)) return 0;
  return Math.min(1, Math.max(0, (db + 60) / 60));
}

/** Bar height for a level, between the design's 6 and 36. */
export function barHeight(level: number): number {
  return Math.round(WAVE_MIN + (WAVE_MAX - WAVE_MIN) * Math.min(1, Math.max(0, level)));
}

/** Adds a reading to the scrolling waveform history, keeping the latest `max`. */
export function pushLevel(history: number[], level: number, max = WAVE_BARS): number[] {
  const next = [...history, level];
  return next.length > max ? next.slice(next.length - max) : next;
}

/** "Recording · 0:42" and the record timer read m:ss / mm:ss. */
export function clockFromMs(ms: number, pad = false): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  return `${pad ? String(m).padStart(2, '0') : m}:${String(s % 60).padStart(2, '0')}`;
}

/** A voice entry's title is its first sentence, cut at a word near `max` characters. */
export function titleFromTranscript(text: string, max = 60): string {
  const first =
    text
      .trim()
      .split(/(?<=[.!?])\s+/)[0]
      ?.replace(/[.!?]+$/, '') ?? '';
  if (first.length <= max) return first;
  const cut = first.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), 20)).trim()}…`;
}

/** Splits the transcript around the highlighted phrases (04 J4), first match of each, in order. */
export function highlightSegments(
  text: string,
  highlights: string[],
): { text: string; highlight: boolean }[] {
  const ranges: [number, number][] = [];
  for (const h of highlights) {
    const at = h ? text.indexOf(h) : -1;
    if (at >= 0 && !ranges.some(([s, e]) => at < e && at + h.length > s))
      ranges.push([at, at + h.length]);
  }
  ranges.sort((a, b) => a[0] - b[0]);
  const out: { text: string; highlight: boolean }[] = [];
  let i = 0;
  for (const [s, e] of ranges) {
    if (s > i) out.push({ text: text.slice(i, s), highlight: false });
    out.push({ text: text.slice(s, e), highlight: true });
    i = e;
  }
  if (i < text.length || !out.length) out.push({ text: text.slice(i), highlight: false });
  return out;
}

/** The entry's mood from the noticed feelings that are still selected: their average on the 1–5 scale. */
export function moodFromNoticed(scores: number[]): 1 | 2 | 3 | 4 | 5 | null {
  if (!scores.length) return null;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.min(5, Math.max(1, Math.round(avg))) as 1 | 2 | 3 | 4 | 5;
}
