import React, { useEffect, useMemo } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Polyline } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon } from '@/components/icons/Icon';
import { Glow, GlowField } from '@/components/glow/Glow';
import { AppButton } from '@/components/ui/AppButton';
import { IconButton } from '@/components/ui/IconButton';
import { useJournal } from '@/hooks/useJournal';
import { monthProgress } from '@/lib/journal-entry';
import { activeDays, streak } from '@/lib/profile-stats';

const AnimatedPolyline = Animated.createAnimatedComponent(Polyline);

/** Constellation points from `6682:3464`, relative to a 375×150 box whose top is at y 230. */
const STARS = [
  [77.5, 110],
  [117.5, 50],
  [167.5, 80],
  [217.5, 30],
  [267.5, 65],
];
const NEW_STAR = [307.5, 120];
const BOX_H = 150;
const LINE_LENGTH = [...STARS, NEW_STAR].reduce(
  (sum, p, i, all) => (i === 0 ? 0 : sum + Math.hypot(p[0] - all[i - 1][0], p[1] - all[i - 1][1])),
  0,
);

/**
 * Saved (04 J6): the constellation draws its line to a new star, which blooms, then "Saved to your
 * sky" with this month's days and the journal streak. The shape is decorative, as the handoff allows.
 * "See my reflection" opens the entry; its reflection card needs the journal-reflection backend.
 */
export default function JournalSaved() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { journalEntries } = useJournal();
  const reduceMotion = useReducedMotion();
  const scale = width / 375;

  const dates = useMemo(() => journalEntries.map((e) => e.createdAt), [journalEntries]);
  const month = monthProgress(dates);
  const days = streak(activeDays(dates)).count;
  const monthName = new Intl.DateTimeFormat(i18n.language, { month: 'long' }).format(new Date());

  const draw = useSharedValue(reduceMotion ? 1 : 0);
  const bloom = useSharedValue(reduceMotion ? 1 : 0);
  useEffect(() => {
    if (reduceMotion) return;
    draw.value = withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.cubic) });
    bloom.value = withDelay(
      1000,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.6)) }),
    );
  }, [draw, bloom, reduceMotion]);
  const line = useAnimatedProps(() => ({ strokeDashoffset: LINE_LENGTH * (1 - draw.value) }));
  const star = useAnimatedStyle(() => ({
    opacity: bloom.value,
    transform: [{ scale: 0.4 + 0.6 * bloom.value }],
  }));

  const close = () => router.replace('/(tabs)/journal');
  const at = ([x, y]: number[], size: number) => ({
    position: 'absolute' as const,
    left: x * scale - size / 2,
    top: y * scale - size / 2,
  });

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: palette.bg,
        paddingBottom: Math.max(insets.bottom, 16) + 16,
      }}
    >
      <GlowField
        glows={[{ color: palette.mustard, opacity: 0.45, x: 37.5, y: 150, width: 300, blur: 60 }]}
      />
      <IconButton
        icon="arrow/close"
        size={40}
        variant="glass"
        accessibilityLabel={t('common.close')}
        onPress={close}
        style={{ position: 'absolute', top: insets.top + 10, right: 16, zIndex: 1 }}
      />

      <View
        accessible
        accessibilityLabel={t('journalSaved.constellation')}
        style={{ marginTop: 230 - 54 + insets.top, height: BOX_H * scale }}
      >
        <Svg width={width} height={BOX_H * scale} viewBox={`0 0 375 ${BOX_H}`}>
          <AnimatedPolyline
            points={[...STARS, NEW_STAR].map((p) => p.join(',')).join(' ')}
            fill="none"
            stroke="rgba(226,204,64,0.60)"
            strokeWidth={1.5}
            strokeDasharray={`${LINE_LENGTH} ${LINE_LENGTH}`}
            animatedProps={line}
          />
        </Svg>
        {STARS.map((p) => (
          <View key={p.join()} pointerEvents="none" style={at(p, 22)}>
            <Glow
              color={palette.mustard}
              opacity={0.5}
              width={22}
              blur={6}
              style={{ position: 'absolute' }}
            />
            <View
              style={{
                position: 'absolute',
                left: 6.5,
                top: 6.5,
                width: 9,
                height: 9,
                borderRadius: 4.5,
                backgroundColor: palette.mustard,
              }}
            />
          </View>
        ))}
        <Animated.View pointerEvents="none" style={[at(NEW_STAR, 60), star]}>
          <Glow
            color={palette.mustard}
            opacity={0.7}
            width={60}
            blur={14}
            style={{ position: 'absolute' }}
          />
          <View
            style={{
              position: 'absolute',
              left: 20,
              top: 20,
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: palette.cream,
            }}
          />
        </Animated.View>
      </View>

      <View style={{ alignItems: 'center', paddingHorizontal: 24, marginTop: 40, gap: 12 }}>
        <Text
          accessibilityRole="header"
          style={[
            Type.titleXl,
            {
              fontSize: 28,
              lineHeight: 36,
              letterSpacing: 0,
              color: palette.ink,
              textAlign: 'center',
            },
          ]}
        >
          {t('journalSaved.title')}
        </Text>
        <Text
          style={[Type.bodyS, { lineHeight: 20, color: palette.textMuted, textAlign: 'center' }]}
        >
          {t('journalSaved.body', { logged: month.logged, days: month.days, month: monthName })}
        </Text>
        {days > 1 && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              marginTop: 20,
              paddingVertical: 6,
              paddingLeft: 12,
              paddingRight: 14,
              borderRadius: 999,
              backgroundColor: palette.selected,
            }}
          >
            <Icon name="line/flame" size={14} color={palette.plum} />
            <Text style={[Type.chipSelected, { color: palette.plumDeep }]}>
              {t('journalSaved.streak', { count: days })}
            </Text>
          </View>
        )}
      </View>

      <View style={{ flex: 1 }} />
      <View style={{ paddingHorizontal: 24, gap: 8 }}>
        <AppButton
          title={t('journalSaved.seeReflection')}
          size="lg"
          onPress={() =>
            id ? router.replace({ pathname: '/(tabs)/journal/[id]', params: { id } }) : close()
          }
        />
        <AppButton title={t('journalSaved.backToJournal')} variant="text" onPress={close} />
      </View>
    </View>
  );
}
