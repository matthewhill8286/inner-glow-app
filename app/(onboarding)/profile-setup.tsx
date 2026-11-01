import React, { useEffect, useMemo, useState } from 'react';
import { Platform, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { toast } from '@/components/Toast';
import { AppButton } from '@/components/ui/AppButton';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { ProfileShell } from '@/components/profile-setup/ProfileShell';
import { AvatarPicker, CheckinScene, NotificationCard, PrivacyScene, ProfileField } from '@/components/profile-setup/steps';
import { useProfile } from '@/hooks/useProfile';
import { useUser } from '@/hooks/useUser';
import { pickAvatar, uploadAvatar, useAvatarUrl } from '@/lib/avatar';
import { authenticate, biometricSupport, setAppLockEnabled } from '@/lib/app-lock';
import { registerForPushNotificationsAsync, setReminderEnabled } from '@/lib/notifications';
import { profileChoiceValue } from '@/lib/profile-choices';
import {
  birthdayToInput,
  CHECKIN_PRESETS,
  DEFAULT_CHECKIN_TIME,
  DEFAULT_NOTIFICATION_PREFS,
  formatTime,
  maskBirthday,
  NOTIFICATION_CHOICES,
  parseBirthday,
  parseTime,
  presetForTime,
  profileSteps,
  slotForTime,
  type BiometricKind,
  type CheckinSlot,
  type NotificationChoice,
} from '@/lib/profile-setup';

/**
 * Profile setup (docs/design-handoff/02 §4–5, re-extracted from Figma section `4002:15061`, and 10 §3.3):
 * P1 about you, P2 check-in time, P3 notifications, P4 app lock (only with biometrics), then P5 in
 * `profile-completion`. Each step saves when its button is pressed; Skip and the text links move on
 * without saving.
 */

const SLOTS: CheckinSlot[] = ['morning', 'afternoon', 'evening'];
const ROUTINE_FOR_SLOT: Record<CheckinSlot, string> = {
  morning: profileChoiceValue('routineMorning'),
  afternoon: 'Afternoon',
  evening: profileChoiceValue('routineEvening'),
};
const NOTIFICATION_ICONS = { glow_ai_messages: 'line/sparkle', journal_reminder: 'line/journal', weekly_summary: 'line/chart' } as const;

export default function ProfileSetupScreen() {
  const { t } = useTranslation();
  const { profile, updateProfile } = useProfile();
  const { data: user } = useUser();

  const [biometric, setBiometric] = useState<BiometricKind | null>(null);
  const steps = useMemo(() => profileSteps(!!biometric), [biometric]);
  const [index, setIndex] = useState(0);
  const step = steps[Math.min(index, steps.length - 1)];
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [birthdayError, setBirthdayError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [time, setTime] = useState(DEFAULT_CHECKIN_TIME);
  const [picking, setPicking] = useState(false);
  const [prefs, setPrefs] = useState<Record<NotificationChoice, boolean>>(DEFAULT_NOTIFICATION_PREFS);
  const { data: photoUrl } = useAvatarUrl(profile?.avatarPath);

  useEffect(() => {
    void biometricSupport().then((s) => setBiometric(s.available ? s.kind : null));
  }, []);

  // Start from anything already saved, for people who come back to setup.
  useEffect(() => {
    if (!profile) return;
    setName((n) => n || profile.name || '');
    setBirthday((b) => b || birthdayToInput(profile.birthday));
    if (profile.checkinTime) setTime(profile.checkinTime);
    setPrefs((p) => ({ ...p, ...(profile.notificationPrefs ?? {}) }));
  }, [profile]);

  function next() {
    if (index >= steps.length - 1) router.replace('/(onboarding)/profile-completion');
    else setIndex((i) => i + 1);
  }

  function back() {
    if (index > 0) setIndex((i) => i - 1);
    else if (router.canGoBack()) router.back();
  }

  async function run(work: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    try {
      await work();
      next();
    } catch {
      toast.error(t('profileFlow.saveFailed'));
    } finally {
      setBusy(false);
    }
  }

  async function choosePhoto() {
    if (!user?.id) return;
    const photo = await pickAvatar();
    if (!photo) return;
    setUploading(true);
    try {
      const path = await uploadAvatar(user.id, photo);
      await updateProfile({ avatarPath: path });
    } catch {
      toast.error(t('profileFlow.about.photoFailed'));
    } finally {
      setUploading(false);
    }
  }

  function openTimePicker() {
    const { hour, minute } = parseTime(time);
    const value = new Date(2000, 0, 1, hour, minute);
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode: 'time',
        is24Hour: true,
        onChange: (event, date) => event.type === 'set' && date && setTime(formatTime(date.getHours(), date.getMinutes())),
      });
    } else setPicking(true);
  }

  const shell = {
    step: index + 1,
    total: steps.length,
    onBack: back,
    onSkip: next,
    backLabel: t('common.back'),
    skipLabel: t('profileFlow.skip'),
  };

  if (step === 'profile') {
    return (
      <ProfileShell
        {...shell}
        title={t('profileFlow.about.title')}
        subtitle={t('profileFlow.about.subtitle')}
        cta={
          <AppButton
            title={t('profileFlow.continue')}
            busy={busy}
            onPress={() => {
              const parsed = birthday ? parseBirthday(birthday) : null;
              if (birthday && !parsed) {
                setBirthdayError(t('profileFlow.about.birthdayInvalid'));
                return;
              }
              void run(() => updateProfile({ name: name.trim() || null, birthday: parsed }).then(() => undefined));
            }}
          />
        }
      >
        <View style={{ marginTop: 56, gap: 28 }}>
          <AvatarPicker photoUrl={photoUrl} busy={uploading} onPress={choosePhoto} caption={t('profileFlow.about.photo')} accessibilityLabel={t('profileFlow.about.photoA11y')} />
          <View style={{ gap: 20 }}>
            <ProfileField label={t('profileFlow.about.name')} value={name} onChangeText={setName} placeholder={t('profileFlow.about.namePlaceholder')} autoCapitalize="words" textContentType="givenName" returnKeyType="next" />
            <ProfileField
              label={t('profileFlow.about.birthday')}
              value={birthday}
              onChangeText={(v) => {
                setBirthday(maskBirthday(v));
                setBirthdayError(null);
              }}
              placeholder={t('profileFlow.about.birthdayPlaceholder')}
              keyboardType="number-pad"
              maxLength={14}
              error={birthdayError}
            />
          </View>
        </View>
      </ProfileShell>
    );
  }

  if (step === 'checkin') {
    const slot = presetForTime(time);
    return (
      <ProfileShell
        {...shell}
        title={t('profileFlow.checkin.title')}
        subtitle={t('profileFlow.checkin.subtitle')}
        link={{ label: t('profileFlow.checkin.notNow'), onPress: next }}
        cta={
          <AppButton
            title={t('profileFlow.checkin.setReminder')}
            busy={busy}
            onPress={() =>
              run(async () => {
                try {
                  await setReminderEnabled('daily_checkin', true, parseTime(time));
                } catch {
                  // The time is still worth keeping; the reminder starts once notifications are allowed.
                  toast.info(t('profileFlow.checkin.notificationsOff'));
                }
                await updateProfile({ checkinTime: time, routine: ROUTINE_FOR_SLOT[slotForTime(time)] });
              })
            }
          />
        }
      >
        <CheckinScene
          time={time}
          caption={t(`profileFlow.checkin.captions.${slotForTime(time)}`)}
          slot={slot}
          slots={SLOTS.map((key) => ({ key, label: t(`profileFlow.checkin.slots.${key}`) }))}
          onPickSlot={(key) => setTime(CHECKIN_PRESETS[key])}
          onPressTime={openTimePicker}
          timeLabel={t('profileFlow.checkin.timeA11y')}
        />
        {Platform.OS === 'ios' && (
          <BottomSheet visible={picking} onClose={() => setPicking(false)}>
            <DateTimePicker
              value={new Date(2000, 0, 1, parseTime(time).hour, parseTime(time).minute)}
              mode="time"
              display="spinner"
              minuteInterval={5}
              onChange={(_, date) => date && setTime(formatTime(date.getHours(), date.getMinutes()))}
              accessibilityLabel={t('profileFlow.checkin.pickTime')}
            />
            <AppButton title={t('profileFlow.checkin.done')} onPress={() => setPicking(false)} style={{ alignSelf: 'stretch' }} />
          </BottomSheet>
        )}
      </ProfileShell>
    );
  }

  if (step === 'notifications') {
    return (
      <ProfileShell
        {...shell}
        title={t('profileFlow.notifications.title')}
        subtitle={t('profileFlow.notifications.subtitle')}
        link={{ label: t('profileFlow.notifications.later'), onPress: next }}
        cta={
          <AppButton
            title={t('profileFlow.notifications.allow')}
            busy={busy}
            onPress={() =>
              run(async () => {
                if (await registerForPushNotificationsAsync()) {
                  // Glow AI messages need server push, which is not built yet; the choice is saved for it.
                  for (const key of ['journal_reminder', 'weekly_summary'] as const) {
                    await setReminderEnabled(key, prefs[key]).catch(() => undefined);
                  }
                } else toast.info(t('profileFlow.notifications.denied'));
                await updateProfile({ notificationPrefs: prefs });
              })
            }
          />
        }
      >
        <NotificationCard
          rows={NOTIFICATION_CHOICES.map((key) => ({
            key,
            icon: NOTIFICATION_ICONS[key],
            title: t(`profileFlow.notifications.rows.${key}.title`),
            subtitle: t(`profileFlow.notifications.rows.${key}.subtitle`),
          }))}
          values={prefs}
          onChange={(key, value) => setPrefs((p) => ({ ...p, [key]: value }))}
        />
      </ProfileShell>
    );
  }

  const method = t(`profileFlow.biometric.${biometric ?? 'faceId'}`);
  return (
    <ProfileShell
      {...shell}
      title={t('profileFlow.privacy.title')}
      subtitle={t('profileFlow.privacy.subtitle', { method })}
      scroll={false}
      link={{ label: t('profileFlow.privacy.notNow'), onPress: next }}
      cta={
        <AppButton
          title={t('profileFlow.privacy.turnOn', { method })}
          busy={busy}
          onPress={() =>
            run(async () => {
              if (user?.id && (await authenticate(t('profileFlow.privacy.prompt'), t('common.cancel')))) await setAppLockEnabled(user.id, true);
              else toast.info(t('profileFlow.privacy.failed'));
            })
          }
        />
      }
    >
      <PrivacyScene />
    </ProfileShell>
  );
}
