import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { supabase } from '@/supabase/supabase';
import { authTokenVar } from '@/lib/state';
import { passwordMeetsPolicy } from '@/lib/password-policy';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { AppField } from '@/components/ui/AppField';
import { AppButton } from '@/components/ui/AppButton';
import { AuthLinkLine, AuthShell } from '@/components/auth/AuthShell';
import Svg, { Circle, Line } from 'react-native-svg';

/**
 * Sign up `4002:14458` (01 §2.9): email, password and confirmation, then the legal note.
 * The name is asked for later in profile setup, so there is no name field here.
 */
export default function SignUp() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mismatch, setMismatch] = useState(false);

  async function onCreate() {
    setMismatch(false);
    if (!email || !pass) {
      setError(t('auth.emailPasswordRequired'));
      return;
    }
    if (!passwordMeetsPolicy(pass)) {
      setError(t('auth.passwordMinLength'));
      return;
    }
    if (pass !== confirm) {
      setError(null);
      setMismatch(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password: pass });
      if (error) throw error;
      if (!data.session && !data.user) throw new Error('Failed to create account');
      const token = data.session?.access_token || '';
      if (token) authTokenVar(token);
      router.replace('/(onboarding)/assessment');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const legal = (policy: 'terms' | 'privacy') => router.push({ pathname: '/(utils)/legal', params: { policy } });

  return (
    <AuthShell
      title={t('authNew.createSpace')}
      footer={
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 8 }}>
          {/* Legal/Note `6674:3014`, with Terms and Privacy as links. */}
          <Svg width={14} height={14} viewBox="0 0 14 14" style={{ marginTop: 1 }}>
            <Circle cx={7} cy={7} r={5.54} stroke={palette.lavender} strokeWidth={1.05} fill="none" />
            <Line x1={7} y1={6.42} x2={7} y2={9.92} stroke={palette.lavender} strokeWidth={1.05} strokeLinecap="round" />
            <Circle cx={7} cy={4.43} r={0.7} fill={palette.lavender} />
          </Svg>
          <Text style={{ ...Type.legal, color: palette.textLegal, flex: 1 }}>
            {t('authNew.legalLead')}{' '}
            <Text accessibilityRole="link" onPress={() => legal('terms')} style={{ textDecorationLine: 'underline' }}>
              {t('onboarding.terms')}
            </Text>{' '}
            {t('authNew.and')}{' '}
            <Text accessibilityRole="link" onPress={() => legal('privacy')} style={{ textDecorationLine: 'underline' }}>
              {t('onboarding.privacy')}
            </Text>
            {t('authNew.legalTail')}
          </Text>
        </View>
      }
    >
      <View style={{ marginTop: 40, gap: 24 }}>
        <AppField
          label={t('authNew.emailLabel')}
          placeholder={t('authNew.emailPlaceholder')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <AppField
          label={t('authNew.passwordLabel')}
          placeholder={t('authNew.passwordPlaceholder')}
          value={pass}
          onChangeText={setPass}
          secureTextEntry
          revealable
          autoComplete="new-password"
          textContentType="newPassword"
          error={error ?? undefined}
        />
        <AppField
          label={t('authNew.confirmLabel')}
          placeholder={t('authNew.confirmPlaceholder')}
          value={confirm}
          onChangeText={(v) => {
            setConfirm(v);
            setMismatch(false);
          }}
          secureTextEntry
          revealable
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={onCreate}
          error={mismatch ? t('authNew.mismatch') : undefined}
        />
        <AppButton title={t('authNew.signUp')} size="lg" icon="arrow/forward" busy={loading} disabled={loading} onPress={onCreate} />
      </View>
      <View style={{ marginTop: 40 }}>
        <AuthLinkLine lead={t('onboarding.haveAccount')} link={t('onboarding.signIn')} onPress={() => router.replace('/(auth)/sign-in')} />
      </View>
    </AuthShell>
  );
}
