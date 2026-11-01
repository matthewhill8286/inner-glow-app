import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Glow } from '@/components/glow/Glow';
import { AppButton } from '@/components/ui/AppButton';
import { toast } from '@/components/Toast';
import { computeVoiceMetrics, usePlayer, useRecorder } from '@/lib/recorder';

export type SoundCheck = {
  uri: string;
  durationMs: number;
  transcript: string;
  metrics: { words: number; wpm: number; fillerCount: number };
};

/** Reading pace for the highlight while recording: there is no live transcript, so it guides the reader. */
const MS_PER_WORD = 420;
const ORB = 236;

type Labels = { idle: string; recording: string; recorded: string; start: string; stop: string; play: string; pause: string; micDenied: string; saveFailed: string };

function PlayRecording({ uri, labels }: { uri: string; labels: Labels }) {
  const { play, pause, isPlaying } = usePlayer(uri);
  return <AppButton variant="ghost" size="s" icon={isPlaying ? 'line/pause' : 'line/play'} iconPosition="left" title={isPlaying ? labels.pause : labels.play} onPress={() => (isPlaying ? pause() : play())} style={{ alignSelf: 'center' }} />;
}

/**
 * Voice check-in (A13 `4002:15015`). The orb is the record button: a 236 plum ring, a lilac 172 glow,
 * a mustard 110 glow, an inner light and a 48 cream core; it breathes while recording. The phrase is
 * SemiBold 30; words already read sit on a lavender pill in white, the rest are muted. Recording states
 * are not designed, so a short caption and a play button carry them.
 */
export function VoiceCheckIn({ phrase, value, onRecorded, labels }: { phrase: string; value: SoundCheck | null | undefined; onRecorded: (check: SoundCheck) => void; labels: Labels }) {
  const { startRecording, stopRecording, isRecording } = useRecorder();
  const [busy, setBusy] = useState(false);
  const [spoken, setSpoken] = useState(value ? Number.MAX_SAFE_INTEGER : 0);
  const words = phrase.split(/\s+/);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!isRecording) return;
    setSpoken(0);
    const id = setInterval(() => setSpoken((n) => Math.min(words.length, n + 1)), MS_PER_WORD);
    pulse.value = withRepeat(withTiming(1.08, { duration: 900, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => {
      clearInterval(id);
      cancelAnimation(pulse);
      pulse.value = withTiming(1, { duration: 300 });
    };
  }, [isRecording, words.length, pulse]);

  const glowStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      if (isRecording) {
        const { uri, durationMs } = await stopRecording();
        const transcript = phrase;
        onRecorded({ uri, durationMs, transcript, metrics: computeVoiceMetrics(durationMs, transcript) });
        setSpoken(Number.MAX_SAFE_INTEGER);
      } else {
        await startRecording();
      }
    } catch (e) {
      toast.error(isRecording ? labels.saveFailed : labels.micDenied);
      console.error('Voice check-in recording failed:', e);
    } finally {
      setBusy(false);
    }
  }

  const status = isRecording ? labels.recording : value ? labels.recorded : labels.idle;

  return (
    <View style={{ alignItems: 'center', gap: 32 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isRecording ? labels.stop : labels.start}
        accessibilityState={{ busy }}
        onPress={toggle}
        style={{ width: ORB, height: ORB }}
      >
        <View style={{ position: 'absolute', width: ORB, height: ORB, borderRadius: ORB / 2, borderWidth: 1, borderColor: palette.plum }} />
        <Animated.View style={[{ position: 'absolute', width: ORB, height: ORB }, glowStyle]} pointerEvents="none">
          <Glow color={palette.lavenderSoft} opacity={0.25} width={172} blur={30} style={{ position: 'absolute', left: 32, top: 32 }} />
          <Glow color={palette.mustard} opacity={isRecording ? 1 : 0.85} width={110} blur={16} style={{ position: 'absolute', left: 63, top: 63 }} />
          <Glow color={palette.cream} opacity={1} width={49.5} blur={8} style={{ position: 'absolute', left: 93.3, top: 93.3 }} />
        </Animated.View>
        <View style={{ position: 'absolute', left: 94, top: 94, width: 48, height: 48, borderRadius: 24, backgroundColor: palette.cream }} />
      </Pressable>
      <View style={{ gap: 12, alignSelf: 'stretch' }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', rowGap: 2 }} accessible accessibilityLabel={phrase}>
          {words.map((w, i) => {
            const on = i < spoken;
            const first = on && (i === 0 || i - 1 >= spoken);
            const last = on && (i === words.length - 1 || i + 1 >= spoken);
            return (
              <View
                key={`${w}-${i}`}
                style={{
                  backgroundColor: on ? palette.lavender : 'transparent',
                  paddingLeft: first ? 8 : 0,
                  paddingRight: last ? 8 : 0,
                  // The pill ends without a trailing space, so keep the gap to the next word outside it.
                  marginRight: last && i < words.length - 1 ? 8 : 0,
                  borderTopLeftRadius: first ? 999 : 0,
                  borderBottomLeftRadius: first ? 999 : 0,
                  borderTopRightRadius: last ? 999 : 0,
                  borderBottomRightRadius: last ? 999 : 0,
                }}
              >
                <Text style={[Type.titleXl, { letterSpacing: 0, color: on ? palette.white : palette.textMuted }]}>
                  {w}
                  {i < words.length - 1 && (!on || !last) ? ' ' : ''}
                </Text>
              </View>
            );
          })}
        </View>
        <Text style={[Type.bodySm, { color: palette.textMuted, textAlign: 'center' }]} accessibilityLiveRegion="polite">
          {status}
        </Text>
        {value && !isRecording ? <PlayRecording uri={value.uri} labels={labels} /> : null}
      </View>
    </View>
  );
}
