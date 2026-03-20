import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import { useRecorder } from '@/lib/recorder';
import { useJournal } from '@/hooks/useJournal';
import { supabase } from '@/supabase/supabase';
import * as FileSystem from 'expo-file-system';
import SoundPulse from '@/components/SoundPulse';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

/* ── Design-system colors (matches assessment / Figma) ── */
const BRAND = {
  brown: '#a07b55', // primary CTA button
  brownText: '#96784E', // header accent text
  brownLight: '#6a5e55', // body text on light card
  cardBg: '#FFFFFF', // white card
  pageBg: '#F7F4F2', // warm off-white page
  tagBg: '#E8DDD9', // badge / chip bg
  olive: '#828a6a', // SoundPulse / recording accent
  oliveLight: '#b8c39d', // waveform bar color
  red: '#C45B5B', // stop / cancel / error
  redBg: '#C45B5B15',
};

/* ── Waveform bar component ── */
function WaveformBars({ isRecording, color }: { isRecording: boolean; color: string }) {
  const barCount = 40;
  const bars = useRef(Array.from({ length: barCount }, () => new Animated.Value(0.2))).current;

  useEffect(() => {
    if (!isRecording) {
      bars.forEach((bar) => bar.setValue(0.2));
      return;
    }
    const animations = bars.map((bar) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(bar, {
            toValue: 0.3 + Math.random() * 0.7,
            duration: 200 + Math.random() * 300,
            useNativeDriver: false,
          }),
          Animated.timing(bar, {
            toValue: 0.15 + Math.random() * 0.25,
            duration: 200 + Math.random() * 300,
            useNativeDriver: false,
          }),
        ]),
      ),
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [bars, isRecording]);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 80,
        gap: 2,
        paddingHorizontal: 20,
        marginTop: 16,
      }}
    >
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={{
            width: 3,
            borderRadius: 2,
            backgroundColor: color,
            height: bar.interpolate({
              inputRange: [0, 1],
              outputRange: [6, 70],
            }),
            opacity: isRecording ? 0.85 : 0.3,
          }}
        />
      ))}
    </View>
  );
}

type VoiceState = 'idle' | 'recording' | 'transcribing' | 'done' | 'error';

export default function VoiceJournal() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { t } = useTranslation();
  const recorder = useRecorder();
  const { createJournalEntry, isCreating } = useJournal();
  const insets = useSafeAreaInsets();

  const [state, setState] = useState<VoiceState>('idle');
  const [seconds, setSeconds] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [editedTranscription, setEditedTranscription] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [recordingDurationMs, setRecordingDurationMs] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Pulse animation for record button */
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (state === 'recording') {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      pulse.setValue(1);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  async function startRecording() {
    try {
      setSeconds(0);
      setTranscription('');
      setEditedTranscription('');
      setErrorMessage('');
      await recorder.startRecording();
      setState('recording');
    } catch (err) {
      console.error('[VoiceJournal] Failed to start recording:', err);
      setErrorMessage(t('journalVoice.micPermissionError'));
      setState('error');
    }
  }

  async function stopRecording() {
    try {
      const { uri, durationMs } = await recorder.stopRecording();
      setRecordingUri(uri);
      setRecordingDurationMs(durationMs);
      setState('transcribing');
      await transcribeAudio(uri);
    } catch (err) {
      console.error('[VoiceJournal] Failed to stop recording:', err);
      setErrorMessage(t('journalVoice.recordingError'));
      setState('error');
    }
  }

  async function transcribeAudio(uri: string) {
    try {
      // Read audio file as base64
      let base64Audio: string;
      if (Platform.OS === 'web') {
        // On web, fetch the blob and convert manually
        const response = await fetch(uri);
        const blob = await response.blob();
        base64Audio = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1] ?? '');
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        // On native, use the new File API
        const file = new FileSystem.File(uri);
        base64Audio = await file.base64();
      }

      // Determine mime type from URI
      const ext = uri.split('.').pop()?.toLowerCase() ?? 'm4a';
      const mimeMap: Record<string, string> = {
        m4a: 'audio/m4a',
        mp4: 'audio/mp4',
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        webm: 'audio/webm',
        caf: 'audio/x-caf',
      };
      const mimeType = mimeMap[ext] || 'audio/m4a';

      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audioBase64: base64Audio, mimeType },
      });

      if (error) {
        throw new Error(error.message || 'Transcription failed');
      }

      if (!data?.text) {
        throw new Error('No transcription returned');
      }

      setTranscription(data.text);
      setEditedTranscription(data.text);
      setState('done');
    } catch (err: any) {
      console.error('[VoiceJournal] Transcription error:', err);
      setErrorMessage(err?.message || t('journalVoice.transcriptionError'));
      setState('error');
    }
  }

  function resetRecording() {
    setSeconds(0);
    setTranscription('');
    setEditedTranscription('');
    setRecordingUri(null);
    setRecordingDurationMs(0);
    setErrorMessage('');
    setIsEditing(false);
    setState('idle');
  }

  async function saveEntry() {
    const text = (isEditing ? editedTranscription : transcription).trim();
    if (!text) return;

    try {
      await createJournalEntry({
        title: t('journalVoice.title'),
        content: text,
        isVoiceEntry: true,
        recordingDurationMs,
      });
      router.replace('/(tabs)/journal');
    } catch (err) {
      console.error('[VoiceJournal] Failed to save entry:', err);
    }
  }

  const displayText = isEditing ? editedTranscription : transcription;
  const wordCount = displayText.trim() ? displayText.trim().split(/\s+/).length : 0;

  return (
    <View style={{ flex: 1, backgroundColor: BRAND.pageBg }}>
      {/* ── Header (matches assessment style) ── */}
      <View
        style={{
          paddingTop: insets.top + 6,
          paddingHorizontal: 24,
          paddingBottom: 12,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: BRAND.brownText,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: BRAND.pageBg,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ color: BRAND.brownText, fontSize: 22 }}>{'←'}</Text>
          </Pressable>
          <Text style={{ color: BRAND.brownText, fontSize: 18, fontWeight: '700' }}>
            {t('journalVoice.title')}
          </Text>
        </View>

        {/* Status badge */}
        <View
          style={{
            backgroundColor: BRAND.tagBg,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: BRAND.brownText, fontSize: 13, fontWeight: '700' }}>
            {state === 'idle'
              ? t('journalVoice.readyToRecord')
              : state === 'recording'
                ? formatTime(seconds)
                : state === 'transcribing'
                  ? t('journalVoice.transcribing')
                  : state === 'done'
                    ? t('journalVoice.transcribed')
                    : t('journalVoice.errorOccurred')}
          </Text>
        </View>
      </View>

      {state === 'idle' || state === 'recording' ? (
        /* ═══════════════════════════════════
           Recording View
           ═══════════════════════════════════ */
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* White card container (matches assessment) */}
          <View
            style={{
              backgroundColor: BRAND.cardBg,
              borderRadius: 32,
              paddingVertical: 32,
              paddingHorizontal: 20,
              alignItems: 'center',
              flex: 1,
              justifyContent: 'center',
              minHeight: 400,
            }}
          >
            {/* SoundPulse orb (same as assessment) */}
            <Pressable
              onPress={state === 'idle' ? startRecording : stopRecording}
            >
              <SoundPulse active={state === 'recording'} />
              {state === 'idle' && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <MaterialIcons name="mic" size={32} color="white" />
                </View>
              )}
              {state === 'recording' && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <MaterialIcons name="stop" size={32} color="white" />
                </View>
              )}
            </Pressable>

            {/* Timer */}
            <Text
              style={{
                fontSize: 44,
                fontWeight: '900',
                color: BRAND.brownLight,
                marginTop: 8,
                fontVariant: ['tabular-nums'],
              }}
            >
              {formatTime(seconds)}
            </Text>

            {/* Subtitle text */}
            <Text
              style={{
                fontSize: 15,
                color: BRAND.brownLight,
                opacity: 0.7,
                marginTop: 8,
                textAlign: 'center',
              }}
            >
              {state === 'recording'
                ? t('journalVoice.tapToStop')
                : t('journalVoice.readyToRecord')}
            </Text>

            {/* Waveform bars (visible when recording) */}
            {state === 'recording' && (
              <WaveformBars isRecording color={BRAND.oliveLight} />
            )}

            {/* Cancel while recording */}
            {state === 'recording' && (
              <Pressable
                onPress={() => {
                  recorder.stopRecording().catch(() => {});
                  resetRecording();
                }}
                style={({ pressed }) => ({
                  marginTop: 16,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 20,
                  backgroundColor: BRAND.redBg,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: BRAND.red }}>
                  {t('journalVoice.cancel')}
                </Text>
              </Pressable>
            )}
          </View>

          {/* "Tap to record" hint below card when idle */}
          {state === 'idle' && (
            <Text
              style={{
                textAlign: 'center',
                color: BRAND.brownLight,
                opacity: 0.5,
                fontSize: 13,
                fontWeight: '600',
                marginTop: 16,
              }}
            >
              {t('journalVoice.readyToRecord')}
            </Text>
          )}
        </ScrollView>
      ) : state === 'transcribing' ? (
        /* ═══════════════════════════════════
           Transcribing View
           ═══════════════════════════════════ */
        <View style={{ flex: 1, paddingHorizontal: 24, paddingBottom: 40 }}>
          <View
            style={{
              backgroundColor: BRAND.cardBg,
              borderRadius: 32,
              paddingVertical: 48,
              paddingHorizontal: 20,
              alignItems: 'center',
              flex: 1,
              justifyContent: 'center',
              minHeight: 400,
            }}
          >
            <SoundPulse active />
            <ActivityIndicator
              size="large"
              color={BRAND.olive}
              style={{ marginTop: 24 }}
            />
            <Text
              style={{
                fontSize: 22,
                fontWeight: '800',
                color: BRAND.brownLight,
                marginTop: 20,
                textAlign: 'center',
              }}
            >
              {t('journalVoice.transcribing')}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: BRAND.brownLight,
                opacity: 0.7,
                marginTop: 8,
                textAlign: 'center',
                paddingHorizontal: 20,
              }}
            >
              {t('journalVoice.transcribingSubtitle')}
            </Text>
          </View>
        </View>
      ) : state === 'error' ? (
        /* ═══════════════════════════════════
           Error View
           ═══════════════════════════════════ */
        <View style={{ flex: 1, paddingHorizontal: 24, paddingBottom: 40 }}>
          <View
            style={{
              backgroundColor: BRAND.cardBg,
              borderRadius: 32,
              paddingVertical: 48,
              paddingHorizontal: 24,
              alignItems: 'center',
              flex: 1,
              justifyContent: 'center',
              minHeight: 400,
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: BRAND.redBg,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <MaterialIcons name="error-outline" size={40} color={BRAND.red} />
            </View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '800',
                color: BRAND.brownLight,
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              {t('journalVoice.errorOccurred')}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: BRAND.brownLight,
                opacity: 0.7,
                textAlign: 'center',
                paddingHorizontal: 20,
                marginBottom: 24,
              }}
            >
              {errorMessage || t('journalVoice.transcriptionError')}
            </Text>
          </View>

          {/* Try again button (assessment CTA style) */}
          <Pressable
            onPress={resetRecording}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              paddingVertical: 20,
              borderRadius: 35,
              backgroundColor: BRAND.brown,
              marginTop: 30,
              opacity: pressed ? 0.9 : 1,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 4,
            })}
          >
            <MaterialIcons name="replay" size={20} color="#fff" />
            <Text style={{ color: 'white', fontWeight: '800', fontSize: 18 }}>
              {t('journalVoice.tryAgain')}
            </Text>
          </Pressable>
        </View>
      ) : (
        /* ═══════════════════════════════════
           Transcription Result View
           ═══════════════════════════════════ */
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* White card with transcription */}
          <View
            style={{
              backgroundColor: BRAND.cardBg,
              borderRadius: 32,
              paddingVertical: 24,
              paddingHorizontal: 20,
            }}
          >
            {/* Recording badge + edit toggle */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                  backgroundColor: BRAND.tagBg,
                }}
              >
                <MaterialIcons name="mic" size={14} color={BRAND.brownText} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: BRAND.brownText }}>
                  {formatTime(seconds)}
                </Text>
              </View>

              {/* Edit toggle */}
              <Pressable
                onPress={() => setIsEditing(!isEditing)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                  backgroundColor: isEditing ? BRAND.tagBg : 'transparent',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <MaterialIcons
                  name={isEditing ? 'check' : 'edit'}
                  size={14}
                  color={BRAND.brownText}
                />
                <Text style={{ fontSize: 12, fontWeight: '700', color: BRAND.brownText }}>
                  {isEditing ? t('journalVoice.done') : t('journalVoice.edit')}
                </Text>
              </Pressable>
            </View>

            {/* Section label */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <MaterialIcons name="text-fields" size={18} color={BRAND.brownLight} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: BRAND.brownLight }}>
                {t('journalVoice.transcription')}
              </Text>
            </View>

            {/* Transcription content area */}
            <View
              style={{
                backgroundColor: '#f2ece6',
                borderRadius: 20,
                padding: 20,
                minHeight: 160,
              }}
            >
              {isEditing ? (
                <TextInput
                  value={editedTranscription}
                  onChangeText={setEditedTranscription}
                  multiline
                  textAlignVertical="top"
                  style={{
                    fontSize: 15,
                    lineHeight: 26,
                    color: BRAND.brownLight,
                    minHeight: 140,
                    paddingVertical: 0,
                  }}
                />
              ) : (
                <Text
                  style={{
                    fontSize: 15,
                    lineHeight: 26,
                    color: BRAND.brownLight,
                  }}
                >
                  {displayText}
                </Text>
              )}
            </View>

            {/* Word count */}
            <Text
              style={{
                fontSize: 12,
                color: BRAND.brownLight,
                opacity: 0.5,
                marginTop: 10,
                textAlign: 'right',
              }}
            >
              {wordCount} {t('journalVoice.words')}
            </Text>
          </View>

          {/* ── Action Buttons (assessment CTA style) ── */}
          <View style={{ marginTop: 30, gap: 12 }}>
            {/* Save as journal — primary CTA */}
            <Pressable
              onPress={saveEntry}
              disabled={isCreating || !displayText.trim()}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                paddingVertical: 20,
                borderRadius: 35,
                backgroundColor:
                  isCreating || !displayText.trim()
                    ? 'rgba(160,123,85,0.5)'
                    : BRAND.brown,
                opacity: pressed ? 0.9 : 1,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
                elevation: 4,
              })}
            >
              {isCreating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialIcons name="check-circle" size={20} color="#fff" />
              )}
              <Text style={{ color: 'white', fontWeight: '800', fontSize: 18 }}>
                {t('journalVoice.saveEntry')}
              </Text>
            </Pressable>

            {/* Re-record — secondary */}
            <Pressable
              onPress={resetRecording}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                paddingVertical: 18,
                borderRadius: 35,
                borderWidth: 1,
                borderColor: BRAND.brownText,
                backgroundColor: 'transparent',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <MaterialIcons name="replay" size={20} color={BRAND.brownText} />
              <Text style={{ color: BRAND.brownText, fontWeight: '700', fontSize: 16 }}>
                {t('journalVoice.recordAgain')}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
