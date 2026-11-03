import React, { useEffect, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Glow } from '@/components/glow/Glow';
import { Icon } from '@/components/icons/Icon';
import { MomentShell, closeMoment } from '@/components/moments/MomentShell';
import { toast } from '@/components/Toast';
import { PRACTICES, practiceById } from '@/data/practices';
import { openPractice } from '@/lib/practice-routes';
import { loadReminderSettings, scheduleNotification } from '@/lib/notifications';
import { clockFrom } from '@/lib/sleep-home';

/**
 * Sunset reminder (03 §3.7): the evening grounding prompt over a dusk gradient and sunset, with the
 * practice, Start now, Snooze 30 min and Change reminder time.
 */
export default function SunsetMoment() {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // The reminder's own time, as in Figma ("19:00"), not the moment the screen opened.
  const [time, setTime] = useState<{ hour: number; minute: number } | null>(null);
  useEffect(() => {
    loadReminderSettings()
      .then((r) => setTime({ hour: r.stress_alert.hour, minute: r.stress_alert.minute }))
      .catch(() => {});
  }, []);
  const practice = practiceById('grounding') ?? PRACTICES.find((p) => p.category === 'mindfulness') ?? PRACTICES[0];
  // Figma 6628:2822 offers the 10-minute grounding; other practices fall back to their default length.
  const minutes = practice.durations?.includes(10) ? 10 : (practice.defaultDuration ?? practice.listMinutes);

  const snooze = async () => {
    try {
      await scheduleNotification(t('moments.sunset.title'), t('moments.sunset.snoozeBody'), { route: '/(moments)/sunset' }, {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1800,
      });
      toast.success(t('moments.sunset.snoozed'));
      closeMoment();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('moments.error'));
    }
  };

  // The scene sits on the horizon at 467 in the 375 frame (Figma 6628:2822).
  const horizon = insets.top - 44 + 467;
  const cx = width / 2;
  const sx = width / 375;
  return (
    <MomentShell
      background={
        <View pointerEvents="none" style={{ position: 'absolute', inset: 0 }}>
          <Svg width={width} height={height} style={{ position: 'absolute' }}>
            <Defs>
              <LinearGradient id="dusk" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#D9ECF7" />
                <Stop offset="0.5" stopColor="#F6E7D2" />
                <Stop offset="0.62" stopColor={palette.bg} />
                <Stop offset="1" stopColor={palette.bg} />
              </LinearGradient>
            </Defs>
            <Rect x={0} y={0} width={width} height={height} fill="url(#dusk)" />
          </Svg>
          <Glow color={palette.mustard} opacity={0.55} width={260} blur={60} style={{ position: 'absolute', left: cx - 130, top: horizon - 147 }} />
          <Svg width={width} height={height} style={{ position: 'absolute' }}>
            <Defs>
              <LinearGradient id="sun" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#F3DD6B" />
                <Stop offset="1" stopColor="#E8A65C" />
              </LinearGradient>
            </Defs>
            {[
              [150, 0.25],
              [120, 0.35],
              [90, 0.5],
            ].map(([r, o]) => (
              <Path key={r} d={`M${cx - r},${horizon} A${r},${r} 0 0 1 ${cx + r},${horizon}`} stroke={palette.white} strokeOpacity={o} strokeWidth={1.5} fill="none" />
            ))}
            <Path d={`M${cx - 70},${horizon} A70,70 0 0 1 ${cx + 70},${horizon} Z`} fill="url(#sun)" />
            <Rect x={0} y={horizon - 1} width={width} height={2} fill={palette.plum} />
            {[
              [40, 80],
              [150, 120],
              [290, 60],
            ].map(([x, w]) => (
              <Rect key={x} x={x * sx} y={horizon + 13} width={w * sx} height={2} rx={1} fill={palette.mustard} />
            ))}
          </Svg>
        </View>
      }
      cta={{ label: t('moments.sunset.start'), onPress: () => { closeMoment(); openPractice(practice, minutes); } }}
      link={{ label: t('moments.sunset.snooze'), onPress: () => void snooze() }}
    >
      <View style={{ alignItems: 'center', minHeight: horizon - insets.top - 74 + 59 }}>
        <Text style={[Type.bodyStrong, { color: palette.plumDeep, marginTop: 52 }]}>{time ? clockFrom(time.hour, time.minute) : ' '}</Text>
        <Text accessibilityRole="header" style={[Type.display, { fontSize: 32, lineHeight: 38, color: palette.plumDeep, marginTop: 5, textAlign: 'center' }]}>
          {t('moments.sunset.title')}
        </Text>
        <Text style={[Type.bodyM, { lineHeight: 20, color: palette.textMuted, marginTop: 5, textAlign: 'center', maxWidth: 287 }]}>
          {t('moments.sunset.body', { minutes })}
        </Text>
      </View>
      <View style={{ alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: palette.white, borderRadius: 999, paddingVertical: 8, paddingLeft: 12, paddingRight: 14 }}>
        <Icon name="line/meditate" size={16} color={palette.plum} />
        <Text style={[Type.chipSelected, { color: palette.ink }]}>
          {t('moments.sunset.chip', { practice: t(`practices.items.${practice.id}.title`), minutes })}
        </Text>
      </View>
      <Pressable accessibilityRole="button" onPress={() => router.replace('/(tabs)/profile/notifications')} hitSlop={8} style={{ alignSelf: 'center', marginTop: 16, minHeight: 36, justifyContent: 'center' }}>
        <Text style={[Type.buttonS, { color: palette.lavender }]}>{t('moments.sunset.change')}</Text>
      </Pressable>
    </MomentShell>
  );
}
