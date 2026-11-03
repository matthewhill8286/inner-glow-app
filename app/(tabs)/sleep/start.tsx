import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenStatusBar } from '@/components/ui/ScreenStatusBar';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { GlowField } from '@/components/glow/Glow';
import { Icon, type IconName } from '@/components/icons/Icon';
import { NavBar } from '@/components/ui/IconButton';
import { AppButton } from '@/components/ui/AppButton';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Radio } from '@/components/ui/controls';
import { StarField } from '@/components/sleep/NightSky';
import { useSleep } from '@/hooks/useSleep';
import { practiceById } from '@/data/practices';
import { openPractice } from '@/lib/practice-routes';
import { backTo } from '@/lib/navigation';
import { playSoundscape, stopSoundscapeAfter } from '@/lib/soundscape';
import { STOP_AFTER_CHOICES } from '@/lib/sleep-flow';
import { KEYBOARD_DISMISS_MODE } from '@/lib/keyboard';

type Choice = { key: 'rain' | 'breathing' | 'quietMind' | 'write'; icon: IconName; minutes: number; practice?: string };

/** The four wind-down options (06 §S3). Rain plays here; the others open a practice or the journal. */
const CHOICES: Choice[] = [
  { key: 'rain', icon: 'line/music', minutes: 20 },
  { key: 'breathing', icon: 'line/leaf', minutes: 6, practice: 'bedtime-breathing' },
  { key: 'quietMind', icon: 'line/moon', minutes: 10, practice: 'quiet-mind' },
  { key: 'write', icon: 'line/note', minutes: 3 },
];

/**
 * Wind down (06 §S3): pick something to fall asleep to, choose when the sound stops, then Start
 * sleep mode. Sleep mode starts straight away and the chosen practice or journal opens on top, so
 * finishing it lands back in sleep mode. Opening this while sleep mode is running goes to it.
 */
export default function WindDownScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { sleepMode, setSleepMode, schedule, saveSchedule } = useSleep();
  const [choice, setChoice] = useState<Choice['key']>((schedule.windDownChoice as Choice['key']) ?? 'rain');
  const [stopAfter, setStopAfter] = useState<number | null>(schedule.stopAfterMin === undefined ? 30 : schedule.stopAfterMin);
  const [picking, setPicking] = useState(false);
  const [starting, setStarting] = useState(false);

  // Already in sleep mode: show it. Skipped while this screen is the one starting it.
  useEffect(() => {
    if (sleepMode.sleepModeStartISO && !starting) router.replace('/(tabs)/sleep/mode');
  }, [sleepMode.sleepModeStartISO, starting]);
  useEffect(() => {
    if (schedule.windDownChoice) setChoice(schedule.windDownChoice as Choice['key']);
    if (schedule.stopAfterMin !== undefined) setStopAfter(schedule.stopAfterMin);
  }, [schedule.windDownChoice, schedule.stopAfterMin]);

  const stopLabel = (m: number | null) => (m == null ? t('sleepFlow.windDown.never') : t('sleepFlow.minutes', { count: m }));

  const start = async () => {
    setStarting(true);
    const picked = CHOICES.find((c) => c.key === choice)!;
    const sound = picked.key === 'rain' ? 'rain' : null;
    await saveSchedule({ windDownChoice: choice, stopAfterMin: stopAfter });
    await setSleepMode({
      sleepModeStartISO: new Date().toISOString(),
      soundKey: sound,
      windDown: true,
      autoDetectionEnabled: true,
    });
    if (sound) {
      await playSoundscape(sound);
      stopSoundscapeAfter(stopAfter);
    }
    router.replace('/(tabs)/sleep/mode');
    const practice = picked.practice ? practiceById(picked.practice) : undefined;
    if (practice) openPractice(practice);
    else if (picked.key === 'write') router.push({ pathname: '/(tabs)/journal/new', params: { from: '/(tabs)/sleep/mode' } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.ink }}>
      <ScreenStatusBar style="light" />
      <GlowField glows={[{ color: palette.lavender, opacity: 0.35, x: 37.5, y: 100, width: 300, blur: 80 }]} />
      <StarField width={width} height={540} style={{ position: 'absolute', top: 0 }} />
      <NavBar
        title={t('sleepFlow.windDown.header')}
        backLabel={t('common.back')}
        onBack={() => backTo(from, '/(tabs)/sleep')}
        tone="dark"
        style={{ marginTop: insets.top + 10, marginHorizontal: 24 }}
      />
      <ScrollView keyboardDismissMode={KEYBOARD_DISMISS_MODE} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 22, paddingBottom: 24, gap: 10 }}>
        <Text accessibilityRole="header" style={[Type.titleLg, { fontSize: 28, lineHeight: 39, color: palette.white }]}>
          {t('sleepFlow.windDown.title')}
        </Text>
        <Text style={[Type.bodyS, { color: 'rgba(255,255,255,0.65)', marginTop: -6, marginBottom: 14 }]}>
          {t('sleepFlow.windDown.subtitle')}
        </Text>
        {CHOICES.map((c) => {
          const on = c.key === choice;
          return (
            <Pressable
              key={c.key}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => setChoice(c.key)}
              style={({ pressed }) => ({
                minHeight: 72,
                borderRadius: 24,
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderWidth: 1.5,
                borderColor: on ? 'rgba(226,204,64,0.80)' : 'transparent',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: 14,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={c.icon} size={20} color={palette.white} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[Type.bodyMSemi, { color: palette.white }]}>{t(`sleepFlow.windDown.choices.${c.key}.title`)}</Text>
                <Text style={[Type.captionS, { color: 'rgba(255,255,255,0.60)' }]}>
                  {t(`sleepFlow.windDown.choices.${c.key}.meta`, { minutes: c.minutes })}
                </Text>
              </View>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: on ? palette.mustard : 'transparent',
                  borderWidth: on ? 0 : 1.5,
                  borderColor: 'rgba(255,255,255,0.40)',
                }}
              />
            </Pressable>
          );
        })}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t('sleepFlow.windDown.stopAfter')}, ${stopLabel(stopAfter)}`}
          onPress={() => setPicking(true)}
          style={({ pressed }) => ({
            minHeight: 56,
            marginTop: 8,
            borderRadius: 24,
            backgroundColor: 'rgba(255,255,255,0.08)',
            flexDirection: 'row',
            alignItems: 'center',
            paddingLeft: 20,
            paddingRight: 16,
            gap: 8,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={[Type.bodySMedium, { flex: 1, color: palette.white }]}>{t('sleepFlow.windDown.stopAfter')}</Text>
          <Text style={[Type.buttonS, { color: palette.mustard }]}>{stopLabel(stopAfter)}</Text>
          <Icon name="arrow/chevron-right" size={16} color={palette.white} />
        </Pressable>
      </ScrollView>
      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 14, paddingTop: 8 }}>
        <AppButton
          variant="onDark"
          title={t('sleepFlow.windDown.start')}
          icon="line/moon"
          iconPosition="left"
          busy={starting}
          onPress={start}
          style={{ backgroundColor: palette.softButton }}
        />
      </View>

      <BottomSheet visible={picking} onClose={() => setPicking(false)} closeLabel={t('common.close')}>
        <Text style={[Type.titleSm, { color: palette.plumDeep, alignSelf: 'flex-start' }]}>{t('sleepFlow.windDown.stopAfter')}</Text>
        <View style={{ alignSelf: 'stretch' }}>
          {STOP_AFTER_CHOICES.map((m) => (
            <Pressable
              key={String(m)}
              accessibilityRole="radio"
              accessibilityState={{ selected: m === stopAfter }}
              onPress={() => {
                setStopAfter(m);
                setPicking(false);
              }}
              style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Text style={[Type.bodyMMedium, { color: palette.ink }]}>{stopLabel(m)}</Text>
              <Radio selected={m === stopAfter} />
            </Pressable>
          ))}
        </View>
      </BottomSheet>
    </View>
  );
}
