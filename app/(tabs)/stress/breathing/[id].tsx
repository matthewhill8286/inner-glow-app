import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, Easing } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import ScreenHeader from '@/components/ScreenHeader';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import { BREATHING_EXERCISES } from '@/data/breathingExercises';
import { useStressHistory } from '@/hooks/useStressHistory';

type Phase = 'inhale' | 'hold' | 'exhale' | 'hold-after-exhale';

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

  const plan = useMemo(() => {
    if (!exercise) return { label: 'Inhale', secs: 4 };

    if (phase === 'inhale') return { label: 'Inhale', secs: exercise.inhale };
    if (phase === 'hold') return { label: 'Hold', secs: exercise.hold ?? 0 };
    if (phase === 'exhale') return { label: 'Exhale', secs: exercise.exhale };
    return { label: 'Pause', secs: exercise.holdAfterExhale ?? 0 };
  }, [phase, exercise]);

  useEffect(() => {
    if (!running || !exercise) return;

    setSecondsLeft(plan.secs);

    if (phase === 'inhale') {
      Animated.timing(scale, {
        toValue: 1.05,
        duration: plan.secs * 1000,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.quad),
      }).start();
    } else if (phase === 'hold') {
      // Keep at 1.05
      Animated.timing(scale, {
        toValue: 1.05,
        duration: plan.secs * 1000,
        useNativeDriver: true,
        easing: Easing.linear,
      }).start();
    } else if (phase === 'exhale') {
      Animated.timing(scale, {
        toValue: 0.75,
        duration: plan.secs * 1000,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.quad),
      }).start();
    } else {
      // hold-after-exhale: Keep at 0.75
      Animated.timing(scale, {
        toValue: 0.75,
        duration: plan.secs * 1000,
        useNativeDriver: true,
        easing: Easing.linear,
      }).start();
    }

    const tick = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);

    const t = setTimeout(() => {
      clearInterval(tick);

      setPhase((p) => {
        if (p === 'inhale') {
          if (exercise.hold) return 'hold';
          return 'exhale';
        }
        if (p === 'hold') return 'exhale';
        if (p === 'exhale') {
          if (exercise.holdAfterExhale) return 'hold-after-exhale';
          return 'inhale';
        }
        return 'inhale';
      });

      if ((phase === 'exhale' && !exercise.holdAfterExhale) || phase === 'hold-after-exhale') {
        setCycles((c) => {
          const newCycles = c + 1;
          if (newCycles === 4) {
            addStressCompletion(exercise.id, exercise.title);
          }
          return newCycles;
        });
      }
    }, plan.secs * 1000);

    return () => {
      clearInterval(tick);
      clearTimeout(t);
    };
  }, [running, phase, plan.secs, scale, exercise, addStressCompletion]);

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
        <View style={{ backgroundColor: colors.card, borderRadius: UI.radius.lg, padding: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: colors.text }}>How it works</Text>
          <Text style={{ color: colors.mutedText, marginTop: 6 }}>{exercise.description}</Text>
        </View>

        <View style={{ alignItems: 'center', marginTop: 22 }}>
          <Animated.View
            style={{
              width: 220,
              height: 220,
              borderRadius: 110,
              backgroundColor: theme === 'light' ? '#efe6dd' : colors.surface,
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
                backgroundColor: colors.primary,
                opacity: 0.25,
              }}
            />
          </Animated.View>

          <Text style={{ marginTop: 18, fontSize: 22, fontWeight: '900', color: colors.text }}>
            {plan.label}
          </Text>
          <Text style={{ color: colors.mutedText, marginTop: 6 }}>
            {running ? `${secondsLeft}s` : 'Ready'}
          </Text>
          <Text style={{ color: colors.mutedText, marginTop: 6 }}>Cycles completed: {cycles}</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 22 }}>
          {running ? (
            <Pressable
              onPress={stop}
              style={{
                flex: 1,
                backgroundColor: colors.text,
                padding: 16,
                borderRadius: UI.radius.lg,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: colors.background, fontWeight: '900' }}>Stop</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => setRunning(true)}
              style={{
                flex: 1,
                backgroundColor: colors.primary,
                padding: 16,
                borderRadius: UI.radius.lg,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: colors.onPrimary, fontWeight: '900' }}>Start</Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => {
              stop();
              setCycles(0);
            }}
            style={{
              flex: 1,
              backgroundColor: colors.divider,
              padding: 16,
              borderRadius: UI.radius.lg,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontWeight: '900', color: colors.text }}>Reset</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
