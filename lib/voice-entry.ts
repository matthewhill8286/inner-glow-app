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
