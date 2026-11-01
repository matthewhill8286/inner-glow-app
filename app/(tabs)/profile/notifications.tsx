import React, { useCallback, useState } from 'react';
import { Linking, Platform, Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon, type IconName } from '@/components/icons/Icon';
import { Toggle } from '@/components/ui/controls';
import { ListGroup, ListRow } from '@/components/ui/ListRow';
import { toast } from '@/components/Toast';
import { ReminderSheet } from '@/components/settings/ReminderSheet';
import { SettingsScreen, SettingsSection } from '@/components/settings/SettingsParts';
import { backTo } from '@/lib/navigation';
import {
  DEFAULT_DELIVERY,
  loadDeliveryPrefs,
  loadReminderSettings,
  notificationPermission,
  setDeliveryPrefs,
  setReminder,
  type DeliveryPrefs,
  type ReminderKey,
  type ReminderSetting,
} from '@/lib/notifications';
import { clock, minutesOf, scheduleSummary, type ReminderSchedule } from '@/lib/reminder-schedule';

const KNOB = '#FFF6D6';
const REMINDER_ROWS: { key: ReminderKey; icon: IconName }[] = [
  { key: 'daily_checkin', icon: 'line/heart' },
  { key: 'mindful_breaks', icon: 'line/meditate' },
  { key: 'sleep_winddown', icon: 'line/moon' },
  { key: 'journal_reminder', icon: 'line/journal' },
];

type Sheet = { kind: 'reminder'; key: ReminderKey } | { kind: 'quiet'; end: 'from' | 'to' } | null;

/**
 * Notifications (06 P4, redrawn in 08 §2.9 `6787:7572`; off state `6817:7621`). Reminders open the
 * Edit reminder time sheet; their switches turn them on and off. Quiet hours hold reminders and
 * banners in that window, and Sound and Vibration apply to every reminder. The design's "Pattern
 * alerts" has nothing behind it yet, so it is not shown.
 */
export default function NotificationSettings() {
  const { t } = useTranslation();
  const [permission, setPermission] = useState<boolean | null>(null);
  const [reminders, setReminders] = useState<Record<ReminderKey, ReminderSetting> | null>(null);
  const [delivery, setDelivery] = useState<DeliveryPrefs>(DEFAULT_DELIVERY);
  const [sheet, setSheet] = useState<Sheet>(null);

  useFocusEffect(
    useCallback(() => {
      let live = true;
      void Promise.all([
        notificationPermission(),
        loadReminderSettings(),
        loadDeliveryPrefs(),
      ]).then(([p, r, d]) => {
        if (!live) return;
        setPermission(p);
        setReminders(r);
        setDelivery(d);
      });
      return () => {
        live = false;
      };
    }, []),
  );

  const summary = (s: ReminderSchedule) => {
    const time = clock(s.hour, s.minute);
    const { kind, days } = scheduleSummary(s.weekdays);
    if (kind !== 'days') return t(`me.notifications.${kind}`, { time });
    const names = t('me.notifications.dayNames').split(',');
    return t('me.notifications.days', { days: days.map((d) => names[d - 1]).join(', '), time });
  };

  async function updateReminder(key: ReminderKey, enabled: boolean, schedule?: ReminderSchedule) {
    try {
      const next = await setReminder(key, enabled, schedule);
      setReminders((prev) => (prev ? { ...prev, [key]: next } : prev));
      setPermission(await notificationPermission());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('me.notifications.error'));
    }
  }
  async function updateDelivery(patch: Partial<DeliveryPrefs>) {
    setDelivery((prev) => ({ ...prev, ...patch }));
    try {
      setDelivery(await setDeliveryPrefs(patch));
    } catch {
      toast.error(t('me.notifications.error'));
    }
  }

  const row = (key: ReminderKey, icon: IconName) => {
    const s = reminders?.[key];
    return (
      <ListRow
        key={key}
        icon={icon}
        label={t(`me.notifications.${key}`)}
        supportingText={s ? summary(s) : undefined}
        trailing="toggle"
        toggled={!!s?.enabled}
        onToggle={(v) => void updateReminder(key, v)}
        onPress={() => setSheet({ kind: 'reminder', key })}
        accessibilityHint={t('me.notifications.editHint')}
        knobColor={KNOB}
      />
    );
  };

  const quietTile = (end: 'from' | 'to') => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t(`me.notifications.${end}`)} ${delivery.quietHours[end]}`}
      onPress={() => setSheet({ kind: 'quiet', end })}
      style={{
        flex: 1,
        height: 52,
        borderRadius: 16,
        backgroundColor: palette.selected,
        paddingHorizontal: 14,
        justifyContent: 'center',
      }}
    >
      <Text style={[Type.microBold, { fontSize: 11, lineHeight: 14, color: palette.lavender }]}>
        {t(`me.notifications.${end}`)}
      </Text>
      <Text style={[Type.body, { fontSize: 18, lineHeight: 22, color: palette.plum }]}>
        {delivery.quietHours[end]}
      </Text>
    </Pressable>
  );

  const open = sheet?.kind === 'reminder' ? reminders?.[sheet.key] : null;
  const quietTime = sheet?.kind === 'quiet' ? minutesOf(delivery.quietHours[sheet.end]) : 0;

  return (
    <SettingsScreen
      title={t('me.notifications.title')}
      backLabel={t('common.back')}
      onBack={() => backTo(undefined, '/(tabs)/profile/settings')}
      glows={[
        { color: palette.lavenderSoft, opacity: 0.25, x: -70, y: -50, width: 280, blur: 90 },
        { color: palette.mustard, opacity: 0.15, x: 220, y: 40, width: 200, blur: 90 },
      ]}
    >
      <Text
        accessibilityRole="header"
        style={[Type.titleMd, { fontSize: 22, lineHeight: 30, color: palette.ink, maxWidth: 300 }]}
      >
        {t('me.notifications.heading')}
      </Text>

      {permission === false && Platform.OS !== 'web' && (
        <View
          style={{
            backgroundColor: palette.white,
            borderRadius: 24,
            borderWidth: 1.5,
            borderColor: palette.mustard,
            padding: 16,
            flexDirection: 'row',
            gap: 12,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: `${palette.mustard}40`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="line/bell" size={20} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[Type.bodyMSemi, { lineHeight: 21, color: palette.ink }]}>
              {t('me.notifications.offTitle')}
            </Text>
            <Text style={[Type.captionS, { color: palette.textMuted }]}>
              {t(
                Platform.OS === 'ios'
                  ? 'me.notifications.offBodyIos'
                  : 'me.notifications.offBodyAndroid',
              )}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void Linking.openSettings()}
              style={{
                alignSelf: 'flex-start',
                marginTop: 8,
                height: 36,
                borderRadius: 18,
                paddingHorizontal: 16,
                borderWidth: 1.5,
                borderColor: palette.plum,
                backgroundColor: palette.selected,
                justifyContent: 'center',
              }}
            >
              <Text style={[Type.buttonS, { fontSize: 13, color: palette.plum }]}>
                {t('me.notifications.openSettings')}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      <SettingsSection label={t('me.notifications.reminders')}>
        <ListGroup>{REMINDER_ROWS.map((r) => row(r.key, r.icon))}</ListGroup>
      </SettingsSection>

      <SettingsSection label={t('me.notifications.fromGlow')}>
        <ListGroup>{row('weekly_summary', 'line/sparkle')}</ListGroup>
      </SettingsSection>

      <SettingsSection label={t('me.notifications.quiet')}>
        <View
          style={{
            backgroundColor: palette.white,
            borderRadius: 24,
            padding: 20,
            paddingTop: 16,
            gap: 14,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[Type.bodyMMedium, { flex: 1, color: palette.ink }]}>
              {t('me.notifications.pause')}
            </Text>
            <Toggle
              value={delivery.quietHours.enabled}
              onValueChange={(v) =>
                void updateDelivery({ quietHours: { ...delivery.quietHours, enabled: v } })
              }
              knobColor={KNOB}
              accessibilityLabel={t('me.notifications.pause')}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 7 }}>
            {quietTile('from')}
            {quietTile('to')}
          </View>
        </View>
      </SettingsSection>

      <SettingsSection label={t('me.notifications.delivery')}>
        <ListGroup>
          <ListRow
            icon="line/bell"
            label={t('me.notifications.sound')}
            trailing="toggle"
            toggled={delivery.sound}
            onToggle={(v) => void updateDelivery({ sound: v })}
            knobColor={KNOB}
          />
          <ListRow
            icon="line/activity"
            label={t('me.notifications.vibration')}
            trailing="toggle"
            toggled={delivery.vibration}
            onToggle={(v) => void updateDelivery({ vibration: v })}
            knobColor={KNOB}
          />
        </ListGroup>
      </SettingsSection>

      <ReminderSheet
        visible={sheet?.kind === 'reminder' && !!open}
        title={sheet?.kind === 'reminder' ? t(`me.notifications.${sheet.key}`) : ''}
        schedule={open ?? { hour: 8, minute: 0, weekdays: [1, 2, 3, 4, 5, 6, 7] }}
        onSave={(s) => {
          if (sheet?.kind === 'reminder') void updateReminder(sheet.key, true, s);
          setSheet(null);
        }}
        onTurnOff={() => {
          if (sheet?.kind === 'reminder') void updateReminder(sheet.key, false);
          setSheet(null);
        }}
        onClose={() => setSheet(null)}
      />
      <ReminderSheet
        visible={sheet?.kind === 'quiet'}
        title={
          sheet?.kind === 'quiet'
            ? t(sheet.end === 'from' ? 'me.reminderSheet.quietFrom' : 'me.reminderSheet.quietTo')
            : ''
        }
        schedule={{ hour: Math.floor(quietTime / 60), minute: quietTime % 60, weekdays: [] }}
        showDays={false}
        onSave={(s) => {
          if (sheet?.kind === 'quiet')
            void updateDelivery({
              quietHours: { ...delivery.quietHours, [sheet.end]: clock(s.hour, s.minute) },
            });
          setSheet(null);
        }}
        onClose={() => setSheet(null)}
      />
    </SettingsScreen>
  );
}
