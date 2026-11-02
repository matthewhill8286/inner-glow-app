import React, { useMemo } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import Svg, { Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Glow } from '@/components/glow/Glow';
import { Icon } from '@/components/icons/Icon';
import { MomentShell, closeMoment } from '@/components/moments/MomentShell';
import { toast } from '@/components/Toast';
import { PRACTICES, practiceById } from '@/data/practices';
import { openPractice } from '@/lib/practice-routes';
import { scheduleNotification } from '@/lib/notifications';
import { clockFrom } from '@/lib/sleep-home';

/**
 * Sunset reminder (03 §3.7): the evening grounding prompt over a dusk gradient and sunset, with the
 * practice, Start now, Snooze 30 min and Change reminder time.
 */
export default function SunsetMoment() {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const now = useMemo(() => new Date(), []);
  const practice = practiceById('grounding') ?? PRACTICES.find((p) => p.category === 'mindfulness') ?? PRACTICES[0];
  const minutes = practice.defaultDuration ?? practice.listMinutes;
  const voice = practice.options.voice;

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

  // The scene sits on the horizon at 470 in the 375 frame.
  const horizon = insets.top - 44 + 470;
  const cx = width / 2;
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
          <Glow color={palette.mustard} opacity={0.55} width={260} blur={60} style={{ position: 'absolute', left: cx - 130, top: horizon - 130 }} />
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
              <Path key={r} d={`M${cx - r},${horizon} A${r},${r * 0.55} 0 0 1 ${cx + r},${horizon}`} stroke={palette.white} strokeOpacity={o} strokeWidth={1.5} fill="none" />
            ))}
            <Path d={`M${cx - 70},${horizon} A70,70 0 0 1 ${cx + 70},${horizon} Z`} fill="url(#sun)" />
            <Rect x={0} y={horizon} width={width} height={2} fill={palette.plum} fillOpacity={0.35} />
            {[0, 1, 2].map((i) => (
              <Ellipse key={i} cx={cx} cy={horizon + 12 + i * 10} rx={50 - i * 14} ry={1} fill={palette.mustard} fillOpacity={0.5} />
            ))}
          </Svg>
        </View>
      }
      cta={{ label: t('moments.sunset.start'), onPress: () => { closeMoment(); openPractice(practice); } }}
      secondary={{ label: t('moments.sunset.snooze'), onPress: () => void snooze() }}
      link={{ label: t('moments.sunset.change'), onPress: () => router.replace('/(tabs)/profile/notifications') }}
    >
      <View style={{ alignItems: 'center', minHeight: horizon - insets.top - 74 + 70 }}>
        <Text style={[Type.bodyStrong, { letterSpacing: 0.96, color: palette.plumDeep, marginTop: 8 }]}>{clockFrom(now.getHours(), now.getMinutes())}</Text>
        <Text accessibilityRole="header" style={[Type.display, { fontSize: 32, lineHeight: 38, color: palette.plumDeep, marginTop: 4, textAlign: 'center' }]}>
          {t('moments.sunset.title')}
        </Text>
        <Text style={[Type.body, { fontWeight: '400', lineHeight: 22, color: palette.textMuted, marginTop: 10, textAlign: 'center', maxWidth: 287 }]}>
          {t('moments.sunset.body', { minutes })}
        </Text>
      </View>
      <View style={{ alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 999, paddingVertical: 8, paddingLeft: 12, paddingRight: 14, marginTop: 8 }}>
        <Icon name="line/meditate" size={16} color={palette.plum} />
        <Text style={[Type.chipSelected, { color: palette.ink }]}>
          {t(voice ? 'moments.sunset.chipVoice' : 'moments.sunset.chip', { practice: t(`practices.items.${practice.id}.title`), minutes })}
        </Text>
      </View>
    </MomentShell>
  );
}
