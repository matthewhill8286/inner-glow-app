import React, { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ScreenStatusBar } from '@/components/ui/ScreenStatusBar';
import { useTranslation } from 'react-i18next';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { AppButton } from '@/components/ui/AppButton';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Toggle } from '@/components/ui/controls';
import { Icon, type IconName } from '@/components/icons/Icon';
import { SettingsScreen } from '@/components/settings/SettingsParts';
import { SleepDial } from '@/components/sleep/SleepDial';
import { toast } from '@/components/Toast';
import { useSleep } from '@/hooks/useSleep';
import { saveWakeAlarm, ringingAlarmsSupported } from '@/lib/alarms';
import { BEDTIME_REMINDER_MINUTES, cancelBedtimeReminders, scheduleBedtimeReminders } from '@/lib/notifications';
import { backTo, finishTo } from '@/lib/navigation';
import { clockFrom } from '@/lib/sleep-home';
import { formatWindow, hourMinute, minuteOfDay, windowAllowed, windowMinutes } from '@/lib/sleep-flow';

/** Day keys used by the reminders and the alarm, shown Monday first. */
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Bedtime schedule (06 §S2): the 24-hour dial, Bedtime and Wake up tiles that open a time picker,
 * repeat days, the wind-down reminder and, on iPhones that support it, the wake-up alarm, then
 * Save schedule. The old stepper buttons and "auto display stats" are gone.
 */
export default function SleepScheduleScreen() {
  const { t } = useTranslation();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { schedule, saveSchedule, setSleepMode } = useSleep();
  const [bed, setBed] = useState(minuteOfDay(schedule.sleepHour, schedule.sleepMin));
  const [wake, setWake] = useState(minuteOfDay(schedule.wakeHour, schedule.wakeMin));
  const [days, setDays] = useState<string[]>(schedule.selectedDays);
  const [reminder, setReminder] = useState(schedule.bedtimeReminder);
  const [alarm, setAlarm] = useState(schedule.autoSetAlarm);
  const [picking, setPicking] = useState<null | 'bed' | 'wake'>(null);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const supportsAlarm = ringingAlarmsSupported();

  // The stored schedule loads after the first render.
  useEffect(() => {
    setBed(minuteOfDay(schedule.sleepHour, schedule.sleepMin));
    setWake(minuteOfDay(schedule.wakeHour, schedule.wakeMin));
    setDays(schedule.selectedDays);
    setReminder(schedule.bedtimeReminder);
    setAlarm(schedule.autoSetAlarm);
  }, [schedule]);

  const letters = t('me.reminderSheet.dayLetters').split(',');
  const names = t('me.reminderSheet.dayLabels').split(',');
  // The reminder labels start on Sunday.
  const sundayIndex = (key: string) => (DAYS.indexOf(key) + 1) % 7;
  const clock = (m: number) => clockFrom(hourMinute(m).hour, hourMinute(m).minute);

  const setTime = (which: 'bed' | 'wake', m: number) => {
    const nextBed = which === 'bed' ? m : bed;
    const nextWake = which === 'wake' ? m : wake;
    if (!windowAllowed(nextBed, nextWake)) {
      toast.info(t('sleepFlow.schedule.windowLimit'));
      return;
    }
    setBed(nextBed);
    setWake(nextWake);
  };

  const openPicker = (which: 'bed' | 'wake') => {
    const m = which === 'bed' ? bed : wake;
    const value = new Date(2000, 0, 1, hourMinute(m).hour, hourMinute(m).minute);
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode: 'time',
        is24Hour: true,
        onChange: (event, date) => event.type === 'set' && date && setTime(which, minuteOfDay(date.getHours(), date.getMinutes())),
      });
    } else setPicking(which);
  };

  const save = async () => {
    setSaving(true);
    try {
      const b = hourMinute(bed);
      const w = hourMinute(wake);
      if (alarm && !days.length) throw new Error(t('sleepFlow.schedule.chooseDay'));
      // Always called: turning the alarm off also retires the old notification alarms.
      await saveWakeAlarm({ enabled: alarm, wakeHour: w.hour, wakeMin: w.minute, selectedDays: days });
      if (reminder && days.length) await scheduleBedtimeReminders({ sleepHour: b.hour, sleepMin: b.minute, selectedDays: days });
      else await cancelBedtimeReminders();
      await saveSchedule({
        sleepHour: b.hour,
        sleepMin: b.minute,
        wakeHour: w.hour,
        wakeMin: w.minute,
        selectedDays: days,
        bedtimeReminder: reminder,
        autoSetAlarm: alarm,
      });
      // Tonight's suggested wake time, for sleep mode and wake detection.
      const next = new Date();
      next.setHours(b.hour, b.minute, 0, 0);
      if (next.getTime() < Date.now()) next.setDate(next.getDate() + 1);
      await setSleepMode({ suggestedWakeISO: new Date(next.getTime() + windowMinutes(bed, wake) * 60_000).toISOString() });
      toast.success(t('sleepSchedule.scheduleSaved'));
      finishTo('/(tabs)/sleep');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('sleepSchedule.scheduleSaveError'));
    } finally {
      setSaving(false);
    }
  };

  const tile = (which: 'bed' | 'wake', icon: IconName, label: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${clock(which === 'bed' ? bed : wake)}`}
      onPress={() => openPicker(which)}
      style={({ pressed }) => ({ flex: 1, minHeight: 76, borderRadius: 24, backgroundColor: palette.white, padding: 16, gap: 4, opacity: pressed ? 0.85 : 1 })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon name={icon} size={16} />
        <Text style={[Type.caption, { fontWeight: '500', color: palette.textSubtle }]}>{label}</Text>
      </View>
      <Text style={[Type.titleMd, { lineHeight: 30, color: palette.ink }]}>{clock(which === 'bed' ? bed : wake)}</Text>
    </Pressable>
  );

  const row = (label: string, value: boolean, onChange: (v: boolean) => void) => (
    <View style={{ minHeight: 56, borderRadius: 24, backgroundColor: palette.white, flexDirection: 'row', alignItems: 'center', paddingLeft: 20, paddingRight: 16, gap: 12 }}>
      <Text style={[Type.bodySMedium, { flex: 1, color: palette.ink }]}>{label}</Text>
      <Toggle value={value} onValueChange={onChange} accessibilityLabel={label} />
    </View>
  );

  const window = windowMinutes(bed, wake);
  return (
    <SettingsScreen
      title={t('sleepFlow.schedule.title')}
      backLabel={t('common.back')}
      onBack={() => backTo(from, '/(tabs)/sleep')}
      glows={[
        { color: palette.lavenderSoft, opacity: 0.3, x: -50, y: -20, width: 280, blur: 80 },
        { color: palette.sky, opacity: 0.22, x: 180, y: 60, width: 220, blur: 80 },
      ]}
      contentStyle={{ gap: 16 }}
      scrollEnabled={!dragging}
      cta={<AppButton title={t('sleepFlow.schedule.save')} icon="line/check" iconPosition="left" busy={saving} onPress={save} />}
    >
      <ScreenStatusBar style="dark" />
      <Text accessibilityRole="header" style={[Type.titleLg, { lineHeight: 36, color: palette.ink }]}>
        {t('sleepFlow.schedule.question')}
      </Text>
      <SleepDial
        bed={bed}
        wake={wake}
        onChange={(b, w) => {
          setBed(b);
          setWake(w);
        }}
        centreLabel={formatWindow(window)}
        centreSub={t('sleepFlow.schedule.inBed')}
        onDragging={setDragging}
        accessibilityLabel={t('sleepFlow.schedule.dialLabel', { bed: clock(bed), wake: clock(wake), length: formatWindow(window) })}
      />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {tile('bed', 'line/moon', t('sleepFlow.schedule.bedtime'))}
        {tile('wake', 'line/star', t('sleepFlow.schedule.wakeUp'))}
      </View>

      <Text style={[Type.chipSelected, { color: palette.ink, marginTop: 4 }]}>{t('sleepFlow.schedule.repeat')}</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: -8 }}>
        {DAYS.map((key) => {
          const on = days.includes(key);
          return (
            <Pressable
              key={key}
              accessibilityRole="checkbox"
              accessibilityLabel={names[sundayIndex(key)]}
              accessibilityState={{ checked: on }}
              onPress={() => setDays((d) => (on ? d.filter((x) => x !== key) : [...d, key]))}
              style={{
                width: 41,
                height: 41,
                borderRadius: 21,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: on ? palette.selected : palette.white,
                borderWidth: on ? 1.5 : 1,
                borderColor: on ? palette.plum : palette.border,
              }}
            >
              <Text style={[Type.chip, { fontWeight: on ? '600' : '500', color: on ? palette.plum : palette.textMuted }]}>
                {letters[sundayIndex(key)]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {row(t('sleepFlow.schedule.windDown', { minutes: BEDTIME_REMINDER_MINUTES }), reminder, setReminder)}
      {/* Figma has no alarm row; the ringing alarm (iOS 26+) keeps a home here (06 §S2 gaps). */}
      {supportsAlarm && row(t('sleepFlow.schedule.alarm'), alarm, setAlarm)}

      {Platform.OS === 'ios' && (
        <BottomSheet visible={picking !== null} onClose={() => setPicking(null)}>
          {picking && (
            <DateTimePicker
              value={new Date(2000, 0, 1, hourMinute(picking === 'bed' ? bed : wake).hour, hourMinute(picking === 'bed' ? bed : wake).minute)}
              mode="time"
              display="spinner"
              minuteInterval={5}
              onChange={(_, date) => date && setTime(picking, minuteOfDay(date.getHours(), date.getMinutes()))}
            />
          )}
          <AppButton title={t('sleepFlow.done')} onPress={() => setPicking(null)} style={{ alignSelf: 'stretch' }} />
        </BottomSheet>
      )}
    </SettingsScreen>
  );
}
