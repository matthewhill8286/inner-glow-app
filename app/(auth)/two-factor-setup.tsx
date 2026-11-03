import { Type } from '@/constants/typography';
import { palette } from '@/constants/theme';
import { AppButton } from '@/components/ui/AppButton';
import { IconButton } from '@/components/ui/IconButton';
import { Icon } from '@/components/icons/Icon';
import { backTo } from '@/lib/navigation';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
  Share,
  Linking,
} from 'react-native';
// Clipboard: use Share on native, navigator.clipboard on web
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/supabase/supabase';
import { toast } from '@/components/Toast';
import { SvgXml } from 'react-native-svg';
import { setupTotp } from '@/lib/mfa-setup';
import { KEYBOARD_DISMISS_MODE } from '@/lib/keyboard';

/* ── Authenticator app deep links ── */
const AUTH_APPS = [
  {
    name: 'Google Authenticator',
    icon: '🔐',
    scheme: 'otpauth://',
    ios: 'https://apps.apple.com/app/google-authenticator/id388497605',
    android: 'https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2',
  },
  {
    name: 'Microsoft Authenticator',
    icon: '🛡️',
    scheme: 'msauth://',
    ios: 'https://apps.apple.com/app/microsoft-authenticator/id983156458',
    android: 'https://play.google.com/store/apps/details?id=com.azure.authenticator',
  },
  {
    name: 'Authy',
    icon: '🔑',
    scheme: 'authy://',
    ios: 'https://apps.apple.com/app/twilio-authy/id494168017',
    android: 'https://play.google.com/store/apps/details?id=com.authy.authy',
  },
] as const;

type SetupStep =
  | 'loading'
  | 'enroll'
  | 'verify'
  | 'recovery-codes'
  | 'success'
  | 'already-enabled'
  | 'error';

export default function TwoFactorSetup() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<SetupStep>('loading');
  const [qrUri, setQrUri] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [codesCopied, setCodesCopied] = useState(false);
  const [codesConfirmed, setCodesConfirmed] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);

  /** Copy TOTP secret to clipboard with visual feedback */
  const copySecret = useCallback(async () => {
    try {
      if (Platform.OS === 'web' && navigator?.clipboard) {
        await navigator.clipboard.writeText(secret);
      } else {
        // On native, use Share as a copy mechanism
        await Share.share({ message: secret, title: 'TOTP Secret' });
      }
      setSecretCopied(true);
      toast.success(t('toasts.copiedToClipboard'));
      setTimeout(() => setSecretCopied(false), 2500);
    } catch {
      // User cancelled or clipboard unavailable
    }
  }, [secret]);

  /** Open an authenticator app or its store listing */
  const openAuthApp = useCallback(async (app: (typeof AUTH_APPS)[number]) => {
    const storeUrl = Platform.OS === 'ios' ? app.ios : app.android;
    try {
      // Try opening the app directly first
      const canOpen = await Linking.canOpenURL(app.scheme);
      if (canOpen) {
        await Linking.openURL(app.scheme);
      } else {
        // App not installed — open store listing
        await Linking.openURL(storeUrl);
      }
    } catch {
      // Fallback to store
      await Linking.openURL(storeUrl);
    }
  }, []);

  useEffect(() => {
    checkMfaStatus();
  }, []);

  async function checkMfaStatus() {
    try {
      setError(null);
      setStep('loading');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Please sign in again to set up two-factor authentication.');
      const result = await setupTotp(user.id, supabase.auth.mfa);
      setFactorId(result.id);
      if (result.enabled) {
        setStep('already-enabled');
      } else {
        setQrUri(result.qr);
        setSecret(result.secret);
        setStep('enroll');
      }
    } catch (err: any) {
      console.error('[2FA] Check status error:', err);
      toast.error(t('toasts.twoFactorSetupError'));
      setError(err?.message || 'Failed to check 2FA status');
      setStep('error');
    }
  }

  async function verifyCode() {
    if (code.length !== 6) {
      setError(t('twoFactor.enterSixDigits'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });
      if (verifyError) throw verifyError;

      // Generate recovery codes after successful TOTP verification
      await generateRecoveryCodes();
    } catch (err: any) {
      console.error('[2FA] Verify error:', err);
      toast.error(t('toasts.twoFactorVerifyError'));
      setError(err?.message || t('twoFactor.invalidCode'));
    } finally {
      setLoading(false);
    }
  }

  async function generateRecoveryCodes() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/recovery-codes`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            apikey: process.env.EXPO_PUBLIC_SUPABASE_KEY || '',
          },
          body: JSON.stringify({ action: 'generate' }),
        },
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to generate recovery codes');

      setRecoveryCodes(json.codes);
      setStep('recovery-codes');
    } catch (err: any) {
      console.error('[2FA] Recovery codes error:', err);
      // Still mark 2FA as enabled — codes are optional safety net
      setStep('success');
    }
  }

  async function copyAllCodes() {
    const text = recoveryCodes.join('\n');
    try {
      if (Platform.OS === 'web' && navigator?.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        // On native, use the Share API as a copy fallback
        await Share.share({ message: text, title: 'Recovery Codes' });
      }
      toast.success(t('toasts.copiedToClipboard'));
    } catch (_) {
      // Fallback: no-op if clipboard is unavailable
    }
    setCodesCopied(true);
    setTimeout(() => setCodesCopied(false), 3000);
  }

  async function shareCodes() {
    const text = `InnerGlow Recovery Codes\n${'─'.repeat(24)}\n${recoveryCodes.join('\n')}\n\nKeep these codes safe. Each code can only be used once.`;
    try {
      await Share.share({ message: text, title: 'InnerGlow Recovery Codes' });
    } catch (_) {
      // User cancelled
    }
  }

  async function disableMfa() {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      toast.success(t('toasts.twoFactorDisabled'));
      backTo(undefined, '/(tabs)/profile');
    } catch (err: any) {
      console.error('[2FA] Unenroll error:', err);
      toast.error(t('toasts.twoFactorDisableError'));
      setError(err?.message || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  }

  async function regenerateRecoveryCodes() {
    setLoading(true);
    setError(null);
    try {
      await generateRecoveryCodes();
    } catch (err: any) {
      setError(err?.message || 'Failed to regenerate codes');
    } finally {
      setLoading(false);
    }
  }

  const card = { backgroundColor: palette.surface, borderRadius: 24, padding: 24, gap: 16 };
  const body = { ...Type.bodyM, color: palette.textMuted };
  const close = () => backTo(undefined, '/(tabs)/profile');
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView
        keyboardDismissMode={KEYBOARD_DISMISS_MODE}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + 10,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 24,
          gap: 24,
        }}
      >
        <IconButton variant="nav" accessibilityLabel={t('common.back')} onPress={close} />
        <View style={{ gap: 8 }}>
          <Text accessibilityRole="header" style={[Type.titleLg, { color: palette.ink }]}>
            {t('twoFactor.title')}
          </Text>
          <Text style={body}>{t('twoFactor.subtitle')}</Text>
        </View>
        {step === 'loading' && <ActivityIndicator size="large" color={palette.plum} />}
        {step === 'enroll' && (
          <>
            <View style={card}>
              <Text style={[Type.titleSm, { color: palette.plumDeep }]}>
                {t('twoFactor.step1')}
              </Text>
              <View style={{ alignItems: 'center', backgroundColor: palette.white, padding: 12 }}>
                {qrUri ? (
                  <SvgXml xml={qrUri} width={200} height={200} />
                ) : (
                  <ActivityIndicator color={palette.plum} />
                )}
              </View>
              <Text style={body}>{t('twoFactor.cantScan')}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('twoFactor.cantScan')}
                onPress={copySecret}
                style={{ padding: 16, borderRadius: 16, backgroundColor: palette.selected }}
              >
                <Text
                  selectable
                  style={[
                    Type.bodyMSemi,
                    { color: palette.plum, textAlign: 'center', letterSpacing: 1 },
                  ]}
                >
                  {secret}
                </Text>
              </Pressable>
              {secretCopied && <Text style={body}>{t('twoFactor.secretCopied')}</Text>}
              <Text style={[Type.label, { color: palette.ink }]}>
                {t('twoFactor.compatibleApps')}
              </Text>
              {AUTH_APPS.map((app) => (
                <AppButton
                  key={app.name}
                  variant="outline"
                  title={app.name}
                  onPress={() => void openAuthApp(app)}
                />
              ))}
            </View>
            <View style={card}>
              <Text style={[Type.titleSm, { color: palette.plumDeep }]}>
                {t('twoFactor.step2')}
              </Text>
              <TextInput
                value={code}
                onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                maxLength={6}
                accessibilityLabel={t('twoFactor.enterSixDigits')}
                style={[
                  Type.titleMd,
                  {
                    backgroundColor: palette.selected,
                    borderColor: palette.borderStrong,
                    borderWidth: 1,
                    borderRadius: 16,
                    padding: 16,
                    textAlign: 'center',
                    color: palette.ink,
                    letterSpacing: 8,
                  },
                ]}
              />
              {error && (
                <Text accessibilityRole="alert" style={[body, { color: palette.danger }]}>
                  {error}
                </Text>
              )}
              <AppButton
                title={t('twoFactor.verifyAndEnable')}
                onPress={verifyCode}
                busy={loading}
                disabled={code.length !== 6}
              />
            </View>
          </>
        )}
        {step === 'recovery-codes' && (
          <View style={card}>
            <Text style={[Type.titleSm, { color: palette.plumDeep }]}>
              {t('twoFactor.recoveryCodesTitle')}
            </Text>
            <Text style={body}>{t('twoFactor.recoveryCodesSubtitle')}</Text>
            <Text style={[body, { color: palette.danger }]}>
              {t('twoFactor.recoveryCodesWarning')}
            </Text>
            {recoveryCodes.map((rc) => (
              <Text
                key={rc}
                selectable
                style={[Type.bodyMSemi, { color: palette.ink, textAlign: 'center' }]}
              >
                {rc}
              </Text>
            ))}
            <AppButton
              variant="outline"
              title={t(
                codesCopied ? 'twoFactor.recoveryCodesCopied' : 'twoFactor.recoveryCodesCopy',
              )}
              onPress={copyAllCodes}
            />
            <AppButton
              variant="outline"
              title={t('twoFactor.recoveryCodesShare')}
              onPress={shareCodes}
            />
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: codesConfirmed }}
              onPress={() => setCodesConfirmed(!codesConfirmed)}
              style={{ flexDirection: 'row', gap: 12, paddingVertical: 12 }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  borderWidth: 1.5,
                  borderColor: palette.plum,
                  backgroundColor: codesConfirmed ? palette.plum : palette.white,
                }}
              >
                {codesConfirmed && <Icon name="line/check" size={20} color={palette.white} />}
              </View>
              <Text style={[body, { flex: 1 }]}>{t('twoFactor.recoveryCodesConfirm')}</Text>
            </Pressable>
            <AppButton
              title={t('twoFactor.recoveryCodesContinue')}
              disabled={!codesConfirmed}
              onPress={() => setStep('success')}
            />
          </View>
        )}
        {(step === 'success' || step === 'already-enabled') && (
          <View style={card}>
            <Text style={[Type.titleSm, { color: palette.plumDeep }]}>
              {t(step === 'success' ? 'twoFactor.enabled' : 'twoFactor.alreadyEnabled')}
            </Text>
            <Text style={body}>
              {t(
                step === 'success'
                  ? 'twoFactor.enabledSubtitle'
                  : 'twoFactor.alreadyEnabledSubtitle',
              )}
            </Text>
            {error && (
              <Text accessibilityRole="alert" style={[body, { color: palette.danger }]}>
                {error}
              </Text>
            )}
            {step === 'already-enabled' && (
              <>
                <AppButton
                  title={t('twoFactor.regenerateCodes')}
                  busy={loading}
                  onPress={regenerateRecoveryCodes}
                />
                <AppButton
                  variant="outline"
                  title={t('twoFactor.disable')}
                  disabled={loading}
                  onPress={disableMfa}
                />
              </>
            )}
            <AppButton variant="text" title={t('twoFactor.done')} onPress={close} />
          </View>
        )}
        {step === 'error' && (
          <View style={card}>
            <Text accessibilityRole="alert" style={[body, { color: palette.danger }]}>
              {error || t('twoFactor.setupError')}
            </Text>
            <AppButton title={t('twoFactor.tryAgain')} onPress={checkMfaStatus} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
