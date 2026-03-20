import { useEffect, useState } from 'react';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

export function useRecorder(preset = RecordingPresets.HIGH_QUALITY) {
  const recorder = useAudioRecorder(preset);
  const state = useAudioRecorderState(recorder);

  useEffect(() => {
    (async () => {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) throw new Error('Microphone permission not granted');

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
    })();
  }, []);

  async function startRecording() {
    await recorder.prepareToRecordAsync();
    recorder.record();
  }

  async function stopRecording(): Promise<{ uri: string; durationMs: number }> {
    await recorder.stop();

    const uri = recorder.uri;
    const durationMs = state.durationMillis ?? 0;

    if (!uri) throw new Error('No recording URI');
    return { uri, durationMs };
  }

  return {
    isRecording: state.isRecording,
    durationMs: state.durationMillis ?? 0,
    uri: recorder.uri ?? null,
    startRecording,
    stopRecording,
  };
}

export function usePlayer(uri: string | null) {
  const player = useAudioPlayer(uri);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const sub = player.addListener('playbackStatusUpdate', (status) => {
      setIsPlaying(status.playing);
    });
    return () => sub.remove();
  }, [player]);

  return {
    play: () => player.play(),
    pause: () => player.pause(),
    isPlaying,
    player,
  };
}

export function computeVoiceMetrics(durationMs: number, transcript: string) {
  const words = transcript.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(0.001, durationMs / 60000);
  const wpm = Math.round(words / minutes);
  const fillerCount = (transcript.match(/\b(um|uh|like)\b/gi) || []).length;
  return { words, wpm, fillerCount };
}
