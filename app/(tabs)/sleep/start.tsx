import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Platform, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSleep } from '@/hooks/useSleep';
import { UI } from '@/constants/theme';

/* ── helpers ──────────────────────────────────────── */
function goBack(from?: string) {
  if (from) router.replace(from as any);
  else router.back();
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(ms: number) {
  const h = Math.floor(ms / (1000 * 60 * 60));
  const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${h}h ${m}m`;
}

/* ── Main Screen ─────────────────────────────────── */
export default function StartSleepingScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { sleepMode, setSleepMode } = useSleep();
  const isSleeping = !!sleepMode.sleepModeStartISO;

  const [now, setNow] = useState(new Date());
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Clock tick
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Pulse animation for the main button
  useEffect(() => {
    if (isSleeping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isSleeping, pulseAnim]);

  const elapsed = isSleeping ? now.getTime() - new Date(sleepMode.sleepModeStartISO!).getTime() : 0;

  const handleToggle = async () => {
    if (isSleeping) {
      // Stop sleeping → compute & log
      const start = new Date(sleepMode.sleepModeStartISO!);
      const end = new Date();
      const durationHrs =
        Math.round(((end.getTime() - start.getTime()) / (1000 * 60 * 60)) * 10) / 10;

      await setSleepMode({ sleepModeStartISO: null });

      // Navigate to log with pre-filled duration
      router.push({
        pathname: '/(tabs)/sleep/log',
        params: { duration: durationHrs.toString(), from: '/(tabs)/sleep' },
      });
    } else {
      // Start sleeping
      await setSleepMode({ sleepModeStartISO: new Date().toISOString() });
    }
  };

  const userName = 'there'; // generic fallback

  return (
    <View style={s.container}>
      {/* Decorative circles */}
      <View style={[s.bgCircle1]} />
      <View style={[s.bgCircle2]} />
      <View style={[s.bgCircle3]} />

      {/* ── Back Button ────────────────────────── */}
      <Pressable
        onPress={() => goBack(from)}
        style={({ pressed }) => [s.backBtn, { opacity: pressed ? 0.7 : 1 }]}
      >
        <MaterialIcons
          name={Platform.OS === 'ios' ? 'arrow-back-ios-new' : 'arrow-back'}
          size={18}
          color="rgba(255,255,255,0.8)"
        />
      </Pressable>

      {/* ── Content ────────────────────────────── */}
      <View style={s.content}>
        {isSleeping ? (
          <>
            {/* Sleeping state */}
            <Text style={s.greeting}>{t('sleepStart.goodNight', { name: userName })}</Text>
            <Text style={s.clock}>{formatTime(now)}</Text>

            <View style={s.statsRow}>
              <View style={s.statPill}>
                <MaterialIcons name="access-time" size={14} color="rgba(255,255,255,0.7)" />
                <Text style={s.statText}>{formatDuration(elapsed)}</Text>
              </View>
              <View style={s.statPill}>
                <MaterialIcons name="nightlight-round" size={14} color="rgba(255,255,255,0.7)" />
                <Text style={s.statText}>{t('sleepStart.sleepMode')}</Text>
              </View>
            </View>

            {/* Sleeping illustration placeholder */}
            <View style={s.illustrationWrap}>
              <Text style={{ fontSize: 80 }}>😴</Text>
            </View>
          </>
        ) : (
          <>
            {/* Ready to sleep */}
            <Text style={s.greeting}>{t('sleepStart.readyToSleep')}</Text>
            <Text style={s.clock}>{formatTime(now)}</Text>

            <Text style={s.subtitle}>{t('sleepStart.instruction')}</Text>

            {/* Moon illustration */}
            <View style={s.illustrationWrap}>
              <Text style={{ fontSize: 80 }}>🌙</Text>
            </View>
          </>
        )}

        {/* ── Main Action Button ───────────────── */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Pressable
            onPress={handleToggle}
            style={({ pressed }) => [
              s.mainBtn,
              isSleeping
                ? { backgroundColor: 'rgba(255,255,255,0.15)' }
                : { backgroundColor: 'rgba(255,255,255,0.12)' },
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <View style={s.mainBtnInner}>
              <MaterialIcons name={isSleeping ? 'stop' : 'play-arrow'} size={48} color="#FFF" />
            </View>
          </Pressable>
        </Animated.View>

        <Text style={s.mainBtnLabel}>
          {isSleeping ? t('sleepStart.tapToWakeUp') : t('sleepStart.startSleeping')}
        </Text>

        {/* ── Schedule link ────────────────────── */}
        {!isSleeping && (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/(tabs)/sleep/schedule' as any,
                params: { from: '/(tabs)/sleep/start' },
              })
            }
            style={({ pressed }) => [s.scheduleBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <MaterialIcons name="alarm" size={18} color="rgba(255,255,255,0.8)" />
            <Text style={s.scheduleBtnText}>{t('sleepStart.orScheduleSleep')}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

/* ── Styles ──────────────────────────────────────── */
const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2A1A3E',
    paddingHorizontal: UI.spacing.xl,
  },

  bgCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(123,109,201,0.12)',
    top: -80,
    right: -60,
  },
  bgCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(91,138,90,0.10)',
    bottom: 100,
    left: -60,
  },
  bgCircle3: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(232,152,90,0.08)',
    bottom: 200,
    right: 20,
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Platform.OS === 'ios' ? 60 : 40,
  } as any,

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },

  greeting: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 8,
  },
  clock: {
    color: '#FFF',
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 12,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.60)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 40,
    marginBottom: 20,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  statText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '700',
  },

  illustrationWrap: {
    marginVertical: 30,
    width: 120,
    height: 120,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  mainBtn: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.20)',
  },
  mainBtnInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainBtnLabel: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 16,
  },

  scheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 32,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  scheduleBtnText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '700',
  },
});
