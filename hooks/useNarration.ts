import { useCallback, useEffect, useMemo, useRef } from 'react';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useTranslation } from 'react-i18next';
import { NARRATION } from '@/data/narration';
import { breathCue, dueCue, narrationLanguage, type NarrationCue } from '@/lib/narration';

export function hasNarration(practiceId: string | undefined): boolean {
  return !!practiceId && !!NARRATION.en[practiceId];
}

/**
 * Plays a sleep practice's voice guidance against the player's clock. `tick` runs every frame with
 * the elapsed seconds; `onPhase` runs as the breath changes phase. `speaking(elapsed)` tells the
 * player to lower the soundscape. Pausing, seeking and leaving stop the voice.
 */
export function useNarration(practiceId: string | undefined, enabled: boolean, total: number) {
  const { i18n } = useTranslation();
  const cues = useMemo<NarrationCue[]>(() => {
    if (!enabled || !practiceId) return [];
    const lang = narrationLanguage(i18n.language);
    return NARRATION[lang]?.[practiceId] ?? NARRATION.en[practiceId] ?? [];
  }, [enabled, practiceId, i18n.language]);

  const player = useRef<AudioPlayer | null>(null);
  const last = useRef(-1);
  const until = useRef(0);

  const stop = useCallback(() => {
    try {
      player.current?.pause();
      player.current?.release();
    } catch {}
    player.current = null;
  }, []);

  useEffect(() => {
    if (cues.length)
      void setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
    return stop;
  }, [cues, stop]);

  const say = useCallback(
    (cue: NarrationCue, elapsed: number) => {
      stop();
      try {
        const p = createAudioPlayer(cue.file);
        p.volume = 1;
        p.play();
        player.current = p;
        until.current = elapsed + cue.seconds;
      } catch {}
    },
    [stop],
  );

  const tick = useCallback(
    (elapsed: number) => {
      if (!cues.length) return;
      const cue = dueCue(cues, last.current, elapsed, total);
      last.current = elapsed;
      if (cue) say(cue, elapsed);
    },
    [cues, total, say],
  );

  const onPhase = useCallback(
    (phase: string, elapsed: number) => {
      if (!cues.length || elapsed < until.current) return;
      const cue = breathCue(cues, phase, elapsed, total);
      if (cue) say(cue, elapsed);
    },
    [cues, total, say],
  );

  const pause = useCallback((on: boolean) => {
    try {
      if (on) player.current?.pause();
      else player.current?.play();
    } catch {}
  }, []);

  /** After a jump, lines between the old and new time are skipped, not played all at once. */
  const seek = useCallback(
    (elapsed: number) => {
      stop();
      until.current = 0;
      last.current = elapsed;
    },
    [stop],
  );

  const speaking = useCallback((elapsed: number) => elapsed < until.current, []);

  return { active: cues.length > 0, tick, onPhase, pause, seek, stop, speaking };
}
