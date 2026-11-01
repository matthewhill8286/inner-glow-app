import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { AppButton } from '@/components/ui/AppButton';
import { AppField } from '@/components/ui/AppField';
import { toast } from '@/components/Toast';
import { SettingsScreen } from '@/components/settings/SettingsParts';
import { useUser } from '@/hooks/useUser';
import { backTo } from '@/lib/navigation';
import { passwordMeetsRule } from '@/lib/reminder-schedule';
import { supabase } from '@/supabase/supabase';

/**
 * Settings · Change password (`6801:6846`): current password, new password with the rule shown as an
 * error until it is met, confirm, a "Reset it" link to the forgotten-password flow, and Update
 * password. The current password is checked by signing in with it before the change.
 */
export default function ChangePassword() {
  const { t } = useTranslation();
  const { data: user } = useUser();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});
  const [busy, setBusy] = useState(false);

  async function update() {
    const e = {
      current: current ? undefined : t('me.password.wrongCurrent'),
      next: passwordMeetsRule(next) ? undefined : t('me.password.rule'),
      confirm: confirm === next ? undefined : t('me.password.mismatch'),
    };
    setErrors(e);
    if (e.current || e.next || e.confirm || !user?.email) return;
    setBusy(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: current,
      });
      if (signInError) {
        setErrors({ current: t('me.password.wrongCurrent') });
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) throw error;
      toast.success(t('me.password.updated'));
      backTo(undefined, '/(tabs)/profile/security');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <SettingsScreen
        title={t('me.password.title')}
        backLabel={t('common.back')}
        onBack={() => backTo(undefined, '/(tabs)/profile/security')}
        contentStyle={{ gap: 20 }}
        cta={
          <AppButton title={t('me.password.update')} busy={busy} onPress={() => void update()} />
        }
      >
        <AppField
          variant="box"
          label={t('me.password.current')}
          value={current}
          onChangeText={setCurrent}
          secureTextEntry
          revealable
          autoComplete="current-password"
          textContentType="password"
          error={errors.current}
        />
        <View style={{ gap: 6 }}>
          <AppField
            variant="box"
            label={t('me.password.next')}
            value={next}
            onChangeText={(v) => {
              setNext(v);
              if (errors.next && passwordMeetsRule(v))
                setErrors((p) => ({ ...p, next: undefined }));
            }}
            secureTextEntry
            revealable
            autoComplete="new-password"
            textContentType="newPassword"
            error={errors.next}
          />
          {!errors.next && (
            <Text style={[Type.captionS, { color: palette.textMuted }]}>
              {t('me.password.rule')}
            </Text>
          )}
        </View>
        <AppField
          variant="box"
          label={t('me.password.confirm')}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          revealable
          autoComplete="new-password"
          textContentType="newPassword"
          error={errors.confirm}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={[Type.bodySm, { color: palette.textMuted }]}>{t('me.password.forgot')}</Text>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push('/(auth)/forgot-password')}
            hitSlop={10}
          >
            <Text style={[Type.buttonS, { fontSize: 14, color: palette.plum }]}>
              {t('me.password.reset')}
            </Text>
          </Pressable>
        </View>
      </SettingsScreen>
    </KeyboardAvoidingView>
  );
}
