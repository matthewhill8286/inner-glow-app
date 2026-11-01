import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/supabase/supabase';
import { authTokenVar } from '@/lib/state';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { AppField } from '@/components/ui/AppField';
import { AppButton } from '@/components/ui/AppButton';
import { AuthLinkLine, AuthShell } from '@/components/auth/AuthShell';

/** Sign in `4002:14430` (01 §2.8). */
export default function SignIn() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSignIn() {
    if (!email || !pass) {
      setError(t('auth.emailPasswordRequired'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      if (!data.session) throw new Error('No session');
      authTokenVar(data.session.access_token);

      // Mark onboarding as seen so they skip the welcome slides next time.
      await AsyncStorage.setItem('onboarding:seen:v1', 'true');

      // Check whether the user has a verified TOTP factor that still needs a code.
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const hasVerifiedTotp = factorsData?.totp?.some((f) => f.status === 'verified');
      if (hasVerifiedTotp) {
        const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aal.data?.currentLevel === 'aal1' && aal.data?.nextLevel === 'aal2') {
          router.replace('/(auth)/two-factor-verify');
          return;
        }
      }
      router.replace('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={t('authNew.welcomeBack')}
      footer={
        <View style={{ alignItems: 'center', gap: 8 }}>
          <AuthLinkLine lead={t('authNew.noAccount')} link={t('authNew.signUp')} onPress={() => router.replace('/(auth)/sign-up')} />
          <Pressable accessibilityRole="link" hitSlop={8} onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={{ ...Type.label, fontWeight: '700', letterSpacing: -0.2, color: palette.lavender, textDecorationLine: 'underline' }}>
              {t('authNew.forgotPassword')}
            </Text>
          </Pressable>
        </View>
      }
    >
      <View style={{ marginTop: 48, gap: 24 }}>
        <AppField
          label={t('authNew.emailLabel')}
          placeholder={t('authNew.emailPlaceholder')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
        />
        <AppField
          label={t('authNew.passwordLabel')}
          placeholder={t('authNew.passwordPlaceholder')}
          value={pass}
          onChangeText={setPass}
          secureTextEntry
          revealable
          autoComplete="password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={onSignIn}
          error={error ?? undefined}
        />
        <AppButton title={t('authNew.signIn')} size="lg" icon="arrow/forward" busy={loading} disabled={loading} onPress={onSignIn} />
      </View>
    </AuthShell>
  );
}
