import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon } from '@/components/icons/Icon';
import { GlowField } from '@/components/glow/Glow';
import { IconButton } from '@/components/ui/IconButton';
import {
  BreathingOrb,
  CompleteModal,
  EndEarlySheet,
  usePracticeText,
} from '@/components/practices/PracticeParts';
import { practiceById } from '@/data/practices';
import { useMindfulness } from '@/hooks/useMindfulness';
import { useDailyGoal } from '@/hooks/usePractices';
import { useAccessibilityPrefs } from '@/lib/accessibility-prefs';
import { breathAt, mmss, orbScale, totalBreaths, type Pace, type Phase } from '@/lib/practices';
import {
  pauseSoundscape,
  playSoundscape,
  resumeSoundscape,
  setSoundscapeVolume,
  stopSoundscape,
} from '@/lib/soundscape';

/** Calm players breathe slowly (4 s in, 6 s out) when the practice has no pattern of its own. */
const CALM = { inhale: 4, hold: 0, exhale: 6, holdAfter: 0 };
const FADE_SECONDS = 60;
/** Ending before this is not saved (a mis-tap, not a session). */
const MIN_SAVE_SECONDS = 10;

/**
 * Practice player (07 §2.7 with the Hold phase and sizes from 10 §3.9–3.10). Breathing practices show
 * the phase, its guidance, the orb (0.8 out, 1.0 in, dashed ring on Hold) and the breath count.
 * Mindfulness and sleep use the same player with a calm breathing orb until their own players are
 * built (07 §2.15–2.16). Leaving early asks first (07 §2.8); the end shows Complete (07 §2.9). Each
 * session is saved with the practice, its options and whether it finished.
 */
export default function PracticePlayer() {
  useKeepAwake();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id: string;
    duration?: string;
    pace?: Pace;
    sound?: string;
    haptics?: string;
    fadeOut?: string;
  }>();
  const practice = practiceById(params.id);
  const text = usePracticeText();
  const { addSession } = useMindfulness();
  const { today, goal, refreshNudge } = useDailyGoal();
  const a11yHaptics = useAccessibilityPrefs((s) => s.haptics);

  const minutes = Math.max(1, Number(params.duration) || practice?.defaultDuration || 5);
  const total = minutes * 60;
  const pace: Pace =
    params.pace === 'normal' || params.pace === 'fast'
      ? params.pace
      : params.pace === 'slow'
        ? 'slow'
        : 'normal';
  const isBreathing = practice?.kind === 'breathing';
  const pattern = practice?.pattern ?? CALM;
  const breaths = totalBreaths(pattern, isBreathing ? pace : 'normal', minutes);
  const haptics = params.haptics === '1' && a11yHaptics && practice?.kind !== 'sleep';
  const fadeOut = params.fadeOut === '1';

  const [running, setRunning] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState<Phase>('inhale');
  const [breath, setBreath] = useState(0);
  const [endOpen, setEndOpen] = useState(false);
  const [done, setDone] = useState(false);
  const scale = useRef(new Animated.Value(0.8)).current;
  const elapsedRef = useRef(0);
  const lastTick = useRef<number | null>(null);
  const lastPhase = useRef<string>('');

  useEffect(() => {
    void playSoundscape(params.sound ?? 'silence');
    return () => void stopSoundscape();
  }, [params.sound]);

  const finish = useCallback(
    async (completed: boolean) => {
      const seconds = Math.round(Math.min(total, elapsedRef.current));
      void stopSoundscape();
      if (!practice || (!completed && seconds < MIN_SAVE_SECONDS)) return;
      try {
        await addSession({
          seconds,
          note: text(practice).title,
          practice: {
            id: practice.id,
            category: practice.category,
            completed,
            plannedSeconds: total,
            options: { pace, sound: params.sound ?? 'silence', minutes },
          },
        });
        await refreshNudge(today + Math.round(seconds / 60), goal);
      } catch {
        // The session stays unsaved; the player still closes.
      }
    },
    [practice, total, addSession, text, pace, params.sound, minutes, refreshNudge, today, goal],
  );

  // One frame loop drives time, phase, the orb and the fade.
  useEffect(() => {
    if (!running || done) {
      lastTick.current = null;
      return;
    }
    let raf = 0;
    const frame = (now: number) => {
      if (lastTick.current !== null)
        elapsedRef.current = Math.min(total, elapsedRef.current + (now - lastTick.current) / 1000);
      lastTick.current = now;
      const e = elapsedRef.current;
      const at = breathAt(pattern, isBreathing ? pace : 'normal', e);
      scale.setValue(orbScale(at.phase, at.progress));
      const key = `${at.breath}:${at.phase}`;
      if (key !== lastPhase.current) {
        lastPhase.current = key;
        setPhase(at.phase);
        setBreath(at.breath);
        if (haptics && Platform.OS !== 'web')
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
      setElapsed((prev) => (Math.floor(prev) !== Math.floor(e) ? e : prev));
      if (fadeOut && total - e < FADE_SECONDS)
        setSoundscapeVolume(0.6 * Math.max(0, (total - e) / FADE_SECONDS));
      if (e >= total) {
        setDone(true);
        void finish(true);
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [running, done, total, pattern, isBreathing, pace, scale, haptics, fadeOut, finish]);

  const pause = (on: boolean) => {
    setRunning(!on);
    if (on) pauseSoundscape();
    else resumeSoundscape();
  };
  const askToLeave = useCallback(() => {
    if (done) return false;
    pause(true);
    setEndOpen(true);
    return true;
  }, [done]);
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', askToLeave);
    return () => sub.remove();
  }, [askToLeave]);

  if (!practice) return null;
  const title = text(practice).title;
  const cycle = pattern.inhale + pattern.hold + pattern.exhale + pattern.holdAfter;
  const doubleInhaleSecond =
    practice.pattern?.doubleInhale &&
    phase === 'inhale' &&
    elapsedRef.current % cycle > pattern.inhale / 2;
  const heading = isBreathing ? t(`practices.player.${phase}`) : t('practices.player.calm');
  const guidance = isBreathing
    ? t(doubleInhaleSecond ? 'practices.player.inhale2Body' : `practices.player.${phase}Body`)
    : t('practices.player.calmBody');
  const completeTitle =
    practice.kind === 'breathing'
      ? t('practices.complete.breathing')
      : practice.kind === 'sleep'
        ? t('practices.complete.sleep')
        : t('practices.complete.practice', { title });

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <GlowField
        glows={[{ color: palette.mustard, opacity: 0.28, x: -60, y: 30, width: 220, blur: 90 }]}
      />
      <View
        style={{
          marginTop: insets.top + 6,
          marginHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <IconButton
          variant="nav"
          accessibilityLabel={t('common.back')}
          onPress={() => (askToLeave() ? undefined : router.back())}
        />
        <Text style={[Type.titleSm, { fontSize: 20, color: palette.plumDeep }]}>
          {t('practices.player.title')}
        </Text>
      </View>

      <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 16 }}>
        <Text
          accessibilityRole="header"
          accessibilityLiveRegion="polite"
          style={[
            Type.titleMd,
            { fontSize: 30, lineHeight: 38, color: palette.plumDeep, marginTop: 36 },
          ]}
        >
          {heading}
        </Text>
        <Text
          style={[
            Type.bodyMMedium,
            {
              fontSize: 16,
              lineHeight: 26,
              color: palette.textMuted,
              textAlign: 'center',
              marginTop: 12,
            },
          ]}
        >
          {guidance}
        </Text>
        <View style={{ marginTop: 20 }}>
          <BreathingOrb
            scale={scale}
            hold={isBreathing && (phase === 'hold' || phase === 'holdAfter') && running}
            paused={!running && !done}
          />
        </View>
        {isBreathing && (
          <Text
            style={[
              Type.titleMd,
              { fontSize: 30, lineHeight: 38, color: palette.plumDeep, marginTop: 8 },
            ]}
          >
            {t('practices.player.breaths', {
              count: Math.min(breaths, breath + 1),
              total: breaths,
            })}
          </Text>
        )}
      </View>

      <View style={{ paddingHorizontal: 50, paddingBottom: insets.bottom + 24, gap: 24 }}>
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={[Type.body, { fontSize: 18, color: palette.textMuted }]}>
              {mmss(elapsed)}
            </Text>
            <Text style={[Type.body, { fontSize: 18, color: palette.textMuted }]}>
              {mmss(total)}
            </Text>
          </View>
          <View
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: total, now: Math.floor(elapsed) }}
            style={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(107,82,121,0.3)',
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                height: 8,
                borderRadius: 4,
                width: `${(elapsed / total) * 100}%`,
                backgroundColor: palette.plum,
              }}
            />
          </View>
        </View>
        <View
          style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 24 }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('practices.player.replay')}
            onPress={() => {
              elapsedRef.current = Math.floor(elapsedRef.current / cycle) * cycle;
              setElapsed(elapsedRef.current);
            }}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              borderWidth: 2,
              borderColor: palette.plum,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="arrow/replay" size={24} color={palette.plum} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={running ? t('practices.player.pause') : t('practices.player.play')}
            onPress={() => pause(running)}
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              borderWidth: 2,
              borderColor: palette.plum,
              backgroundColor: palette.white,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name={running ? 'line/pause' : 'line/play'} size={24} color={palette.plum} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('practices.player.forward')}
            onPress={() => {
              elapsedRef.current = Math.min(total - 1, elapsedRef.current + 10);
              setElapsed(elapsedRef.current);
            }}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              borderWidth: 2,
              borderColor: palette.plum,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={[Type.buttonS, { fontSize: 14, color: palette.plum }]}>+10</Text>
          </Pressable>
        </View>
      </View>

      <EndEarlySheet
        visible={endOpen}
        elapsed={elapsed}
        totalMinutes={minutes}
        onKeep={() => {
          setEndOpen(false);
          pause(false);
        }}
        onEnd={() => {
          setEndOpen(false);
          void finish(false).then(() => router.dismissTo('/(tabs)/mindful'));
        }}
      />
      <CompleteModal
        visible={done}
        title={completeTitle}
        body={
          practice.kind === 'sleep'
            ? t('practices.complete.sleepBody')
            : t('practices.complete.body')
        }
        onBack={() => router.dismissTo('/(tabs)/mindful')}
        onReflect={() =>
          router.replace({
            pathname: '/(tabs)/chat/new-conversation',
            params: {
              initialMessage: t('practices.complete.reflectPrompt', { title }),
              from: '/(tabs)/mindful',
            },
          })
        }
      />
    </View>
  );
}
