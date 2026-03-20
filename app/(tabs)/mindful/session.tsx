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

// Breathing phases
type Phase = 'inhale' | 'hold' | 'exhale' | 'holdAfter';

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

const PHASE_COLORS: Record<Phase, { bg: string[]; accent: string }> = {
  inhale: { bg: ['#2D5A3D', '#1A3D2A'], accent: '#5B8A5A' },
  hold: { bg: ['#3D3D5A', '#2A2A3D'], accent: '#7B6DC9' },
  exhale: { bg: ['#5A3D2D', '#3D2A1A'], accent: '#E8985A' },
  holdAfter: { bg: ['#3D3D5A', '#2A2A3D'], accent: '#7B6DC9' },
};

const RING_SIZE = 240;
const RING_STROKE = 10;

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const breatheAnim = useRef(new Animated.Value(0.7)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const phaseDurations = PHASE_DURATIONS[goal] || PHASE_DURATIONS.focus;

  // Start soundscape on mount, stop on unmount
  useEffect(() => {
    playSoundscape(soundscape);
    return () => { stopSoundscape(); };
  }, [soundscape]);

  // Pause/resume soundscape when timer pauses/resumes
  useEffect(() => {
    if (isActive) {
      resumeSoundscape();
    } else {
      pauseSoundscape();
    }
  }, [isActive]);

  const getNextPhase = useCallback(
    (phase: Phase): Phase => {
      switch (phase) {
        case 'inhale':
          return phaseDurations.hold > 0 ? 'hold' : 'exhale';
        case 'hold':
          return 'exhale';
        case 'exhale':
          return phaseDurations.holdAfter > 0 ? 'holdAfter' : 'inhale';
        case 'holdAfter':
          return 'inhale';
      }
    },
    [phaseDurations],
  );

  // Breathing animation
  useEffect(() => {
    if (!isActive) {
      breatheAnim.stopAnimation();
      return;
    }

    const dur = phaseDurations[currentPhase] * 1000;
    const toValue = currentPhase === 'inhale' ? 1.0 : currentPhase === 'exhale' ? 0.7 : 0.85;

    Animated.timing(breatheAnim, {
      toValue,
      duration: dur,
      easing: Easing.inOut(Easing.sin),
      useNativeDriver: true,
    }).start();
  }, [currentPhase, isActive, phaseDurations, breatheAnim]);

  // Main timer + phase management
  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // @ts-ignore
      timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= totalSeconds) {
          setIsActive(false);
          stopSoundscape();
          // Navigate to completed
          const goalLabel = goal || 'focus';
          addMindfulMinutes(totalSeconds, `${goalLabel} exercise`).catch(() => {});
          setTimeout(() => {
            router.replace({
              pathname: '/(tabs)/mindful/completed',
              params: { minutes, goal: goalLabel },
            });
          }, 500);
          return totalSeconds;
        }
        return next;
      });

      setPhaseTimer((prev) => {
        const phaseDur = phaseDurations[currentPhase];
        if (prev + 1 >= phaseDur) {
          setCurrentPhase((p) => getNextPhase(p));
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [
    isActive,
    currentPhase,
    phaseDurations,
    totalSeconds,
    getNextPhase,
    addMindfulMinutes,
    goal,
    minutes,
  ]);

  // Progress animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: elapsed / totalSeconds,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [elapsed, totalSeconds, progressAnim]);

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
        backgroundColor: phaseColors.bg[0],
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
            backgroundColor: 'rgba(255,255,255,0.15)',
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
            backgroundColor: 'rgba(255,255,255,0.15)',
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
          color: 'rgba(255,255,255,0.95)',
          marginBottom: 32,
          letterSpacing: 1,
        }}
      >
        {getPhaseLabels(t)[currentPhase]}
      </Text>

      {/* Circular progress ring */}
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
              stroke="rgba(255,255,255,0.15)"
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
              color: 'rgba(255,255,255,0.6)',
              fontWeight: '600',
              marginTop: 4,
            }}
          >
            {formatTime(elapsed)} / {formatTime(totalSeconds)}
          </Text>
        </View>
      </View>

      {/* Phase progress dots */}
      <View
        style={{
          flexDirection: 'row',
          gap: 8,
          marginTop: 32,
          marginBottom: 40,
        }}
      >
        {(['inhale', 'hold', 'exhale', 'holdAfter'] as Phase[])
          .filter((p) => phaseDurations[p] > 0)
          .map((p) => (
            <View
              key={p}
              style={{
                width: currentPhase === p ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor:
                  currentPhase === p ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
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
          onPress={() => {
            setElapsed(Math.max(0, elapsed - 15));
          }}
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
            backgroundColor: 'rgba(255,255,255,0.15)',
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
            backgroundColor: 'rgba(255,255,255,0.95)',
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
            color={phaseColors.bg[0]}
          />
        </Pressable>

        <Pressable
          onPress={() => {
            setElapsed(Math.min(totalSeconds, elapsed + 15));
          }}
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
            backgroundColor: 'rgba(255,255,255,0.15)',
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
