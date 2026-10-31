import { backTo, finishTo } from '@/lib/navigation';
import { Typography } from '@/constants/typography';
import { saveWakeAlarm, ringingAlarmsSupported, testWakeAlarm } from '@/lib/alarms';
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import MaterialIcons from '@/components/AppIcon';
import { useSleep } from '@/hooks/useSleep';
import { toast } from '@/components/Toast';
import { scheduleBedtimeReminders, cancelBedtimeReminders } from '@/lib/notifications';

/* ── helpers ──────────────────────────────────────── */
function goBack(from?: string) {
  backTo(from, '/(tabs)/sleep');
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MINUTE_STEP = 5;

function formatHour(h: number, m: number) {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 || 12;
  return `${hh}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatH(h: number) {
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12} ${ampm}`;
}

function formatM(m: number) {
  return m.toString().padStart(2, '0');
}

/* ── Toggle component ────────────────────────────── */
function ToggleSwitch({
  value,
  onToggle,
  activeColor,
  inactiveColor,
}: {
  value: boolean;
  onToggle: () => void;
  activeColor: string;
  inactiveColor: string;
}) {
  return (
    <Pressable
      onPress={onToggle}
      style={[toggleS.track, { backgroundColor: value ? activeColor : inactiveColor }]}
    >
      <View style={[toggleS.thumb, { transform: [{ translateX: value ? 20 : 0 }] }]} />
    </Pressable>
  );
}

const toggleS = StyleSheet.create({
  track: { width: 48, height: 28, borderRadius: 14, padding: 4 },
  thumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF' },
});

/* ── Main Screen ─────────────────────────────────── */
export default function SleepScheduleScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { setSleepMode, saveSchedule, schedule } = useSleep();

  // Sleep time state — initialised from saved schedule
  const [sleepHour, setSleepHour] = useState(schedule.sleepHour);
  const [sleepMin, setSleepMin] = useState(schedule.sleepMin);
  const [wakeHour, setWakeHour] = useState(schedule.wakeHour);
  const [wakeMin, setWakeMin] = useState(schedule.wakeMin);

  // Repeat snooze (1-5)

  // Days of week
  const [selectedDays, setSelectedDays] = useState<string[]>(schedule.selectedDays);

  // Toggles
  const [autoDisplayStats, setAutoDisplayStats] = useState(schedule.autoDisplayStats);
  const [autoSetAlarm, setAutoSetAlarm] = useState(schedule.autoSetAlarm);
  const [bedtimeReminder, setBedtimeReminder] = useState(schedule.bedtimeReminder);

  // Sync local state when the persisted schedule loads from AsyncStorage
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (!hydrated && schedule.savedAt) {
      setSleepHour(schedule.sleepHour);
      setSleepMin(schedule.sleepMin);
      setWakeHour(schedule.wakeHour);
      setWakeMin(schedule.wakeMin);

      setSelectedDays(schedule.selectedDays);
      setAutoDisplayStats(schedule.autoDisplayStats);
      setAutoSetAlarm(schedule.autoSetAlarm);
      setBedtimeReminder(schedule.bedtimeReminder);
      setHydrated(true);
    }
  }, [schedule.savedAt]);

  const [saving, setSaving] = useState(false);
  const supportsAlarm = ringingAlarmsSupported();

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const adjustTime = (type: 'sleep' | 'wake', field: 'hour' | 'min', delta: number) => {
    if (type === 'sleep') {
      if (field === 'hour') setSleepHour((h) => (h + delta + 24) % 24);
      else setSleepMin((m) => (m + delta * MINUTE_STEP + 60) % 60);
    } else {
      if (field === 'hour') setWakeHour((h) => (h + delta + 24) % 24);
      else setWakeMin((m) => (m + delta * MINUTE_STEP + 60) % 60);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Build a suggested wake time
      const now = new Date();
      const sleepDate = new Date(now);
      sleepDate.setHours(sleepHour, sleepMin, 0, 0);
      if (sleepDate < now) sleepDate.setDate(sleepDate.getDate() + 1);

      const wakeDate = new Date(sleepDate);
      wakeDate.setHours(wakeHour, wakeMin, 0, 0);
      if (wakeDate <= sleepDate) wakeDate.setDate(wakeDate.getDate() + 1);

      if (autoSetAlarm && !selectedDays.length) throw new Error('Choose at least one repeat day.');
      // Ask for permissions and schedule before persisting an enabled switch.
      await saveWakeAlarm({ enabled: autoSetAlarm, wakeHour, wakeMin, selectedDays });
      if (bedtimeReminder && selectedDays.length > 0) {
        await scheduleBedtimeReminders({ sleepHour, sleepMin, selectedDays });
      } else {
        await cancelBedtimeReminders();
      }
      await saveSchedule({
        sleepHour,
        sleepMin,
        wakeHour,
        wakeMin,
        snoozeCount: 0,
        selectedDays,
        autoDisplayStats,
        autoSetAlarm,
        bedtimeReminder,
      });
      await setSleepMode({ suggestedWakeISO: wakeDate.toISOString(), autoDetectionEnabled: false });

      toast.success(t('sleepSchedule.scheduleSaved'));
      finishTo('/(tabs)/sleep');
    } catch (err) {
      console.error('Failed to save schedule:', err);
      toast.error(err instanceof Error ? err.message : t('sleepSchedule.scheduleSaveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background, paddingTop: insets.top + 6 }]}>
      {/* ── Header ──────────────────────────────── */}
      <View style={s.header}>
        <Pressable
          onPress={() => goBack(from)}
          style={({ pressed }) => [
            s.backBtn,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <MaterialIcons
            name={Platform.OS === 'ios' ? 'arrow-back-ios-new' : 'arrow-back'}
            size={18}
            color={colors.text}
          />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, { color: colors.text }]}>{t('sleepSchedule.title')}</Text>
          <Text style={[s.headerSub, { color: colors.mutedText }]}>
            {t('sleepSchedule.subtitle')}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Time Pickers ──────────────────────── */}
        <View style={s.timePickersRow}>
          {/* Sleep At */}
          <View
            style={[s.timePicker, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[s.timeLabel, { color: colors.mutedText }]}>
              {t('sleepSchedule.sleepAt')}
            </Text>
            <View style={s.timeColumnsRow}>
              {/* Hour spinner */}
              <View style={s.timeControls}>
                <Pressable onPress={() => adjustTime('sleep', 'hour', -1)} hitSlop={8}>
                  <MaterialIcons name="keyboard-arrow-up" size={22} color={colors.subtleText} />
                </Pressable>
                <Text style={[s.timeValue, { color: colors.text }]}>{formatH(sleepHour)}</Text>
                <Pressable onPress={() => adjustTime('sleep', 'hour', 1)} hitSlop={8}>
                  <MaterialIcons name="keyboard-arrow-down" size={22} color={colors.subtleText} />
                </Pressable>
              </View>
              <Text style={[s.timeSeparator, { color: colors.mutedText }]}>:</Text>
              {/* Minute spinner */}
              <View style={s.timeControls}>
                <Pressable onPress={() => adjustTime('sleep', 'min', -1)} hitSlop={8}>
                  <MaterialIcons name="keyboard-arrow-up" size={22} color={colors.subtleText} />
                </Pressable>
                <Text style={[s.timeValue, { color: colors.text }]}>{formatM(sleepMin)}</Text>
                <Pressable onPress={() => adjustTime('sleep', 'min', 1)} hitSlop={8}>
                  <MaterialIcons name="keyboard-arrow-down" size={22} color={colors.subtleText} />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Wake Up At */}
          <View
            style={[s.timePicker, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[s.timeLabel, { color: colors.mutedText }]}>
              {t('sleepSchedule.wakeUpAt')}
            </Text>
            <View style={s.timeColumnsRow}>
              {/* Hour spinner */}
              <View style={s.timeControls}>
                <Pressable onPress={() => adjustTime('wake', 'hour', -1)} hitSlop={8}>
                  <MaterialIcons name="keyboard-arrow-up" size={22} color={colors.subtleText} />
                </Pressable>
                <Text style={[s.timeValue, { color: colors.text }]}>{formatH(wakeHour)}</Text>
                <Pressable onPress={() => adjustTime('wake', 'hour', 1)} hitSlop={8}>
                  <MaterialIcons name="keyboard-arrow-down" size={22} color={colors.subtleText} />
                </Pressable>
              </View>
              <Text style={[s.timeSeparator, { color: colors.mutedText }]}>:</Text>
              {/* Minute spinner */}
              <View style={s.timeControls}>
                <Pressable onPress={() => adjustTime('wake', 'min', -1)} hitSlop={8}>
                  <MaterialIcons name="keyboard-arrow-up" size={22} color={colors.subtleText} />
                </Pressable>
                <Text style={[s.timeValue, { color: colors.text }]}>{formatM(wakeMin)}</Text>
                <Pressable onPress={() => adjustTime('wake', 'min', 1)} hitSlop={8}>
                  <MaterialIcons name="keyboard-arrow-down" size={22} color={colors.subtleText} />
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.cardTitle, { color: colors.text }]}>Wake-up alarm</Text>
          <Text style={[s.settingSub, { color: colors.mutedText }]}>
            {supportsAlarm
              ? 'Rings even with Silent Mode or Focus on. Stop the alarm from your Lock Screen.'
              : 'Ringing alarms require the updated iPhone app and iOS 26 or later.'}
          </Text>
          {supportsAlarm && (
            <Pressable
              onPress={async () => {
                try {
                  await testWakeAlarm();
                  toast.info('Test alarm set for 15 seconds from now.');
                } catch (error) {
                  toast.error(
                    error instanceof Error ? error.message : 'Unable to set the test alarm.',
                  );
                }
              }}
              style={{ paddingVertical: 16 }}
            >
              <Text
                style={{
                  fontFamily: Typography.family.body,
                  color: colors.primary,
                  fontWeight: Typography.weight.semibold,
                }}
              >
                Test ringing alarm
              </Text>
            </Pressable>
          )}
        </View>

        {/* ── Auto Repeat Days ──────────────────── */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.cardTitle, { color: colors.text }]}>
            {t('sleepSchedule.autoRepeatEvery')}
          </Text>
          <View style={s.daysRow}>
            {DAYS.map((day) => (
              <Pressable
                key={day}
                onPress={() => toggleDay(day)}
                style={[
                  s.dayBtn,
                  {
                    backgroundColor: selectedDays.includes(day) ? '#8B6B47' : colors.inputBg,
                  },
                ]}
              >
                <Text
                  style={[
                    s.dayBtnText,
                    { color: selectedDays.includes(day) ? '#FFF' : colors.text },
                  ]}
                >
                  {day}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── Toggle Settings ───────────────────── */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={[s.settingLabel, { color: colors.text }]}>
                {t('sleepSchedule.autoDisplayStats')}
              </Text>
              <Text style={[s.settingSub, { color: colors.mutedText }]}>
                {t('sleepSchedule.autoDisplayStatsDesc')}
              </Text>
            </View>
            <ToggleSwitch
              value={autoDisplayStats}
              onToggle={() => setAutoDisplayStats(!autoDisplayStats)}
              activeColor="#5B8A5A"
              inactiveColor={colors.divider}
            />
          </View>

          <View style={[s.divider, { backgroundColor: colors.divider }]} />

          <View style={s.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={[s.settingLabel, { color: colors.text }]}>Enable wake-up alarm</Text>
              <Text style={[s.settingSub, { color: colors.mutedText }]}>
                Ring at your wake-up time on the selected days.
              </Text>
            </View>
            <ToggleSwitch
              value={autoSetAlarm}
              onToggle={() => {
                if (supportsAlarm || autoSetAlarm) setAutoSetAlarm(!autoSetAlarm);
                else toast.info('Ringing alarms require iOS 26 or later.');
              }}
              activeColor="#5B8A5A"
              inactiveColor={colors.divider}
            />
          </View>

          <View style={[s.divider, { backgroundColor: colors.divider }]} />

          <View style={s.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={[s.settingLabel, { color: colors.text }]}>
                {t('sleepSchedule.bedtimeReminder')}
              </Text>
              <Text style={[s.settingSub, { color: colors.mutedText }]}>
                {t('sleepSchedule.bedtimeReminderDesc')}
              </Text>
            </View>
            <ToggleSwitch
              value={bedtimeReminder}
              onToggle={() => setBedtimeReminder(!bedtimeReminder)}
              activeColor="#7E57C2"
              inactiveColor={colors.divider}
            />
          </View>
        </View>

        {/* ── Duration Preview ──────────────────── */}
        <View style={[s.previewCard, { backgroundColor: '#5A3E7A' }]}>
          <View style={[s.previewCircle, { backgroundColor: 'rgba(255,255,255,0.06)' }]} />
          <MaterialIcons name="hotel" size={22} color="rgba(255,255,255,0.7)" />
          <Text style={s.previewText}>
            Sleep duration: ~
            {(() => {
              let totalMin = wakeHour * 60 + wakeMin - (sleepHour * 60 + sleepMin);
              if (totalMin <= 0) totalMin += 24 * 60;
              const h = Math.floor(totalMin / 60);
              const m = totalMin % 60;
              return m > 0 ? `${h}h ${m}m` : `${h}h`;
            })()}
          </Text>
        </View>

        {/* ── Save Button ───────────────────────── */}
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={({ pressed }) => [
            s.saveBtn,
            {
              backgroundColor: '#8B6B47',
              transform: [{ scale: pressed ? 0.97 : 1 }],
              opacity: saving ? 0.7 : 1,
            },
          ]}
        >
          <MaterialIcons name="check-circle" size={20} color="#FFF" />
          <Text style={s.saveBtnText}>
            {saving ? t('sleepSchedule.saving') : t('sleepSchedule.setSchedule')}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

/* ── Styles ──────────────────────────────────────── */
const s = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: UI.spacing.xl,
  } as any,

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 6,
    marginBottom: 4,
  } as any,
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: { ...Typography.heading },
  headerSub: { fontFamily: Typography.family.body, fontSize: 14, marginTop: 2 },

  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100,
    gap: 14,
  },

  /* time pickers */
  timePickersRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timePicker: {
    flex: 1,
    borderRadius: UI.radius.xxl,
    padding: 18,
    borderWidth: 1,
    alignItems: 'center',
    ...UI.shadow.sm,
  },
  timeLabel: {
    fontFamily: Typography.family.body,
    fontSize: 12,
    fontWeight: Typography.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  timeColumnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  timeControls: {
    alignItems: 'center',
    gap: 4,
  },
  timeSeparator: {
    fontFamily: Typography.family.body,
    fontSize: 20,
    fontWeight: Typography.weight.bold,
    marginTop: 2,
  },
  timeValue: {
    fontFamily: Typography.family.body,
    fontSize: 18,
    fontWeight: Typography.weight.bold,
  },

  /* cards */
  card: {
    borderRadius: UI.radius.xxl,
    padding: 18,
    borderWidth: 1,
    ...UI.shadow.sm,
  },
  cardTitle: { ...Typography.cardHeading,  marginBottom: 14 },

  /* snooze */
  snoozeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  snoozeBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snoozeBtnText: {
    fontFamily: Typography.family.body,
    fontSize: 16,
    fontWeight: Typography.weight.semibold,
  },

  /* days */
  daysRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  dayBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  dayBtnText: {
    fontFamily: Typography.family.body,
    fontSize: 13,
    fontWeight: Typography.weight.semibold,
  },

  /* settings */
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  settingLabel: {
    fontFamily: Typography.family.body,
    fontSize: 14,
    fontWeight: Typography.weight.medium,
  },
  settingSub: { fontFamily: Typography.family.body, fontSize: 12, marginTop: 2 },
  divider: { height: 1, marginVertical: 14 },

  /* preview */
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: UI.radius.xxl,
    padding: 16,
    overflow: 'hidden',
    ...UI.shadow.sm,
  },
  previewCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    top: -30,
    right: -20,
  },
  previewText: {
    fontFamily: Typography.family.body,
    color: '#FFF',
    fontSize: 15,
    fontWeight: Typography.weight.semibold,
  },

  /* save */
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: UI.radius.lg,
    ...UI.shadow.md,
  },
  saveBtnText: {
    fontFamily: Typography.family.body,
    color: '#FFF',
    fontSize: 16,
    fontWeight: Typography.weight.semibold,
  },
});
