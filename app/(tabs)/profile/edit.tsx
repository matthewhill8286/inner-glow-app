import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Glow } from '@/components/glow/Glow';
import { AppButton } from '@/components/ui/AppButton';
import { AppField } from '@/components/ui/AppField';
import { Chip } from '@/components/ui/Chip';
import { toast } from '@/components/Toast';
import {
  ProfileAvatar,
  SettingsScreen,
  SettingsSection,
} from '@/components/settings/SettingsParts';
import ProfileAura from '@/assets/svg/illustrations/profile/profile-aura.svg';
import { ISSUES, type IssueKey } from '@/data/issues';
import { useProfile } from '@/hooks/useProfile';
import { useUser } from '@/hooks/useUser';
import { pickAvatar, uploadAvatar, useAvatarUrl } from '@/lib/avatar';
import { backTo } from '@/lib/navigation';
import { birthdayToInput, maskBirthday, parseBirthday } from '@/lib/profile-setup';
import { supabase } from '@/supabase/supabase';

/**
 * Personal information (06 P3, `6719:4677`): photo, full name, "What should we call you?", email,
 * date of birth and what you'd like help with. The help chips are the app's topics
 * (`selected_issues`), which drive Home and suggestions. Country has no data behind it yet, so it is
 * left out. A new email is confirmed through the link Supabase sends to it.
 */
export default function PersonalInformation() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const { profile, updateProfile, isUpdatingProfile } = useProfile({ lazy: true });
  const { data: photoUrl } = useAvatarUrl(profile?.avatarPath);
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [birthday, setBirthday] = useState('');
  const [issues, setIssues] = useState<Set<IssueKey>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; birthday?: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? '');
    setNickname(profile.nickname ?? '');
    setBirthday(birthdayToInput(profile.birthday));
    setIssues(new Set((profile.selectedIssues ?? []) as IssueKey[]));
  }, [profile]);
  useEffect(() => setEmail(user?.email ?? ''), [user?.email]);

  async function changePhoto() {
    if (!user?.id) return;
    const photo = await pickAvatar();
    if (!photo) return;
    setUploading(true);
    try {
      const path = await uploadAvatar(user.id, photo);
      await updateProfile({ avatarPath: path });
      // Same path after a replace, so drop the cached signed URL.
      await queryClient.invalidateQueries({ queryKey: ['avatar-url', path] });
    } catch {
      toast.error(t('me.personal.photoError'));
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    const parsed = birthday.trim() ? parseBirthday(birthday) : null;
    const next = {
      name: name.trim() ? undefined : t('me.personal.nameError'),
      birthday: birthday.trim() && !parsed ? t('me.personal.birthdayError') : undefined,
    };
    setErrors(next);
    if (next.name || next.birthday) return;
    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        nickname: nickname.trim() || null,
        birthday: parsed,
        selectedIssues: [...issues],
      });
      const newEmail = email.trim();
      if (newEmail && newEmail !== user?.email) {
        const { error } = await supabase.auth.updateUser({ email: newEmail });
        if (error) throw error;
        toast.success(t('me.personal.emailSent', { email: newEmail }));
      } else toast.success(t('me.personal.saved'));
      backTo(undefined, '/(tabs)/profile');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  const toggle = (key: IssueKey) =>
    setIssues((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <SettingsScreen
        title={t('me.personal.title')}
        backLabel={t('common.back')}
        onBack={() => backTo(undefined, '/(tabs)/profile')}
        glows={[
          { color: palette.lavenderSoft, opacity: 0.22, x: -70, y: -50, width: 280, blur: 90 },
          { color: palette.sky, opacity: 0.15, x: 200, y: 40, width: 220, blur: 90 },
        ]}
        contentStyle={{ gap: 20 }}
        cta={
          <AppButton
            title={t('me.personal.save')}
            busy={saving || isUpdatingProfile}
            onPress={() => void save()}
          />
        }
      >
        <View style={{ alignItems: 'center', height: 170, marginTop: -10 }}>
          <View style={{ position: 'absolute', top: 0 }} pointerEvents="none">
            <ProfileAura width={188} height={188} />
          </View>
          <Glow
            color={palette.mustard}
            opacity={0.25}
            width={110}
            blur={36}
            style={{ position: 'absolute', top: 39 }}
          />
          <View style={{ marginTop: 52 }}>
            <ProfileAvatar size={84} name={name || profile?.name} photoUrl={photoUrl} />
            {uploading && (
              <View
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 42,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255,255,255,0.6)',
                }}
              >
                <ActivityIndicator color={palette.plum} />
              </View>
            )}
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={uploading}
          onPress={() => void changePhoto()}
          hitSlop={10}
          style={{ alignSelf: 'center', marginTop: -16 }}
        >
          <Text style={[Type.buttonS, { fontSize: 14, color: palette.plum }]}>
            {t('me.personal.changePhoto')}
          </Text>
        </Pressable>

        <AppField
          variant="box"
          label={t('me.personal.fullName')}
          value={name}
          onChangeText={setName}
          error={errors.name}
          autoComplete="name"
          textContentType="name"
        />
        <AppField
          variant="box"
          label={t('me.personal.nickname')}
          value={nickname}
          onChangeText={setNickname}
          maxLength={40}
          autoComplete="nickname"
          textContentType="nickname"
        />
        <View style={{ gap: 6 }}>
          <AppField
            variant="box"
            label={t('me.personal.email')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
          />
          {email.trim() !== (user?.email ?? '') && (
            <Text style={[Type.captionS, { color: palette.textMuted }]}>
              {t('me.personal.emailNote')}
            </Text>
          )}
        </View>
        <AppField
          variant="box"
          label={t('me.personal.birthday')}
          value={birthday}
          onChangeText={(v) => setBirthday(maskBirthday(v))}
          placeholder={t('me.personal.birthdayPlaceholder')}
          keyboardType="number-pad"
          error={errors.birthday}
          endIcon="line/calendar"
        />

        <SettingsSection label={t('me.personal.helpWith')}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {ISSUES.map((issue) => (
              <Chip
                key={issue.key}
                kind="option"
                label={t(`me.issues.${issue.key}`)}
                selected={issues.has(issue.key)}
                onPress={() => toggle(issue.key)}
              />
            ))}
          </View>
        </SettingsSection>
      </SettingsScreen>
    </KeyboardAvoidingView>
  );
}
