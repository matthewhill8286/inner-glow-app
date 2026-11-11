import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon } from '@/components/icons/Icon';
import { GlowField } from '@/components/glow/Glow';
import { AppButton } from '@/components/ui/AppButton';
import { AppField } from '@/components/ui/AppField';
import { ResetShell } from '@/components/auth/ResetShell';
import { supabase } from '@/supabase/supabase';
import { signOutOnPurpose } from '@/lib/session-expiry';
import { backTo } from '@/lib/navigation';
import { passwordRules } from '@/lib/password-reset';
import { passwordMeetsPolicy } from '@/lib/password-policy';

function Rule({ met, label }: { met: boolean; label: string }) {
  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityState={{ checked: met }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
    >
      {met ? (
        <Icon name="line/check" size={16} color={palette.plum} />
      ) : (
        <View style={{ width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
          <View
            style={{
              width: 13,
              height: 13,
              borderRadius: 7,
              borderWidth: 1.5,
              borderColor: palette.borderStrong,
            }}
          />
        </View>
      )}
      <Text style={[Type.captionM, { color: met ? palette.plumDeep : palette.textMuted }]}>
        {label}
      </Text>
    </View>
  );
}

/**
 * Sign in · New password `6787:4945` and Password updated `6787:5005` (08 §2.2–2.3). Reached with a
 * recovery session from Enter code, or from the older reset link. The three rules update as the
 * user types and Save stays off until they all pass. Back to sign in signs the recovery session out
 * first, so the auth gate shows Sign in instead of the app.
 */
export default function ResetPassword() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const rules = passwordRules(password, confirm);
  // The same policy as Sign up, so a reset password always works there too.
  const ready = passwordMeetsPolicy(password) && rules.match;

  async function save() {
    if (!ready) return;
    setLoading(true);
    setError(null);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
    } catch (err) {
      setError((err as Error).message || t('authReset.saveError'));
    } finally {
      setLoading(false);
    }
  }

  async function backToSignIn() {
    await signOutOnPurpose();
    await supabase.auth.signOut().catch(() => undefined);
    router.replace('/(auth)/sign-in');
  }

  if (done) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: palette.bg,
          paddingHorizontal: 24,
          paddingBottom: Math.max(insets.bottom, 16) + 32,
        }}
      >
        <GlowField
          glows={[
            { color: palette.lavenderSoft, opacity: 0.25, x: -70, y: -50, width: 280, blur: 90 },
            { color: palette.mustard, opacity: 0.15, x: 200, y: 40, width: 220, blur: 90 },
          ]}
        />
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 24,
            paddingTop: insets.top,
          }}
        >
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: palette.cream,
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0px 0px 40px 0px rgba(226,204,64,0.45)',
            }}
          >
            <Icon name="line/lock" size={36} color={palette.plum} />
          </View>
          <View style={{ gap: 12, alignItems: 'center' }}>
            <Text
              accessibilityRole="header"
              style={[Type.titleXl, { letterSpacing: 0, color: palette.ink, textAlign: 'center' }]}
            >
              {t('authReset.doneTitle')}
            </Text>
            <Text
              style={[
                Type.bodyM,
                { lineHeight: 21, color: palette.textMuted, textAlign: 'center' },
              ]}
            >
              {t('authReset.doneBody')}
            </Text>
          </View>
        </View>
        <AppButton title={t('authReset.backToSignIn')} size="lg" onPress={backToSignIn} />
      </View>
    );
  }

  return (
    <ResetShell
      title={t('authReset.newTitle')}
      body={t('authReset.newBody')}
      onBack={() => backTo(undefined, '/(auth)/forgot-password')}
      cta={
        <AppButton
          title={t('authReset.save')}
          size="lg"
          busy={loading}
          disabled={loading || !ready}
          onPress={save}
        />
      }
    >
      <View style={{ marginTop: 32, gap: 24 }}>
        <AppField
          variant="box"
          label={t('authReset.newLabel')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoFocus
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
        />
        <AppField
          variant="box"
          label={t('authReset.confirmLabel')}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={save}
          error={error ?? undefined}
        />
        <View style={{ gap: 8 }}>
          <Rule met={rules.length} label={t('authReset.ruleLength')} />
          <Rule met={rules.symbol} label={t('authReset.ruleSymbol')} />
          <Rule met={rules.match} label={t('authReset.ruleMatch')} />
        </View>
      </View>
    </ResetShell>
  );
}
