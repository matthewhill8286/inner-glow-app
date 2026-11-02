import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { GlowField } from '@/components/glow/Glow';
import { Icon } from '@/components/icons/Icon';
import { Moon, StarField } from '@/components/sleep/NightSky';
import { useSleep } from '@/hooks/useSleep';
import { useProfile } from '@/hooks/useProfile';
import { greetingName } from '@/lib/profile-stats';
import { clockFrom } from '@/lib/sleep-home';
import { swipeComplete } from '@/lib/sleep-flow';

const KNOB = 48;
const PAD = 6;

/**
 * Sleep mode (06 §S4): stars and the moon, "Good night", the live clock, the alarm and sound pill,
 * and Swipe when you wake up, which opens Wake up once the knob passes 80 % of the track.
 * Screen readers get the same action through the swipe control's activate action.
 */
export default function SleepModeScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { sleepMode, schedule } = useSleep();
  const { profile } = useProfile({ lazy: true });
  const [now, setNow] = useState(new Date());
  const name = greetingName(profile);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const trackW = width - 48;
  const travel = trackW - PAD * 2 - KNOB;
  const x = useRef(new Animated.Value(0)).current;
  const wake = () => router.replace('/(tabs)/sleep/wake');
  const wakeRef = useRef(wake);
  wakeRef.current = wake;

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (_, g) => x.setValue(Math.max(0, Math.min(travel, g.dx))),
        onPanResponderRelease: (_, g) => {
          if (swipeComplete(Math.max(0, g.dx), travel)) {
            Animated.timing(x, { toValue: travel, duration: 120, useNativeDriver: true }).start(() => wakeRef.current());
          } else {
            Animated.spring(x, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
          }
        },
        onPanResponderTerminate: () => Animated.spring(x, { toValue: 0, useNativeDriver: true }).start(),
      }),
    [travel, x],
  );

  const pill = [
    schedule.autoSetAlarm ? t('sleepFlow.mode.alarm', { time: clockFrom(schedule.wakeHour, schedule.wakeMin) }) : null,
    sleepMode.soundKey ? t(`sleepFlow.sounds.${sleepMode.soundKey}`, { defaultValue: sleepMode.soundKey }) : null,
  ].filter(Boolean);

  return (
    <View style={{ flex: 1, backgroundColor: palette.ink }}>
      <StatusBar style="light" />
      <StarField width={width} height={740} style={{ position: 'absolute', top: 0 }} />
      <GlowField glows={[{ color: palette.lavenderSoft, opacity: 0.3, x: 57.5, y: 170, width: 260, blur: 70 }]} />
      <View style={{ flex: 1, alignItems: 'center', paddingTop: insets.top + 208 }}>
        <Moon size={96} />
        <Text style={[Type.titleMd, { color: palette.white, marginTop: 92, textAlign: 'center' }]}>
          {name ? t('sleepFlow.mode.goodNightName', { name }) : t('sleepFlow.mode.goodNight')}
        </Text>
        <Text
          accessibilityRole="text"
          style={[Type.display, { fontSize: 64, lineHeight: 80, color: palette.white, marginTop: 4, fontVariant: ['tabular-nums'] }]}
        >
          {clockFrom(now.getHours(), now.getMinutes())}
        </Text>
        {pill.length > 0 && (
          <View
            style={{
              marginTop: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingVertical: 6,
              paddingLeft: 12,
              paddingRight: 14,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.10)',
            }}
          >
            {schedule.autoSetAlarm && <Icon name="line/bell" size={14} color={palette.white} />}
            <Text style={[Type.caption, { color: palette.white }]}>{pill.join(' · ')}</Text>
          </View>
        )}
      </View>

      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={t('sleepFlow.mode.swipe')}
        accessibilityActions={[{ name: 'activate', label: t('sleepFlow.mode.wakeAction') }]}
        onAccessibilityAction={wake}
        style={{
          marginHorizontal: 24,
          marginBottom: insets.bottom + 28,
          height: 60,
          borderRadius: 30,
          backgroundColor: 'rgba(255,255,255,0.08)',
          justifyContent: 'center',
        }}
      >
        <Animated.Text
          style={[
            Type.bodyMSemi,
            {
              position: 'absolute',
              left: 72,
              color: 'rgba(255,255,255,0.80)',
              opacity: x.interpolate({ inputRange: [0, 72], outputRange: [1, 0], extrapolate: 'clamp' }),
            },
          ]}
        >
          {t('sleepFlow.mode.swipe')}
        </Animated.Text>
        <Animated.View
          {...responder.panHandlers}
          hitSlop={10}
          style={{
            position: 'absolute',
            left: PAD,
            width: KNOB,
            height: KNOB,
            borderRadius: KNOB / 2,
            backgroundColor: palette.softButton,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ translateX: x }],
          }}
        >
          <Icon name="arrow/forward" size={20} color={palette.ink} />
        </Animated.View>
      </View>
    </View>
  );
}
