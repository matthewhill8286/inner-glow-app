import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/Toast';
import { invokeAI } from '@/lib/ai-privacy';
import { audioBase64, audioMimeType } from '@/lib/audio-file';
import { MicPermissionError, useRecorder } from '@/lib/recorder';
import { MicPrimerDismissed } from '@/lib/mic-primer';
import { levelFromDb, pushLevel } from '@/lib/voice-entry';
import {
  askStopReason,
  cleanTranscript,
  heardSpeech,
  LISTEN_START,
  listenStep,
  MIN_ASK_MS,
  type AskListen,
} from '@/lib/voice-ask';

export type VoiceAskState = 'idle' | 'listening' | 'transcribing';
const BARS = 24;

/**
 * Records a spoken question, stops on its own after a pause, transcribes it with `transcribe-audio`
 * and hands the words to `onAsk`. `start` asks for the microphone; a denied one points to Settings.
 */
export function useVoiceAsk(onAsk: (text: string) => void) {
  const { t } = useTranslation();
  const recorder = useRecorder(undefined, { metering: true, intervalMs: 100 });
  const [state, setState] = useState<VoiceAskState>('idle');
  const [levels, setLevels] = useState<number[]>([]);
  const listen = useRef<AskListen>(LISTEN_START);
  const stopping = useRef(false);
  // The recorder object and the caller's callback change every render; refs keep `finish` stable so
  // the meter effect below does not re-run (and set state) on every render.
  const recorderRef = useRef(recorder);
  recorderRef.current = recorder;
  const onAskRef = useRef(onAsk);
  onAskRef.current = onAsk;

  const finish = useCallback(
    async (send: boolean) => {
      if (stopping.current) return;
      stopping.current = true;
      try {
        const { uri, durationMs } = await recorderRef.current.stopRecording();
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (!send || durationMs < MIN_ASK_MS) {
          setState('idle');
          return;
        }
        // Whisper invents words from near-silence, so nothing is sent unless speech was heard.
        if (!heardSpeech(listen.current)) {
          setState('idle');
          toast.info(t('voiceAsk.nothingHeard'));
          return;
        }
        setState('transcribing');
        const { data, error } = await invokeAI('transcribe-audio', {
          body: { audioBase64: await audioBase64(uri), mimeType: audioMimeType(uri) },
        });
        if (error) throw error;
        const text = cleanTranscript(data?.text);
        setState('idle');
        if (text) onAskRef.current(text);
        else toast.info(t('voiceAsk.nothingHeard'));
      } catch {
        setState('idle');
        toast.error(t('voiceAsk.failed'));
      } finally {
        stopping.current = false;
        setLevels([]);
      }
    },
    [t],
  );

  const start = useCallback(async () => {
    if (state !== 'idle') return;
    listen.current = LISTEN_START;
    setLevels([]);
    try {
      await recorder.startRecording();
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setState('listening');
    } catch (e) {
      setState('idle');
      if (e instanceof MicPrimerDismissed) return;
      if (e instanceof MicPermissionError && !e.canAskAgain) {
        Alert.alert(t('common.micNeeded'), t('common.micInSettings'), [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.openSettings'), onPress: () => void Linking.openSettings() },
        ]);
      } else toast.error(t('common.allowMicAccess'));
    }
  }, [state, recorder, t]);

  // Each meter reading feeds the bars and the pause detection.
  useEffect(() => {
    if (state !== 'listening' || !recorder.isRecording) return;
    const level = levelFromDb(recorder.metering);
    setLevels((h) => pushLevel(h, level, BARS));
    listen.current = listenStep(listen.current, level, recorder.durationMs);
    if (askStopReason(listen.current, recorder.durationMs)) void finish(true);
  }, [state, recorder.isRecording, recorder.metering, recorder.durationMs, finish]);

  return {
    state,
    levels,
    durationMs: recorder.durationMs,
    start,
    /** Stop and send what was said. */
    send: () => void finish(true),
    /** Stop and throw the recording away. */
    cancel: () => void finish(false),
  };
}

/** `useVoiceAsk` shaped for the chat composer's mic. */
export function useComposerVoice(
  onAsk: (text: string) => void,
  canStart: () => boolean = () => true,
) {
  const { t } = useTranslation();
  const voice = useVoiceAsk(onAsk);
  return {
    state: voice.state,
    levels: voice.levels,
    start: () => {
      if (canStart()) void voice.start();
    },
    send: voice.send,
    cancel: voice.cancel,
    labels: {
      mic: t('homeGlow.voice'),
      cancel: t('voiceAsk.cancel'),
      send: t('voiceAsk.send'),
      listening: t('voiceAsk.listening'),
      transcribing: t('voiceAsk.transcribing'),
    },
  };
}
