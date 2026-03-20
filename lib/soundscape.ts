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

/**
 * Stop the current soundscape and release the player.
 */
export async function stopSoundscape(): Promise<void> {
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
