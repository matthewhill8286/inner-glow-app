import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

/* ── Sound file map ──────────────────────────────── */

const SOUND_FILES: Record<string, any> = {
  birds: require('@/assets/sounds/birds.mp3'),
  zen: require('@/assets/sounds/zen.mp3'),
  rain: require('@/assets/sounds/rain.mp3'),
  stream: require('@/assets/sounds/stream.mp3'),
  ocean: require('@/assets/sounds/ocean.mp3'),
};

/* ── Soundscape player ───────────────────────────── */

let currentPlayer: AudioPlayer | null = null;

/**
 * Start playing a soundscape in a loop.
 * If a sound is already playing, it will be stopped first.
 * Pass 'silence' or an unknown key to stop without playing.
 */
export async function playSoundscape(key: string): Promise<void> {
  // Stop any existing playback
  await stopSoundscape();

  const source = SOUND_FILES[key];
  if (!source) return; // 'silence' or unknown — no audio

  try {
    const player = createAudioPlayer(source);
    player.loop = true;
    player.volume = 0.6;
    player.play();
    currentPlayer = player;
  } catch (err) {
    console.warn('[soundscape] Failed to play:', err);
  }
}

let stopTimer: ReturnType<typeof setTimeout> | null = null;
let fadeTimer: ReturnType<typeof setInterval> | null = null;

function clearStopTimers() {
  if (stopTimer) clearTimeout(stopTimer);
  if (fadeTimer) clearInterval(fadeTimer);
  stopTimer = null;
  fadeTimer = null;
}

/**
 * Stop the soundscape after `minutes`, fading it out over the last 30 seconds ("Stop sound after",
 * 06 §S3). Null keeps it playing.
 */
export function stopSoundscapeAfter(minutes: number | null): void {
  clearStopTimers();
  if (minutes == null || !currentPlayer) return;
  const fadeMs = 30_000;
  stopTimer = setTimeout(() => {
    const start = currentPlayer?.volume ?? 0.6;
    let step = 0;
    fadeTimer = setInterval(() => {
      step++;
      setSoundscapeVolume(start * (1 - step / 30));
      if (step >= 30) void stopSoundscape();
    }, fadeMs / 30);
  }, Math.max(0, minutes * 60_000 - fadeMs));
}

/**
 * Stop the current soundscape and release the player.
 */
export async function stopSoundscape(): Promise<void> {
  clearStopTimers();
  if (currentPlayer) {
    try {
      currentPlayer.pause();
      currentPlayer.release();
    } catch {
      // ignore cleanup errors
    }
    currentPlayer = null;
  }
}

/**
 * Pause / resume the current soundscape.
 */
export function pauseSoundscape(): void {
  if (currentPlayer) {
    try {
      currentPlayer.pause();
    } catch {}
  }
}

export function resumeSoundscape(): void {
  if (currentPlayer) {
    try {
      currentPlayer.play();
    } catch {}
  }
}

/** Volume of the current soundscape, 0–1 (the default is 0.6). Used for "Fade out at the end". */
export function setSoundscapeVolume(volume: number): void {
  if (currentPlayer) {
    try {
      currentPlayer.volume = Math.min(1, Math.max(0, volume));
    } catch {}
  }
}
