import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, Platform, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Svg, { Circle } from 'react-native-svg';
import { useMindfulness } from '@/hooks/useMindfulness';
import { playSoundscape, stopSoundscape, pauseSoundscape, resumeSoundscape } from '@/lib/soundscape';

// ─── Breathing phases ───────────────────────────
type Phase = 'inhale' | 'hold' | 'exhale' | 'holdAfter';

const PHASE_ORDER: Phase[] = ['inhale', 'hold', 'exhale', 'holdAfter'];

const PHASE_DURATIONS: Record<string, Record<Phase, number>> = {
  focus: { inhale: 4, hold: 4, exhale: 4, holdAfter: 4 }, // Box breathing
  sleep: { inhale: 4, hold: 7, exhale: 8, holdAfter: 0 }, // 4-7-8
  better: { inhale: 4, hold: 4, exhale: 6, holdAfter: 2 },
  trauma: { inhale: 5, hold: 5, exhale: 5, holdAfter: 5 },
  enjoy: { inhale: 4, hold: 2, exhale: 6, holdAfter: 0 },
};

const getPhaseLabels = (t: any): Record<Phase, string> => ({
  inhale: t('mindfulSession.inhale'),
  hold: t('mindfulSession.hold'),
  exhale: t('mindfulSession.exhale'),
  holdAfter: t('mindfulSession.holdAfter'),
});

// ─── Green-themed phase colors (positive feeling) ───────
const PHASE_COLORS: Record<Phase, { bg: string; accent: string }> = {
  inhale: { bg: '#1B3A2A', accent: '#4ADE80' },
  hold: { bg: '#1A3328', accent: '#86EFAC' },
  exhale: { bg: '#1E3B2C', accent: '#22C55E' },
  holdAfter: { bg: '#1A3328', accent: '#86EFAC' },
};

const RING_SIZE = 240;
const RING_STROKE = 10;

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function Session() {
  const {
    goal = 'focus',
    minutes = '25',
    soundscape = 'silence',
  } = useLocalSearchParams<{
    goal: string;
    minutes: string;
    soundscape: string;
  }>();

  const { t } = useTranslation();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const { addMindfulMinutes } = useMindfulness();

  const totalSeconds = parseInt(minutes, 10) * 60;
  const [elapsed, setElapsed] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [currentPhase, setCurrentPhase] = useState<Phase>('inhale');
  const [phaseTimer, setPhaseTimer] = useState(0);

  const breatheAnim = useRef(new Animated.Value(0.7)).current;
  const breatheAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const phaseDurations = PHASE_DURATIONS[goal] || PHASE_DURATIONS.focus;

  // ─── Refs for stable interval callback ────────────
  // These avoid stale closures inside setInterval
  const phaseRef = useRef(currentPhase);
  const phaseTimerRef = useRef(phaseTimer);
  const elapsedRef = useRef(elapsed);
  const isActiveRef = useRef(isActive);
  const addMindfulMinutesRef = useRef(addMindfulMinutes);

  useEffect(() => { phaseRef.current = currentPhase; }, [currentPhase]);
  useEffect(() => { phaseTimerRef.current = phaseTimer; }, [phaseTimer]);
  useEffect(() => { elapsedRef.current = elapsed; }, [elapsed]);
  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);
  useEffect(() => { addMindfulMinutesRef.current = addMindfulMinutes; }, [addMindfulMinutes]);

  // ─── Get next phase (skipping phases with 0 duration) ────
  const getNextPhase = useCallback(
    (phase: Phase): Phase => {
      const currentIdx = PHASE_ORDER.indexOf(phase);
      for (let i = 1; i <= PHASE_ORDER.length; i++) {
        const nextPhase = PHASE_ORDER[(currentIdx + i) % PHASE_ORDER.length];
        if (phaseDurations[nextPhase] > 0) return nextPhase;
      }
      return 'inhale'; // fallback
    },
    [phaseDurations],
  );

  // ─── Start soundscape on mount, stop on unmount ────
  useEffect(() => {
    playSoundscape(soundscape);
    return () => { stopSoundscape(); };
  }, [soundscape]);

  // ─── Pause/resume soundscape ────
  useEffect(() => {
    if (isActive) {
      resumeSoundscape();
    } else {
      pauseSoundscape();
    }
  }, [isActive]);

  // ─── Breathing animation — restarts on each phase change ────
  useEffect(() => {
    if (!isActive) {
      breatheAnimRef.current?.stop();
      return;
    }

    const dur = phaseDurations[currentPhase] * 1000;
    let toValue: number;

    switch (currentPhase) {
      case 'inhale':
        toValue = 1.0; // expand
        break;
      case 'exhale':
        toValue = 0.7; // contract
        break;
      case 'hold':
      case 'holdAfter':
      default:
        toValue = currentPhase === 'hold' ? 1.0 : 0.7; // hold at current size
        break;
    }

    const anim = Animated.timing(breatheAnim, {
      toValue,
      duration: dur,
      easing:
        currentPhase === 'inhale' || currentPhase === 'exhale'
          ? Easing.inOut(Easing.sin)
          : Easing.linear,
      useNativeDriver: true,
    });

    breatheAnimRef.current = anim;
    anim.start();

    return () => { anim.stop(); };
  }, [currentPhase, isActive, phaseDurations, breatheAnim]);

  // ─── Main timer — single stable interval ────
  useEffect(() => {
    if (!isActive) return;

    const intervalId = setInterval(() => {
      // Advance elapsed time
      const nextElapsed = elapsedRef.current + 1;

      if (nextElapsed >= totalSeconds) {
        // Session complete
        clearInterval(intervalId);
        setIsActive(false);
        setElapsed(totalSeconds);
        stopSoundscape();

        const goalLabel = goal || 'focus';
        addMindfulMinutesRef.current(totalSeconds, `${goalLabel} exercise`).catch(() => {});

        setTimeout(() => {
          router.replace({
            pathname: '/(tabs)/mindful/completed',
            params: { minutes, goal: goalLabel },
          });
        }, 500);
        return;
      }

      setElapsed(nextElapsed);

      // Advance phase timer
      const nextPhaseTimer = phaseTimerRef.current + 1;
      const phaseDur = phaseDurations[phaseRef.current];

      if (nextPhaseTimer >= phaseDur) {
        // Move to next phase
        const nextPhase = getNextPhase(phaseRef.current);
        setCurrentPhase(nextPhase);
        setPhaseTimer(0);
      } else {
        setPhaseTimer(nextPhaseTimer);
      }
    }, 1000);

    return () => clearInterval(intervalId);
    // Only depend on isActive and stable values — NOT on currentPhase or addMindfulMinutes
    // We read those from refs to avoid tearing down the interval unnecessarily
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, totalSeconds, phaseDurations, getNextPhase]);

  // ─── Derived render values ────
  const phaseColors = PHASE_COLORS[currentPhase];
  const remaining = totalSeconds - elapsed;
  const progressPercent = elapsed / totalSeconds;

  const radius = (RING_SIZE - RING_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressPercent);

  const handleQuit = () => {
    setIsActive(false);
    stopSoundscape();
    if (elapsed > 30) {
      const goalLabel = goal || 'focus';
      addMindfulMinutes(elapsed, `${goalLabel} exercise`).catch(() => {});
    }
    router.back();
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: phaseColors.bg,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: UI.spacing.xl,
      }}
    >
      {/* Close button */}
      <View
        style={{
          position: 'absolute',
          top: Platform.OS === 'ios' ? 60 : 40,
          left: 20,
          right: 20,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        } as any}
      >
        <Pressable
          onPress={handleQuit}
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
            backgroundColor: 'rgba(255,255,255,0.12)',
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <MaterialIcons name="close" size={24} color="rgba(255,255,255,0.9)" />
        </Pressable>

        {/* Soundscape indicator */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: 'rgba(255,255,255,0.12)',
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: UI.radius.pill,
          }}
        >
          <MaterialIcons name="music-note" size={16} color="rgba(255,255,255,0.8)" />
          <Text
            style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: 13,
              fontWeight: '600',
            }}
          >
            {soundscape}
          </Text>
        </View>
      </View>

      {/* Phase label */}
      <Text
        style={{
          fontSize: 24,
          fontWeight: '800',
          color: phaseColors.accent,
          marginBottom: 32,
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}
      >
        {getPhaseLabels(t)[currentPhase]}
      </Text>

      {/* Circular breathing ring */}
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View
          style={{
            transform: [{ scale: breatheAnim }],
          }}
        >
          <Svg width={RING_SIZE} height={RING_SIZE}>
            {/* Background ring */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={radius}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={RING_STROKE}
              fill="none"
            />
            {/* Progress ring */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={radius}
              stroke={phaseColors.accent}
              strokeWidth={RING_STROKE}
              fill="none"
              strokeDasharray={`${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
            />
          </Svg>
        </Animated.View>

        {/* Center content */}
        <View
          style={{
            position: 'absolute',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 42,
              fontWeight: '900',
              color: '#FFFFFF',
              letterSpacing: -1,
            }}
          >
            {formatTime(remaining)}
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.5)',
              fontWeight: '600',
              marginTop: 4,
            }}
          >
            {formatTime(elapsed)} / {formatTime(totalSeconds)}
          </Text>

          {/* Phase countdown */}
          <Text
            style={{
              fontSize: 16,
              fontWeight: '700',
              color: phaseColors.accent,
              marginTop: 10,
              opacity: 0.9,
            }}
          >
            {phaseDurations[currentPhase] - phaseTimer}s
          </Text>
        </View>
      </View>

      {/* Phase indicator dots */}
      <View
        style={{
          flexDirection: 'row',
          gap: 8,
          marginTop: 32,
          marginBottom: 40,
        }}
      >
        {PHASE_ORDER
          .filter((p) => phaseDurations[p] > 0)
          .map((p) => (
            <View
              key={p}
              style={{
                width: currentPhase === p ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor:
                  currentPhase === p ? phaseColors.accent : 'rgba(255,255,255,0.25)',
              }}
            />
          ))}
      </View>

      {/* Playback controls */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <Pressable
          onPress={() => setElapsed(Math.max(0, elapsed - 15))}
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
            backgroundColor: 'rgba(255,255,255,0.12)',
            width: 52,
            height: 52,
            borderRadius: 26,
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <MaterialIcons name="replay-10" size={24} color="rgba(255,255,255,0.8)" />
        </Pressable>

        <Pressable
          onPress={() => setIsActive(!isActive)}
          style={({ pressed }) => ({
            opacity: pressed ? 0.8 : 1,
            backgroundColor: phaseColors.accent,
            width: 72,
            height: 72,
            borderRadius: 36,
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <MaterialIcons
            name={isActive ? 'pause' : 'play-arrow'}
            size={36}
            color={phaseColors.bg}
          />
        </Pressable>

        <Pressable
          onPress={() => setElapsed(Math.min(totalSeconds, elapsed + 15))}
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
            backgroundColor: 'rgba(255,255,255,0.12)',
            width: 52,
            height: 52,
            borderRadius: 26,
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <MaterialIcons name="forward-10" size={24} color="rgba(255,255,255,0.8)" />
        </Pressable>
      </View>
    </View>
  );
}
