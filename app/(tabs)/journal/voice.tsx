import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as FileSystem from 'expo-file-system';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon } from '@/components/icons/Icon';
import { Glow, GlowField } from '@/components/glow/Glow';
import { AppButton } from '@/components/ui/AppButton';
import { NavBar } from '@/components/ui/IconButton';
import { CrisisSheet } from '@/components/chat/CrisisSheet';
import { toast } from '@/components/Toast';
import { useJournal } from '@/hooks/useJournal';
import { invokeAI } from '@/lib/ai-privacy';
import { needsCrisisSupport } from '@/lib/journal-entry';
import { MOOD_SCALE, moodStep, type MoodScore } from '@/lib/mood-scale';
import { backTo } from '@/lib/navigation';
import { usePlayer, useRecorder } from '@/lib/recorder';
import {
  WAVE_BARS,
  barHeight,
  clockFromMs,
  levelFromDb,
  pushLevel,
  titleFromTranscript,
} from '@/lib/voice-entry';

type Step = 'recording' | 'transcribing' | 'review' | 'error';
const MIME: Record<string, string> = {
  m4a: 'audio/m4a',
  mp4: 'audio/mp4',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  webm: 'audio/webm',
  caf: 'audio/x-caf',
};

async function base64Of(uri: string): Promise<string> {
  if (Platform.OS !== 'web') return new FileSystem.File(uri).base64();
  const blob = await (await fetch(uri)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Recording orb (04 J3): two glows, three ripples that drift outward, and an inner light that follows the voice. */
function RecordingOrb({ level, running }: { level: number; running: boolean }) {
  const reduceMotion = useReducedMotion();
  const ripple = useSharedValue(0);
  useEffect(() => {
    if (!running || reduceMotion) return;
    ripple.value = 0;
    ripple.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [ripple, running, reduceMotion]);
  const rings = useAnimatedStyle(() => ({ transform: [{ scale: 1 + ripple.value * 0.05 }] }));
  const light = 1 + level * 0.35;

  return (
    <View style={{ width: 280, height: 280, alignItems: 'center', justifyContent: 'center' }}>
      <Glow
        color={palette.lavenderSoft}
        opacity={0.5}
        width={280}
        blur={50}
        style={{ position: 'absolute' }}
      />
      <Glow
        color={palette.mustard}
        opacity={0.55}
        width={170}
        blur={36}
        style={{ position: 'absolute' }}
      />
      <Animated.View
        style={[{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }, rings]}
      >
        {[230, 190, 150].map((d, i) => (
          <View
            key={d}
            style={{
              position: 'absolute',
              width: d,
              height: d,
              borderRadius: d / 2,
              borderWidth: 1,
              borderColor: `rgba(107,82,121,${[0.12, 0.2, 0.3][i]})`,
            }}
          />
        ))}
      </Animated.View>
      <Glow
        color={palette.cream}
        opacity={0.95}
        width={64}
        blur={14}
        style={{ position: 'absolute', transform: [{ scale: light }] }}
      />
    </View>
  );
}

/** 40 bars, 3 wide on a 7.5 step, from the latest microphone readings (04 J3). */
function Waveform({ levels }: { levels: number[] }) {
  const bars = Array.from(
    { length: WAVE_BARS },
    (_, i) => levels[i - (WAVE_BARS - levels.length)] ?? 0,
  );
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: 300,
        height: 44,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {bars.map((level, i) => (
        <View
          key={i}
          style={{
            width: 3,
            height: barHeight(level),
            backgroundColor: palette.plum,
            opacity: 0.85,
          }}
        />
      ))}
    </View>
  );
}

function RoundButton({
  icon,
  label,
  onPress,
}: {
  icon: 'arrow/close' | 'line/check';
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: palette.white,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Icon name={icon} size={21} color={palette.plum} />
    </Pressable>
  );
}

/**
 * Voice entry (04 J3 recording, J4 review). Recording starts on open; the waveform and the orb's
 * inner light follow the microphone. The centre button pauses and resumes; Done stops and
 * transcribes; Cancel leaves without saving. Review shows the editable transcript, a playback pill
 * and a mood choice on the five-step scale, then Save entry opens Saved. The AI highlights and the
 * "mood we noticed" words need a backend that does not exist yet, so the transcript is plain and the
 * mood is chosen. The recording stays on the phone: there is no upload yet.
 */
export default function VoiceEntry() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const recorder = useRecorder(undefined, { metering: true, intervalMs: 100 });
  const { createJournalEntry } = useJournal();
  const [step, setStep] = useState<Step>('recording');
  const [paused, setPaused] = useState(false);
  const [levels, setLevels] = useState<number[]>([]);
  const [uri, setUri] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState(0);
  const [text, setText] = useState('');
  const [mood, setMood] = useState<MoodScore>(3);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [crisisFor, setCrisisFor] = useState<string | null>(null);
  const started = useRef(false);
  const player = usePlayer(uri);

  async function start() {
    setLevels([]);
    setPaused(false);
    setError('');
    setStep('recording');
    try {
      await recorder.startRecording();
    } catch {
      setError(t('journalVoice.micPermissionError'));
      setStep('error');
    }
  }
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (step === 'recording' && !paused && recorder.isRecording)
      setLevels((h) => pushLevel(h, levelFromDb(recorder.metering)));
  }, [recorder.metering, recorder.durationMs, recorder.isRecording, paused, step]);

  const togglePause = () => {
    if (paused) recorder.resume();
    else recorder.pause();
    setPaused((p) => !p);
  };

  async function done() {
    try {
      const result = await recorder.stopRecording();
      setUri(result.uri);
      setDurationMs(result.durationMs);
      setStep('transcribing');
      const ext = result.uri.split('.').pop()?.toLowerCase() ?? 'm4a';
      const { data, error: aiError } = await invokeAI('transcribe-audio', {
        body: { audioBase64: await base64Of(result.uri), mimeType: MIME[ext] ?? 'audio/m4a' },
      });
      if (aiError || !data?.text) throw new Error(aiError?.message);
      setText(String(data.text).trim());
      setStep('review');
    } catch (err) {
      setError((err as Error)?.message || t('journalVoice.transcriptionError'));
      setStep('error');
    }
  }

  async function cancel() {
    if (recorder.isRecording || paused) await recorder.stopRecording().catch(() => undefined);
    backTo(undefined, '/(tabs)/journal');
  }

  async function save() {
    const content = text.trim();
    if (!content || saving) return;
    setSaving(true);
    try {
      const created = await createJournalEntry({
        title: titleFromTranscript(content) || t('journalVoice.title'),
        content,
        mood: moodStep(mood).checkIn,
        isVoiceEntry: true,
        recordingDurationMs: durationMs,
      });
      if (needsCrisisSupport(content)) setCrisisFor(created.id);
      else router.replace({ pathname: '/(tabs)/journal/saved', params: { id: created.id } });
    } catch {
      toast.error(t('toasts.voiceJournalSaveError'));
    } finally {
      setSaving(false);
    }
  }

  const reviewing = step === 'review';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <GlowField
        glows={[
          { color: palette.mustard, opacity: 0.3, x: -50, y: -20, width: 280, blur: 80 },
          { color: palette.lavenderSoft, opacity: 0.25, x: 180, y: 60, width: 220, blur: 80 },
        ]}
      />
      <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 24 }}>
        <NavBar
          backLabel={t('common.back')}
          onBack={reviewing ? () => void start() : () => void cancel()}
          title={reviewing ? t('journalVoice.reviewNav') : t('journalVoice.recordNav')}
        />
      </View>

      {reviewing ? (
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingBottom: insets.bottom + 16,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Text
            accessibilityRole="header"
            style={[Type.titleLg, { lineHeight: 34, color: palette.ink, marginTop: 22 }]}
          >
            {t('journalVoice.reviewTitle')}
          </Text>
          <Text style={[Type.bodyS, { color: palette.textMuted, marginTop: 6 }]}>
            {t('journalVoice.reviewBody')}
          </Text>
          <View
            style={{
              backgroundColor: palette.white,
              borderRadius: 24,
              padding: 20,
              marginTop: 24,
              minHeight: 300,
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <TextInput
              value={text}
              onChangeText={setText}
              multiline
              textAlignVertical="top"
              accessibilityLabel={t('journalVoice.transcriptLabel')}
              style={[Type.bodyLg, { lineHeight: 25.6, color: palette.ink, padding: 0 }]}
            />
            {uri && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  player.isPlaying ? t('journalVoice.pause') : t('journalVoice.play')
                }
                onPress={() => (player.isPlaying ? player.pause() : player.play())}
                style={{
                  alignSelf: 'flex-start',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingVertical: 8,
                  paddingLeft: 10,
                  paddingRight: 14,
                  borderRadius: 999,
                  backgroundColor: palette.surfaceLilacSoft,
                }}
              >
                <Icon
                  name={player.isPlaying ? 'line/pause' : 'line/play'}
                  size={12}
                  color={palette.plum}
                />
                <Text style={[Type.caption, { color: palette.plum }]}>
                  {t('journalVoice.recording', { time: clockFromMs(durationMs) })}
                </Text>
              </Pressable>
            )}
          </View>
          <Text style={[Type.chipSelected, { color: palette.ink, marginTop: 24 }]}>
            {t('journalVoice.moodLabel')}
          </Text>
          <View
            accessibilityRole="radiogroup"
            style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}
          >
            {MOOD_SCALE.map((m) => {
              const selected = m.score === mood;
              return (
                <Pressable
                  key={m.key}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setMood(m.score)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingVertical: selected ? 7.5 : 8,
                    paddingLeft: selected ? 9.5 : 10,
                    paddingRight: selected ? 13.5 : 14,
                    borderRadius: 999,
                    backgroundColor: selected ? palette.selected : palette.white,
                    borderWidth: selected ? 1.5 : 1,
                    borderColor: selected ? palette.plum : palette.border,
                  }}
                >
                  <Icon
                    name={m.face}
                    size={16}
                    color={selected ? palette.plum : palette.textMuted}
                  />
                  <Text
                    style={[
                      selected ? Type.chipSelected : Type.chip,
                      { color: selected ? palette.plum : palette.textMuted },
                    ]}
                  >
                    {t(`moodScale.${m.key}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={{ flex: 1, minHeight: 32 }} />
          <AppButton
            title={t('journalWrite.saveEntry')}
            size="lg"
            busy={saving}
            disabled={!text.trim() || saving}
            onPress={save}
          />
          <AppButton
            title={t('journalVoice.recordAgain')}
            variant="text"
            onPress={() => void start()}
            style={{ marginTop: 8 }}
          />
        </ScrollView>
      ) : (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            paddingHorizontal: 24,
            paddingBottom: insets.bottom + 16,
          }}
        >
          <Text
            accessibilityRole="header"
            style={[
              Type.titleLg,
              { lineHeight: 36, color: palette.ink, textAlign: 'center', marginTop: 26 },
            ]}
          >
            {t('journalVoice.recordTitle')}
          </Text>
          <Text
            style={[Type.bodyS, { color: palette.textMuted, textAlign: 'center', marginTop: 8 }]}
          >
            {step === 'error'
              ? error
              : step === 'transcribing'
                ? t('journalVoice.transcribing')
                : t('journalVoice.recordBody')}
          </Text>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            {step === 'transcribing' ? (
              <ActivityIndicator color={palette.plum} size="large" />
            ) : (
              <RecordingOrb
                level={levels[levels.length - 1] ?? 0}
                running={step === 'recording' && !paused}
              />
            )}
          </View>
          <Waveform levels={levels} />
          <Text
            accessibilityLiveRegion="polite"
            style={[Type.bodyStrong, { color: palette.plum, marginTop: 16 }]}
          >
            {clockFromMs(recorder.durationMs, true)}
          </Text>
          {step === 'error' ? (
            <AppButton
              title={t('journalVoice.tryAgain')}
              size="lg"
              onPress={() => void start()}
              style={{ alignSelf: 'stretch', marginTop: 32 }}
            />
          ) : (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 27,
                marginTop: 32,
                opacity: step === 'transcribing' ? 0.4 : 1,
              }}
              pointerEvents={step === 'transcribing' ? 'none' : 'auto'}
            >
              <RoundButton
                icon="arrow/close"
                label={t('journalVoice.cancel')}
                onPress={() => void cancel()}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  paused ? t('journalVoice.resume') : t('journalVoice.pauseRecording')
                }
                onPress={togglePause}
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 38,
                  backgroundColor: palette.plum,
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0px 0px 20px 4px rgba(226,204,64,0.60)',
                }}
              >
                {paused ? (
                  <Icon name="line/mic" size={26} color={palette.white} />
                ) : (
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      backgroundColor: palette.white,
                    }}
                  />
                )}
              </Pressable>
              <RoundButton
                icon="line/check"
                label={t('journalVoice.done')}
                onPress={() => void done()}
              />
            </View>
          )}
        </View>
      )}
      <CrisisSheet
        visible={crisisFor !== null}
        onClose={() => {
          const created = crisisFor;
          setCrisisFor(null);
          if (created)
            router.replace({ pathname: '/(tabs)/journal/saved', params: { id: created } });
        }}
      />
    </KeyboardAvoidingView>
  );
}
