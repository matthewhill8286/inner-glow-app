import React, { useEffect, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenStatusBar } from '@/components/ui/ScreenStatusBar';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { GlowField } from '@/components/glow/Glow';
import { AppButton } from '@/components/ui/AppButton';
import { toast } from '@/components/Toast';
import AuraArt from '@/assets/svg/illustrations/sleep/wake-aura.svg';
import { useSleep } from '@/hooks/useSleep';
import { useProfile } from '@/hooks/useProfile';
import { greetingName } from '@/lib/profile-stats';
import { scheduleNotification } from '@/lib/notifications';
import { stopSoundscape } from '@/lib/soundscape';
import { clockFrom, formatDuration } from '@/lib/sleep-home';
import { SNOOZE_MINUTES } from '@/lib/sleep-flow';

/**
 * Wake up (06 §S5): the aura and inner light, "Good morning", the clock, how long the night was,
 * one slow breath, then I'm up (saves the night and opens the sleep check-in) or Snooze 9 min
 * (a reminder in nine minutes and back to sleep mode). The quality word appears after the check-in.
 */
export default function WakeUpScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { sleepMode, setSleepMode, addSleepEntry } = useSleep();
  const { profile } = useProfile({ lazy: true });
  const [now, setNow] = useState(new Date());
  const [saving, setSaving] = useState(false);
  const name = greetingName(profile);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);

  const startMs = sleepMode.sleepModeStartISO ? Date.parse(sleepMode.sleepModeStartISO) : null;
  const minutes = startMs ? Math.max(0, (now.getTime() - startMs) / 60_000) : null;

  const up = async () => {
    if (!sleepMode.sleepModeStartISO) {
      router.replace('/(tabs)/sleep');
      return;
    }
    setSaving(true);
    try {
      await stopSoundscape();
      const end = new Date();
      const entry = await addSleepEntry({
        startISO: sleepMode.sleepModeStartISO,
        endISO: end.toISOString(),
        duration: (end.getTime() - Date.parse(sleepMode.sleepModeStartISO)) / 3_600_000,
        source: 'sleep_mode',
        factors: sleepMode.windDown ? ['wind_down'] : [],
      });
      await setSleepMode({ sleepModeStartISO: null, soundKey: null, windDown: false });
      router.replace({ pathname: '/(tabs)/sleep/log', params: { id: entry.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('sleepFlow.saveError'));
      setSaving(false);
    }
  };

  const snooze = async () => {
    try {
      await scheduleNotification(t('sleepFlow.wake.snoozeTitle'), t('sleepFlow.wake.snoozeBody'), { route: '/(tabs)/sleep/wake' }, {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: SNOOZE_MINUTES * 60,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('sleepFlow.saveError'));
      return;
    }
    router.replace('/(tabs)/sleep/mode');
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScreenStatusBar style="dark" />
      <GlowField
        glows={[
          { color: palette.lavenderSoft, opacity: 0.22, x: -40, y: -60, width: 260, blur: 90 },
          { color: palette.mustard, opacity: 0.3, x: 57, y: 150, width: 260, blur: 80 },
          { color: palette.rose, opacity: 0.22, x: 117, y: 210, width: 140, blur: 50 },
        ]}
      />
      <View pointerEvents="none" style={{ position: 'absolute', top: insets.top - 44, left: 0, right: 0 }}>
        <AuraArt width={width} height={(560 * width) / 375} />
        <Svg width={72} height={72} style={{ position: 'absolute', left: width / 2 - 36, top: 244 }}>
          <Defs>
            <RadialGradient id="innerLight" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={palette.cream} />
              <Stop offset="0.6" stopColor={palette.gold} stopOpacity={0.9} />
              <Stop offset="1" stopColor={palette.gold} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={36} cy={36} r={36} fill="url(#innerLight)" />
        </Svg>
      </View>

      <View style={{ flex: 1, alignItems: 'center', paddingTop: insets.top + 392 }}>
        <Text style={[Type.bodyLg, { color: palette.lavender }]}>
          {name ? t('sleepFlow.wake.goodMorningName', { name }) : t('sleepFlow.wake.goodMorning')}
        </Text>
        <Text style={[Type.display, { fontSize: 64, lineHeight: 78, fontWeight: '400', color: palette.ink, fontVariant: ['tabular-nums'] }]}>
          {clockFrom(now.getHours(), now.getMinutes())}
        </Text>
        {minutes != null && (
          <View
            style={{
              marginTop: 10,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingVertical: 7,
              paddingHorizontal: 14,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.70)',
              borderWidth: 1,
              borderColor: palette.borderLilac,
            }}
          >
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: palette.mustard }} />
            <Text style={[Type.chip, { color: palette.plum }]}>{formatDuration(minutes)}</Text>
          </View>
        )}
        <Text style={[Type.bodyS, { color: palette.textMuted, marginTop: 18, textAlign: 'center', paddingHorizontal: 24 }]}>
          {t('sleepFlow.wake.breath')}
        </Text>
      </View>

      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 18, gap: 10 }}>
        <AppButton title={t('sleepFlow.wake.up')} busy={saving} onPress={up} />
        <Pressable accessibilityRole="button" onPress={snooze} hitSlop={6} style={{ minHeight: 40, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[Type.bodyMSemi, { color: palette.lavender }]}>{t('sleepFlow.wake.snooze', { minutes: SNOOZE_MINUTES })}</Text>
        </Pressable>
      </View>
    </View>
  );
}
