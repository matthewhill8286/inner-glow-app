import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { AppButton } from '@/components/ui/AppButton';
import { ResetShell } from '@/components/auth/ResetShell';
import { toast } from '@/components/Toast';
import { supabase } from '@/supabase/supabase';
import { PASSWORD_RESET_REDIRECT } from '@/lib/auth-redirects';
import { backTo } from '@/lib/navigation';
import {
  RESEND_SECONDS,
  RESET_CODE_LENGTH,
  cleanCode,
  countdown,
  maskEmail,
} from '@/lib/password-reset';

/**
 * Sign in · Enter code `6787:4891` (08 §2.1). One hidden input drives six boxes, so paste and the
 * iOS code suggestion work. The sixth digit submits; "Verify code" retries. A right code opens a
 * recovery session and New password. Resend waits a minute, the limit Supabase puts on recovery
 * emails. The wrong-code state is not designed: the boxes turn danger with a caption.
 */
export default function ResetCode() {
  const { t } = useTranslation();
  const { email = '' } = useLocalSearchParams<{ email?: string }>();
  const input = useRef<TextInput>(null);
  const [code, setCode] = useState('');
  const [focused, setFocused] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendAt, setResendAt] = useState(() => Date.now() + RESEND_SECONDS * 1000);
  const [now, setNow] = useState(() => Date.now());
  const left = Math.max(0, (resendAt - now) / 1000);

  useEffect(() => {
    if (left <= 0) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [left]);

  async function verify(token = code) {
    if (token.length !== RESET_CODE_LENGTH || loading) return;
    setLoading(true);
    setError(null);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'recovery',
      });
      if (verifyError) throw verifyError;
      router.replace('/(auth)/reset-password');
    } catch {
      setError(t('authReset.codeError'));
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    try {
      const { error: sendError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: PASSWORD_RESET_REDIRECT,
      });
      if (sendError) throw sendError;
      setResendAt(Date.now() + RESEND_SECONDS * 1000);
      setNow(Date.now());
      setCode('');
      setError(null);
      toast.success(t('authReset.codeSent'));
    } catch (err) {
      toast.error((err as Error).message || t('authReset.sendError'));
    }
  }

  const onChange = (value: string) => {
    const next = cleanCode(value);
    setCode(next);
    if (error) setError(null);
    if (next.length === RESET_CODE_LENGTH) void verify(next);
  };

  return (
    <ResetShell
      title={t('authReset.codeTitle')}
      body={t('authReset.codeBody', { email: maskEmail(email) })}
      onBack={() => backTo(undefined, '/(auth)/forgot-password')}
      cta={
        <AppButton
          title={t('authReset.verify')}
          size="lg"
          busy={loading}
          disabled={loading || code.length !== RESET_CODE_LENGTH}
          onPress={() => verify()}
        />
      }
    >
      <Pressable
        accessible={false}
        onPress={() => input.current?.focus()}
        style={{ marginTop: 32 }}
      >
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {Array.from({ length: RESET_CODE_LENGTH }, (_, i) => {
            const digit = code[i];
            const active =
              focused &&
              i === Math.min(code.length, RESET_CODE_LENGTH - 1) &&
              code.length < RESET_CODE_LENGTH;
            return (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 60,
                  borderRadius: 16,
                  backgroundColor: palette.white,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: error || active ? 1.5 : 1,
                  borderColor: error
                    ? palette.danger
                    : active
                      ? palette.plum
                      : digit
                        ? palette.borderStrong
                        : palette.borderLilac,
                }}
              >
                {digit ? (
                  <Text
                    style={[
                      Type.titleLg,
                      {
                        fontFamily: Type.bodyM.fontFamily,
                        fontWeight: Type.bodyM.fontWeight,
                        color: palette.ink,
                      },
                    ]}
                  >
                    {digit}
                  </Text>
                ) : active ? (
                  <View
                    style={{ width: 2, height: 24, borderRadius: 1, backgroundColor: palette.plum }}
                  />
                ) : null}
              </View>
            );
          })}
        </View>
        <TextInput
          ref={input}
          value={code}
          onChangeText={onChange}
          autoFocus
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
          maxLength={RESET_CODE_LENGTH + 4}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          caretHidden
          accessibilityLabel={t('authReset.codeLabel')}
          style={{ position: 'absolute', inset: 0, opacity: 0.02, color: 'transparent' }}
        />
      </Pressable>
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[Type.caption, { color: palette.danger, marginTop: 10 }]}
        >
          {error}
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 4, marginTop: 24, alignItems: 'center' }}>
        <Text style={[Type.bodyS, { color: palette.textMuted }]}>{t('authReset.didntGet')}</Text>
        {left > 0 ? (
          <Text style={[Type.buttonS, { color: palette.textSubtle }]}>
            {t('authReset.resendIn', { time: countdown(left) })}
          </Text>
        ) : (
          <Text
            accessibilityRole="button"
            onPress={resend}
            suppressHighlighting
            style={[Type.buttonS, { color: palette.plum }]}
          >
            {t('authReset.resend')}
          </Text>
        )}
      </View>
    </ResetShell>
  );
}
