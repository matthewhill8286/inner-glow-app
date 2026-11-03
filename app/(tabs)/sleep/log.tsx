import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenStatusBar } from '@/components/ui/ScreenStatusBar';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { AppButton } from '@/components/ui/AppButton';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Icon } from '@/components/icons/Icon';
import { SettingsScreen } from '@/components/settings/SettingsParts';
import { MoonScale } from '@/components/sleep/MoonScale';
import { toast } from '@/components/Toast';
import { useSleep } from '@/hooks/useSleep';
import { backTo } from '@/lib/navigation';
import { clockFrom } from '@/lib/sleep-home';
import { hourMinute, minuteOfDay, windowMinutes } from '@/lib/sleep-flow';

/** Keys allowed by the `sleep.factors` check constraint (06 §6 item 5), in the design's order. */
const FACTORS = ['caffeine', 'screen_time', 'stress', 'exercise', 'late_meal', 'noise', 'wind_down', 'nap'];

/**
 * Sleep check-in (06 §S6): the moon scale, the quality word with a short line, what played a part,
 * an optional note, and Save, which opens Last night. With a night id (from Wake up or Last night)
 * it fills in that night; without one it logs a manual night with Bedtime and Wake up tiles.
 */
export default function SleepCheckInScreen() {
  const { t } = useTranslation();
  const { id, from } = useLocalSearchParams<{ id?: string; from?: string }>();
  const { sleepEntries, schedule, addSleepEntry, updateSleepEntry } = useSleep();
  const entry = useMemo(() => (id ? sleepEntries.find((e) => e.id === id) : undefined), [id, sleepEntries]);
  const [quality, setQuality] = useState<number | null>(entry?.quality ?? null);
  const [factors, setFactors] = useState<string[]>(entry?.factors ?? []);
  const [note, setNote] = useState(entry?.notes ?? '');
  const [bed, setBed] = useState(minuteOfDay(schedule.sleepHour, schedule.sleepMin));
  const [wake, setWake] = useState(minuteOfDay(schedule.wakeHour, schedule.wakeMin));
  const [picking, setPicking] = useState<null | 'bed' | 'wake'>(null);
  const [saving, setSaving] = useState(false);

  // The night loads after the first render when the list is not cached yet.
  useEffect(() => {
    if (!entry) return;
    setQuality(entry.quality ?? null);
    setFactors(entry.factors ?? []);
    setNote(entry.notes ?? '');
  }, [entry]);

  const qualityWords = [1, 2, 3, 4, 5].map((q) => t(`sleepNight.quality.${q}`));
  const clock = (m: number) => clockFrom(hourMinute(m).hour, hourMinute(m).minute);

  const openPicker = (which: 'bed' | 'wake') => {
    const m = which === 'bed' ? bed : wake;
    const value = new Date(2000, 0, 1, hourMinute(m).hour, hourMinute(m).minute);
    const set = (d: Date) => (which === 'bed' ? setBed : setWake)(minuteOfDay(d.getHours(), d.getMinutes()));
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({ value, mode: 'time', is24Hour: true, onChange: (e, d) => e.type === 'set' && d && set(d) });
    } else setPicking(which);
  };

  const save = async () => {
    if (!quality) {
      toast.info(t('sleepFlow.checkIn.pickQuality'));
      return;
    }
    setSaving(true);
    try {
      if (id) {
        await updateSleepEntry({ id, quality: quality as 1 | 2 | 3 | 4 | 5, factors, notes: note.trim() || undefined });
        router.replace({ pathname: '/(tabs)/sleep/[id]', params: { id } });
        return;
      }
      // A manual night ends at the wake time this morning (or yesterday if that is still to come).
      const end = new Date();
      end.setHours(hourMinute(wake).hour, hourMinute(wake).minute, 0, 0);
      if (end.getTime() > Date.now()) end.setDate(end.getDate() - 1);
      const start = new Date(end.getTime() - windowMinutes(bed, wake) * 60_000);
      const saved = await addSleepEntry({
        startISO: start.toISOString(),
        endISO: end.toISOString(),
        duration: windowMinutes(bed, wake) / 60,
        quality: quality as 1 | 2 | 3 | 4 | 5,
        factors,
        notes: note.trim() || undefined,
        source: 'manual',
      });
      router.replace({ pathname: '/(tabs)/sleep/[id]', params: { id: saved.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('sleepFlow.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const tile = (which: 'bed' | 'wake') => (
    <Pressable
      accessibilityRole="button"
      onPress={() => openPicker(which)}
      style={({ pressed }) => ({ flex: 1, minHeight: 76, borderRadius: 24, backgroundColor: palette.white, padding: 16, gap: 4, opacity: pressed ? 0.85 : 1 })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon name={which === 'bed' ? 'line/moon' : 'line/star'} size={16} />
        <Text style={[Type.caption, { fontWeight: '500', color: palette.textSubtle }]}>
          {t(which === 'bed' ? 'sleepFlow.schedule.bedtime' : 'sleepFlow.schedule.wakeUp')}
        </Text>
      </View>
      <Text style={[Type.titleMd, { lineHeight: 30, color: palette.ink }]}>{clock(which === 'bed' ? bed : wake)}</Text>
    </Pressable>
  );

  return (
    <SettingsScreen
      title={t('sleepFlow.checkIn.header')}
      backLabel={t('common.back')}
      onBack={() => backTo(from, '/(tabs)/sleep')}
      glows={[
        { color: palette.lavenderSoft, opacity: 0.25, x: -60, y: -40, width: 280, blur: 90 },
        { color: palette.sky, opacity: 0.18, x: 200, y: 40, width: 220, blur: 90 },
        { color: palette.mustard, opacity: 0.22, x: 97.5, y: 180, width: 180, blur: 60 },
      ]}
      contentStyle={{ gap: 12 }}
      cta={<AppButton title={t('sleepFlow.checkIn.save')} icon="line/check" iconPosition="left" busy={saving} onPress={save} />}
    >
      <ScreenStatusBar style="dark" />
      <Text accessibilityRole="header" style={[Type.titleLg, { fontSize: 28, lineHeight: 34, color: palette.ink }]}>
        {t('sleepFlow.checkIn.title')}
      </Text>
      <Text style={[Type.bodyS, { color: palette.textMuted, marginTop: -6 }]}>{t('sleepFlow.checkIn.subtitle')}</Text>

      {!id && (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          {tile('bed')}
          {tile('wake')}
        </View>
      )}

      <MoonScale value={quality} onChange={setQuality} labels={qualityWords} />
      <View style={{ alignItems: 'center', gap: 6, minHeight: 56 }}>
        {quality ? (
          <>
            <Text style={[Type.titleLg, { fontSize: 24, lineHeight: 29, color: palette.plum }]}>{qualityWords[quality - 1]}</Text>
            <Text style={[Type.captionM, { color: palette.textMuted, textAlign: 'center' }]}>{t(`sleepFlow.checkIn.lines.${quality}`)}</Text>
          </>
        ) : (
          <Text style={[Type.captionM, { color: palette.textMuted }]}>{t('sleepFlow.checkIn.tapMoon')}</Text>
        )}
      </View>

      <Text style={[Type.labelM, { color: palette.lavender, marginTop: 8 }]}>{t('sleepFlow.checkIn.factors')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {FACTORS.map((f) => {
          const on = factors.includes(f);
          return (
            <Pressable
              key={f}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              onPress={() => setFactors((x) => (on ? x.filter((k) => k !== f) : [...x, f]))}
              style={{
                height: 34,
                paddingHorizontal: 14,
                borderRadius: 999,
                justifyContent: 'center',
                backgroundColor: on ? palette.selected : palette.white,
                borderWidth: on ? 1.5 : 1,
                borderColor: on ? palette.plum : palette.borderLilac,
              }}
            >
              <Text style={[Type.chip, { fontWeight: on ? '600' : '500', color: on ? palette.plum : palette.plumDeep }]}>
                {t(`sleepPeriods.factors.${f}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder={t('sleepFlow.checkIn.note')}
        placeholderTextColor={palette.textSubtle}
        multiline
        maxLength={500}
        accessibilityLabel={t('sleepFlow.checkIn.note')}
        style={[
          Type.bodyS,
          {
            minHeight: 56,
            marginTop: 8,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: palette.borderLilac,
            backgroundColor: palette.white,
            paddingHorizontal: 16,
            paddingTop: 18,
            paddingBottom: 14,
            color: palette.ink,
          },
        ]}
      />

      {Platform.OS === 'ios' && (
        <BottomSheet visible={picking !== null} onClose={() => setPicking(null)}>
          {picking && (
            <DateTimePicker
              value={new Date(2000, 0, 1, hourMinute(picking === 'bed' ? bed : wake).hour, hourMinute(picking === 'bed' ? bed : wake).minute)}
              mode="time"
              display="spinner"
              minuteInterval={5}
              onChange={(_, d) => d && (picking === 'bed' ? setBed : setWake)(minuteOfDay(d.getHours(), d.getMinutes()))}
            />
          )}
          <AppButton title={t('sleepFlow.done')} onPress={() => setPicking(null)} style={{ alignSelf: 'stretch' }} />
        </BottomSheet>
      )}
    </SettingsScreen>
  );
}
