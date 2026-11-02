import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { AppButton } from '@/components/ui/AppButton';
import { AppField } from '@/components/ui/AppField';
import { ResetShell } from '@/components/auth/ResetShell';
import { supabase } from '@/supabase/supabase';
import { PASSWORD_RESET_REDIRECT } from '@/lib/auth-redirects';
import { backTo } from '@/lib/navigation';
import { isEmail, maskEmail } from '@/lib/password-reset';

/**
 * Forgot password `4002:14476` (01 §2.10) in the 08 shell. The design picks a contact the account
 * already has, so Sign in passes the email it was given and the screen shows it masked. Without
 * one, an email field takes its place. The Phone option is hidden because there is no SMS reset.
 * Send code emails a 6-digit recovery code and opens Enter code.
 */
export default function ForgotPassword() {
  const { t } = useTranslation();
  const { email: given } = useLocalSearchParams<{ email?: string }>();
  const known = given && isEmail(given) ? given.trim() : null;
  const [typed, setTyped] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const email = known ?? typed.trim();

  async function send() {
    if (!isEmail(email)) {
      setError(t('authReset.invalidEmail'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: sendError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: PASSWORD_RESET_REDIRECT,
      });
      if (sendError) throw sendError;
      router.push({ pathname: '/(auth)/reset-code', params: { email } });
    } catch (err) {
      setError((err as Error).message || t('authReset.sendError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ResetShell
      title={t('authReset.forgotTitle')}
      body={t('authReset.forgotBody')}
      onBack={() => backTo(undefined, '/(auth)/sign-in')}
      inlineCta
      cta={
        <AppButton
          title={t('authReset.sendCode')}
          size="lg"
          busy={loading}
          disabled={loading}
          onPress={send}
        />
      }
    >
      <View style={{ marginTop: 32, gap: 8 }}>
        {known ? (
          <View
            accessible
            accessibilityRole="radio"
            accessibilityState={{ selected: true }}
            style={{
              minHeight: 46,
              borderRadius: 999,
              justifyContent: 'center',
              paddingHorizontal: 16,
              backgroundColor: palette.white,
              borderWidth: 1,
              borderColor: palette.lavender,
              boxShadow: '0px 0px 0px 4px rgba(142,127,166,0.25)',
            }}
          >
            <Text style={[Type.bodyMSemi, { color: palette.plumDeep }]}>
              {t('authReset.emailOption', { email: maskEmail(known) })}
            </Text>
          </View>
        ) : (
          <AppField
            placeholder={t('authNew.emailPlaceholder')}
            accessibilityLabel={t('authNew.emailLabel')}
            value={typed}
            onChangeText={setTyped}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={send}
          />
        )}
        {error ? (
          <Text
            accessibilityLiveRegion="polite"
            style={[Type.caption, { color: palette.danger, marginTop: 4 }]}
          >
            {error}
          </Text>
        ) : null}
      </View>
    </ResetShell>
  );
}
