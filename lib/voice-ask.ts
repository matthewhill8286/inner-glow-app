/**
 * Ask Glow AI by voice from Home. Kept free of imports so the tests can load it on its own.
 * Levels are 0–1, from `levelFromDb` in `lib/voice-entry.ts`.
 */

/** The quietest level that can count as speech (about −45 dBFS). */
export const SPEECH_LEVEL = 0.25;
/** Speech has to be this much louder than the room's own noise. */
export const SPEECH_MARGIN = 0.15;
/** After some speech, this long under the speech level ends the question. */
export const SILENCE_MS = 1600;
/** A question never records for longer than this. */
export const MAX_ASK_MS = 60_000;
/** Shorter recordings are treated as a mis-tap and discarded. */
export const MIN_ASK_MS = 600;
/** Sound has to last this long to count as speech, so a click or a breath does not. */
export const SPEECH_MIN_MS = 300;
/** The first readings measure the room's noise before speech is listened for. */
export const SETTLE_MS = 400;

export type AskListen = {
  /** Running average of the readings taken while settling: the room's own noise. */
  floor: number;
  floorSamples: number;
  speechMs: number;
  lastAtMs: number | null;
  quietSinceMs: number | null;
};

export const LISTEN_START: AskListen = {
  floor: 0,
  floorSamples: 0,
  speechMs: 0,
  lastAtMs: null,
  quietSinceMs: null,
};

/** The level speech has to reach in this room. */
export function speechThreshold(state: AskListen): number {
  return Math.max(SPEECH_LEVEL, state.floor + SPEECH_MARGIN);
}

export function heardSpeech(state: AskListen): boolean {
  return state.speechMs >= SPEECH_MIN_MS;
}

/** Folds one meter reading into the listening state. */
export function listenStep(state: AskListen, level: number, atMs: number): AskListen {
  if (atMs < SETTLE_MS) {
    const n = state.floorSamples + 1;
    return {
      ...state,
      floor: state.floor + (level - state.floor) / n,
      floorSamples: n,
      lastAtMs: atMs,
    };
  }
  const step = state.lastAtMs == null ? 0 : Math.max(0, atMs - state.lastAtMs);
  if (level >= speechThreshold(state))
    return { ...state, speechMs: state.speechMs + step, lastAtMs: atMs, quietSinceMs: null };
  return { ...state, lastAtMs: atMs, quietSinceMs: state.quietSinceMs ?? atMs };
}

/**
 * Whether to stop listening, and why. Silence only ends a question once the person has spoken, so
 * a slow start is never cut off; nothing heard at all still stops at the time limit.
 */
export function askStopReason(state: AskListen, atMs: number): 'silence' | 'limit' | null {
  if (atMs >= MAX_ASK_MS) return 'limit';
  if (heardSpeech(state) && state.quietSinceMs != null && atMs - state.quietSinceMs >= SILENCE_MS)
    return 'silence';
  return null;
}

/** Whisper returns a few stock phrases for silence; those mean nothing was said. */
const EMPTY_TRANSCRIPTS = [
  /^\W*$/,
  /^(you|bye|okay|so)\W*$/i,
  /^(thank you|thanks)( (so|very) much)?( for (watching|listening))?\W*$/i,
  /^(please )?(like and )?subscribe\W*$/i,
];

export function cleanTranscript(text: unknown): string {
  const t = typeof text === 'string' ? text.replace(/\s+/g, ' ').trim() : '';
  return EMPTY_TRANSCRIPTS.some((re) => re.test(t)) ? '' : t;
}
