import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { View, Text, Pressable, Animated, Easing } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import ScreenHeader from '@/components/ScreenHeader';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import { BREATHING_EXERCISES } from '@/data/breathingExercises';
import { useStressHistory } from '@/hooks/useStressHistory';

type Phase = 'inhale' | 'hold' | 'exhale' | 'hold-after-exhale';

// ─── Green palette for positive breathing indicator ───
const BREATHE_GREEN = '#4ADE80';
const BREATHE_GREEN_LIGHT = 'rgba(74, 222, 128, 0.18)';
const BREATHE_GREEN_RING = 'rgba(74, 222, 128, 0.35)';

export default function BreathingExerciseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const exercise = BREATHING_EXERCISES.find((e) => e.id === id);
  const { addStressCompletion } = useStressHistory();

  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const [phase, setPhase] = useState<Phase>('inhale');
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(exercise?.inhale ?? 4);
  const [cycles, setCycles] = useState(0);

  const scale = useRef(new Animated.Value(0.75)).current;

  // ─── Refs for stable timer callback (avoids stale closures) ───
  const addStressCompletionRef = useRef(addStressCompletion);
  useEffect(() => { addStressCompletionRef.current = addStressCompletion; }, [addStressCompletion]);

  // ─── Compute next phase ───
  const getNextPhase = useCallback(
    (p: Phase): Phase => {
      if (!exercise) return 'inhale';
      if (p === 'inhale') return exercise.hold ? 'hold' : 'exhale';
      if (p === 'hold') return 'exhale';
      if (p === 'exhale') return exercise.holdAfterExhale ? 'hold-after-exhale' : 'inhale';
      return 'inhale'; // hold-after-exhale → inhale
    },
    [exercise],
  );

  // ─── Check if current phase completes a cycle ───
  const isEndOfCycle = useCallback(
    (p: Phase): boolean => {
      if (!exercise) return false;
      // A cycle ends when we're about to loop back to inhale
      if (p === 'exhale' && !exercise.holdAfterExhale) return true;
      if (p === 'hold-after-exhale') return true;
      return false;
    },
    [exercise],
  );

  // ─── Phase label & duration ───
  const plan = useMemo(() => {
    if (!exercise) return { label: 'Inhale', secs: 4 };
    if (phase === 'inhale') return { label: 'Inhale', secs: exercise.inhale };
    if (phase === 'hold') return { label: 'Hold', secs: exercise.hold ?? 0 };
    if (phase === 'exhale') return { label: 'Exhale', secs: exercise.exhale };
    return { label: 'Pause', secs: exercise.holdAfterExhale ?? 0 };
  }, [phase, exercise]);

  // ─── Animation + timer effect ───
  useEffect(() => {
    if (!running || !exercise) return;

    // Reset countdown for new phase
    setSecondsLeft(plan.secs);

    // ── Animate the breathing circle ──
    let toValue: number;
    let easing: (t: number) => number;

    if (phase === 'inhale') {
      toValue = 1.05;
      easing = Easing.inOut(Easing.quad);
    } else if (phase === 'exhale') {
      toValue = 0.75;
      easing = Easing.inOut(Easing.quad);
    } else if (phase === 'hold') {
      toValue = 1.05; // stay expanded
      easing = Easing.linear;
    } else {
      toValue = 0.75; // stay contracted
      easing = Easing.linear;
    }

    const anim = Animated.timing(scale, {
      toValue,
      duration: plan.secs * 1000,
      useNativeDriver: true,
      easing,
    });
    anim.start();

    // ── Countdown tick (uses its own interval, no external deps) ──
    const tick = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);

    // ── Phase transition after duration elapses ──
    const timeout = setTimeout(() => {
      clearInterval(tick);

      const completedPhase = phase; // capture before state change
      const nextPhase = getNextPhase(completedPhase);

      // Check if this phase completes a full cycle
      if (isEndOfCycle(completedPhase)) {
        setCycles((c) => {
          const newCount = c + 1;
          if (newCount === 4 && exercise) {
            addStressCompletionRef.current(exercise.id, exercise.title);
          }
          return newCount;
        });
      }

      setPhase(nextPhase);
    }, plan.secs * 1000);

    return () => {
      clearInterval(tick);
      clearTimeout(timeout);
      anim.stop();
    };
    // Only re-run when phase or running changes — NOT on addStressCompletion ref changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, phase]);

  function stop() {
    setRunning(false);
    setPhase('inhale');
    setSecondsLeft(exercise?.inhale ?? 4);
    Animated.timing(scale, { toValue: 0.75, duration: 220, useNativeDriver: true }).start();
  }

  if (!exercise) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: 20 }}>
        <ScreenHeader title="Not Found" showBack />
        <Text style={{ color: colors.text, marginTop: 20 }}>Exercise not found.</Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        padding: UI.spacing.xl,
      }}
    >
      <ScreenHeader title={exercise.title} subtitle={exercise.subtitle} showBack />
      <View style={{ flex: 1, marginTop: 14 }}>
        {/* How it works card */}
        <View style={{ backgroundColor: colors.card, borderRadius: UI.radius.lg, padding: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: colors.text }}>How it works</Text>
          <Text style={{ color: colors.mutedText, marginTop: 6 }}>{exercise.description}</Text>
        </View>

        {/* Breathing indicator — green themed */}
        <View style={{ alignItems: 'center', marginTop: 22 }}>
          <Animated.View
            style={{
              width: 220,
              height: 220,
              borderRadius: 110,
              backgroundColor: BREATHE_GREEN_LIGHT,
              borderWidth: 3,
              borderColor: running ? BREATHE_GREEN_RING : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale }],
            }}
          >
            <View
              style={{
                width: 160,
                height: 160,
                borderRadius: 80,
                backgroundColor: BREATHE_GREEN,
                opacity: running ? 0.45 : 0.25,
              }}
            />
          </Animated.View>

          {/* Phase label */}
          <Text
            style={{
              marginTop: 18,
              fontSize: 22,
              fontWeight: '900',
              color: running ? BREATHE_GREEN : colors.text,
            }}
          >
            {plan.label}
          </Text>

          {/* Countdown / Ready */}
          <Text style={{ color: colors.mutedText, marginTop: 6, fontSize: 16, fontWeight: '600' }}>
            {running ? `${secondsLeft}s` : 'Ready'}
          </Text>

          {/* Cycles */}
          <Text style={{ color: colors.mutedText, marginTop: 6 }}>
            Cycles completed: {cycles}
          </Text>
        </View>

        {/* Controls */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 22 }}>
          {running ? (
            <Pressable
              onPress={stop}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: colors.text,
                padding: 16,
                borderRadius: UI.radius.lg,
                alignItems: 'center',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ color: colors.background, fontWeight: '900' }}>Stop</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => setRunning(true)}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: BREATHE_GREEN,
                padding: 16,
                borderRadius: UI.radius.lg,
                alignItems: 'center',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ color: '#1B3A2A', fontWeight: '900' }}>Start</Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => {
              stop();
              setCycles(0);
            }}
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: colors.divider,
              padding: 16,
              borderRadius: UI.radius.lg,
              alignItems: 'center',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ fontWeight: '900', color: colors.text }}>Reset</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
