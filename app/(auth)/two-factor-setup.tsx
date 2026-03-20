import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
  Image,
  Share,
  Linking,
  Alert,
} from 'react-native';
// Clipboard: use Share on native, navigator.clipboard on web
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { supabase } from '@/supabase/supabase';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

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

/* ── Design tokens ── */
const C = {
  pageBg: '#F7F4F2',
  cardBg: '#FFFFFF',
  brown: '#a07b55',
  brownDark: '#3E2723',
  brownText: '#96784E',
  brownLight: '#6a5e55',
  inputBg: '#f2ece6',
  tagBg: '#E8DDD9',
  red: '#C45B5B',
  olive: '#828a6a',
  oliveLight: '#b8c39d',
  olivePale: '#dbe3cb',
  green: '#5B8A5A',
  purple: '#7B6DC9',
};

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
      setTimeout(() => setSecretCopied(false), 2500);
    } catch {
      // User cancelled or clipboard unavailable
    }
  }, [secret]);

  /** Open an authenticator app or its store listing */
  const openAuthApp = useCallback(async (app: typeof AUTH_APPS[number]) => {
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
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;

      const totpFactors = data.totp ?? [];
      const verifiedFactor = totpFactors.find((f) => f.status === 'verified');

      if (verifiedFactor) {
        setStep('already-enabled');
        setFactorId(verifiedFactor.id);
      } else {
        // Unenroll any leftover (non-verified) factors first
        for (const f of totpFactors) {
          await supabase.auth.mfa.unenroll({ factorId: f.id });
        }
        await enrollTotp();
      }
    } catch (err: any) {
      console.error('[2FA] Check status error:', err);
      setError(err?.message || 'Failed to check 2FA status');
      setStep('error');
    }
  }

  async function enrollTotp() {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'InnerGlow Authenticator',
      });

      if (error) throw error;

      setFactorId(data.id);
      setQrUri(data.totp.qr_code);
      setSecret(data.totp.secret);
      setStep('enroll');
    } catch (err: any) {
      console.error('[2FA] Enroll error:', err);
      setError(err?.message || 'Failed to set up 2FA');
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
      setError(err?.message || t('twoFactor.invalidCode'));
    } finally {
      setLoading(false);
    }
  }

  async function generateRecoveryCodes() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
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
      router.back();
    } catch (err: any) {
      console.error('[2FA] Unenroll error:', err);
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

  return (
    <View style={{ flex: 1, backgroundColor: C.pageBg }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: insets.top + 20,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Back button ── */}
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: C.brownText,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: C.pageBg,
            opacity: pressed ? 0.7 : 1,
            marginBottom: 24,
          })}
        >
          <Text style={{ color: C.brownText, fontSize: 22 }}>{'←'}</Text>
        </Pressable>

        {/* ── Title ── */}
        <Text style={{ fontSize: 28, fontWeight: '900', color: C.brownLight, marginBottom: 6 }}>
          {t('twoFactor.title')}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: C.brownLight,
            opacity: 0.6,
            lineHeight: 22,
            marginBottom: 28,
          }}
        >
          {t('twoFactor.subtitle')}
        </Text>

        {step === 'loading' && (
          <View
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 }}
          >
            <ActivityIndicator size="large" color={C.olive} />
          </View>
        )}

        {step === 'enroll' && (
          /* ═══ QR Code Enrollment ═══ */
          <View style={{ gap: 20 }}>
            {/* Instructions */}
            <View
              style={{
                backgroundColor: C.cardBg,
                borderRadius: 32,
                padding: 24,
              }}
            >
              {/* Step indicators */}
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: C.olive,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>1</Text>
                </View>
                <Text style={{ fontSize: 15, fontWeight: '700', color: C.brownLight }}>
                  {t('twoFactor.step1')}
                </Text>
              </View>

              {/* QR code */}
              {qrUri ? (
                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                  <View
                    style={{
                      backgroundColor: '#fff',
                      padding: 16,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: C.tagBg,
                    }}
                  >
                    <Image
                      source={{ uri: qrUri }}
                      style={{ width: 200, height: 200 }}
                      resizeMode="contain"
                    />
                  </View>
                </View>
              ) : (
                <ActivityIndicator size="small" color={C.olive} style={{ marginBottom: 20 }} />
              )}

              {/* Manual secret — tap to copy */}
              <Text
                style={{
                  fontSize: 12,
                  color: C.brownLight,
                  opacity: 0.5,
                  textAlign: 'center',
                  marginBottom: 8,
                }}
              >
                {t('twoFactor.cantScan')}
              </Text>
              <Pressable
                onPress={copySecret}
                style={({ pressed }) => ({
                  backgroundColor: secretCopied ? C.green + '12' : C.inputBg,
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  borderWidth: 1,
                  borderColor: secretCopied ? C.green + '30' : 'transparent',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text
                  selectable
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: secretCopied ? C.green : C.brownLight,
                    letterSpacing: 2,
                    textAlign: 'center',
                    flex: 1,
                  }}
                >
                  {secret}
                </Text>
                <MaterialIcons
                  name={secretCopied ? 'check' : 'content-copy'}
                  size={16}
                  color={secretCopied ? C.green : C.brownText}
                />
              </Pressable>
              {secretCopied && (
                <Text style={{ fontSize: 12, color: C.green, textAlign: 'center', marginTop: 6, fontWeight: '600' }}>
                  {t('twoFactor.secretCopied')}
                </Text>
              )}
            </View>

            {/* ── Compatible authenticator apps ── */}
            <View
              style={{
                backgroundColor: C.cardBg,
                borderRadius: 32,
                padding: 24,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: C.brownLight, marginBottom: 16 }}>
                {t('twoFactor.compatibleApps')}
              </Text>
              {AUTH_APPS.map((app) => (
                <Pressable
                  key={app.name}
                  onPress={() => openAuthApp(app)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 14,
                    paddingHorizontal: 14,
                    borderRadius: 16,
                    backgroundColor: pressed ? C.inputBg : 'transparent',
                    gap: 14,
                    marginBottom: 4,
                  })}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: C.inputBg,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>{app.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: C.brownLight }}>
                      {app.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: C.brownText, opacity: 0.6, marginTop: 2 }}>
                      {t('twoFactor.tapToOpen')}
                    </Text>
                  </View>
                  <MaterialIcons name="open-in-new" size={18} color={C.brownText} />
                </Pressable>
              ))}
            </View>

            {/* Verification input */}
            <View
              style={{
                backgroundColor: C.cardBg,
                borderRadius: 32,
                padding: 24,
              }}
            >
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: C.olive,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>2</Text>
                </View>
                <Text style={{ fontSize: 15, fontWeight: '700', color: C.brownLight }}>
                  {t('twoFactor.step2')}
                </Text>
              </View>

              <TextInput
                value={code}
                onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                placeholderTextColor="rgba(0,0,0,0.2)"
                keyboardType="number-pad"
                maxLength={6}
                style={{
                  backgroundColor: C.inputBg,
                  borderRadius: 16,
                  paddingHorizontal: 20,
                  paddingVertical: Platform.OS === 'ios' ? 18 : 14,
                  fontSize: 28,
                  fontWeight: '800',
                  color: C.brownLight,
                  textAlign: 'center',
                  letterSpacing: 12,
                }}
              />

              {error && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: C.red + '12',
                    borderRadius: 14,
                    padding: 12,
                    marginTop: 14,
                  }}
                >
                  <MaterialIcons name="error-outline" size={16} color={C.red} />
                  <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: C.red }}>
                    {error}
                  </Text>
                </View>
              )}
            </View>

            {/* Verify CTA */}
            <Pressable
              onPress={verifyCode}
              disabled={loading || code.length !== 6}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                paddingVertical: 20,
                borderRadius: 35,
                backgroundColor:
                  loading || code.length !== 6 ? 'rgba(160,123,85,0.5)' : C.brown,
                opacity: pressed ? 0.9 : 1,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
                elevation: 4,
              })}
            >
              {loading ? <ActivityIndicator size="small" color="#fff" /> : null}
              <Text style={{ color: 'white', fontWeight: '800', fontSize: 18 }}>
                {t('twoFactor.verifyAndEnable')}
              </Text>
            </Pressable>
          </View>
        )}

        {step === 'recovery-codes' && (
          /* ═══ Recovery Codes Display ═══ */
          <View style={{ gap: 20 }}>
            {/* Header card */}
            <View
              style={{
                backgroundColor: C.cardBg,
                borderRadius: 32,
                padding: 24,
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: C.purple + '15',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <MaterialIcons name="vpn-key" size={36} color={C.purple} />
              </View>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: '900',
                  color: C.brownLight,
                  textAlign: 'center',
                  marginBottom: 8,
                }}
              >
                {t('twoFactor.recoveryCodesTitle')}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: C.brownLight,
                  opacity: 0.6,
                  textAlign: 'center',
                  lineHeight: 22,
                }}
              >
                {t('twoFactor.recoveryCodesSubtitle')}
              </Text>
            </View>

            {/* Warning banner */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                backgroundColor: '#FEF3C7',
                borderRadius: 16,
                padding: 14,
              }}
            >
              <MaterialIcons name="warning" size={20} color="#D97706" />
              <Text
                style={{
                  flex: 1,
                  fontSize: 13,
                  fontWeight: '600',
                  color: '#92400E',
                  lineHeight: 19,
                }}
              >
                {t('twoFactor.recoveryCodesWarning')}
              </Text>
            </View>

            {/* Codes grid */}
            <View
              style={{
                backgroundColor: C.cardBg,
                borderRadius: 24,
                padding: 20,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                {recoveryCodes.map((rc, i) => (
                  <View
                    key={i}
                    style={{
                      width: '48%',
                      backgroundColor: C.inputBg,
                      borderRadius: 12,
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: C.brownText,
                        opacity: 0.5,
                      }}
                    >
                      {i + 1}.
                    </Text>
                    <Text
                      selectable
                      style={{
                        fontSize: 15,
                        fontWeight: '800',
                        color: C.brownLight,
                        letterSpacing: 1.5,
                        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                      }}
                    >
                      {rc}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Action buttons */}
              <View
                style={{
                  flexDirection: 'row',
                  gap: 10,
                  marginTop: 18,
                }}
              >
                <Pressable
                  onPress={copyAllCodes}
                  style={({ pressed }) => ({
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    paddingVertical: 14,
                    borderRadius: 16,
                    backgroundColor: codesCopied ? C.green + '15' : C.inputBg,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <MaterialIcons
                    name={codesCopied ? 'check' : 'content-copy'}
                    size={18}
                    color={codesCopied ? C.green : C.brownText}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: codesCopied ? C.green : C.brownText,
                    }}
                  >
                    {codesCopied
                      ? t('twoFactor.recoveryCodesCopied')
                      : t('twoFactor.recoveryCodesCopy')}
                  </Text>
                </Pressable>

                {Platform.OS !== 'web' && (
                  <Pressable
                    onPress={shareCodes}
                    style={({ pressed }) => ({
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      paddingVertical: 14,
                      borderRadius: 16,
                      backgroundColor: C.inputBg,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <MaterialIcons name="share" size={18} color={C.brownText} />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: C.brownText }}>
                      {t('twoFactor.recoveryCodesShare')}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Confirmation checkbox */}
            <Pressable
              onPress={() => setCodesConfirmed(!codesConfirmed)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: 4,
              }}
            >
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: codesConfirmed ? C.green : C.brownText,
                  backgroundColor: codesConfirmed ? C.green : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {codesConfirmed && <MaterialIcons name="check" size={18} color="#fff" />}
              </View>
              <Text
                style={{
                  flex: 1,
                  fontSize: 14,
                  fontWeight: '600',
                  color: C.brownLight,
                  lineHeight: 20,
                }}
              >
                {t('twoFactor.recoveryCodesConfirm')}
              </Text>
            </Pressable>

            {/* Continue CTA */}
            <Pressable
              onPress={() => setStep('success')}
              disabled={!codesConfirmed}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                paddingVertical: 20,
                borderRadius: 35,
                backgroundColor: !codesConfirmed ? 'rgba(160,123,85,0.35)' : C.brown,
                opacity: pressed ? 0.9 : 1,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: codesConfirmed ? 0.1 : 0,
                shadowRadius: 10,
                elevation: codesConfirmed ? 4 : 0,
              })}
            >
              <Text style={{ color: 'white', fontWeight: '800', fontSize: 18 }}>
                {t('twoFactor.recoveryCodesContinue')}
              </Text>
            </Pressable>
          </View>
        )}

        {step === 'success' && (
          /* ═══ Success State ═══ */
          <View
            style={{
              backgroundColor: C.cardBg,
              borderRadius: 32,
              padding: 32,
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 88,
                height: 88,
                borderRadius: 44,
                backgroundColor: C.green + '15',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <MaterialIcons name="verified-user" size={44} color={C.green} />
            </View>
            <Text
              style={{
                fontSize: 24,
                fontWeight: '900',
                color: C.brownLight,
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              {t('twoFactor.enabled')}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: C.brownLight,
                opacity: 0.6,
                textAlign: 'center',
                lineHeight: 22,
                paddingHorizontal: 16,
                marginBottom: 28,
              }}
            >
              {t('twoFactor.enabledSubtitle')}
            </Text>

            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                paddingVertical: 20,
                borderRadius: 35,
                backgroundColor: C.brown,
                width: '100%',
                opacity: pressed ? 0.9 : 1,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
                elevation: 4,
              })}
            >
              <Text style={{ color: 'white', fontWeight: '800', fontSize: 18 }}>
                {t('twoFactor.done')}
              </Text>
            </Pressable>
          </View>
        )}

        {step === 'already-enabled' && (
          /* ═══ Already Enabled ═══ */
          <View
            style={{
              backgroundColor: C.cardBg,
              borderRadius: 32,
              padding: 28,
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: C.green + '15',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <MaterialIcons name="shield" size={40} color={C.green} />
            </View>
            <Text
              style={{
                fontSize: 22,
                fontWeight: '800',
                color: C.brownLight,
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              {t('twoFactor.alreadyEnabled')}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: C.brownLight,
                opacity: 0.6,
                textAlign: 'center',
                lineHeight: 22,
                marginBottom: 28,
              }}
            >
              {t('twoFactor.alreadyEnabledSubtitle')}
            </Text>

            {error && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: C.red + '12',
                  borderRadius: 14,
                  padding: 12,
                  marginBottom: 16,
                  width: '100%',
                }}
              >
                <MaterialIcons name="error-outline" size={16} color={C.red} />
                <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: C.red }}>
                  {error}
                </Text>
              </View>
            )}

            {/* Regenerate recovery codes */}
            <Pressable
              onPress={regenerateRecoveryCodes}
              disabled={loading}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                paddingVertical: 18,
                borderRadius: 35,
                backgroundColor: C.brown,
                width: '100%',
                opacity: pressed || loading ? 0.7 : 1,
                marginBottom: 12,
              })}
            >
              {loading ? <ActivityIndicator size="small" color="#fff" /> : null}
              <MaterialIcons name="vpn-key" size={20} color="#fff" />
              <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>
                {t('twoFactor.regenerateCodes')}
              </Text>
            </Pressable>

            {/* Disable 2FA */}
            <Pressable
              onPress={disableMfa}
              disabled={loading}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                paddingVertical: 18,
                borderRadius: 35,
                borderWidth: 1.5,
                borderColor: C.red,
                backgroundColor: 'transparent',
                width: '100%',
                opacity: pressed || loading ? 0.7 : 1,
              })}
            >
              {loading ? <ActivityIndicator size="small" color={C.red} /> : null}
              <MaterialIcons name="remove-circle-outline" size={20} color={C.red} />
              <Text style={{ color: C.red, fontWeight: '800', fontSize: 16 }}>
                {t('twoFactor.disable')}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => ({
                paddingVertical: 14,
                marginTop: 12,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: C.brownText }}>
                {t('twoFactor.goBack')}
              </Text>
            </Pressable>
          </View>
        )}

        {step === 'error' && (
          <View
            style={{
              backgroundColor: C.cardBg,
              borderRadius: 32,
              padding: 32,
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: C.red + '15',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <MaterialIcons name="error-outline" size={40} color={C.red} />
            </View>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: C.brownLight,
                textAlign: 'center',
                marginBottom: 20,
              }}
            >
              {error || t('twoFactor.setupError')}
            </Text>
            <Pressable
              onPress={() => {
                setError(null);
                setStep('loading');
                checkMfaStatus();
              }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingVertical: 18,
                paddingHorizontal: 32,
                borderRadius: 35,
                backgroundColor: C.brown,
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <MaterialIcons name="replay" size={20} color="#fff" />
              <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>
                {t('twoFactor.tryAgain')}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
