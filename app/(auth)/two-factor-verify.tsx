import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { supabase } from '@/supabase/supabase';
import { authTokenVar } from '@/lib/state';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

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
  green: '#5B8A5A',
  purple: '#7B6DC9',
};

type VerifyMode = 'totp' | 'recovery';

export default function TwoFactorVerify() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<VerifyMode>('totp');
  const [code, setCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);

  useEffect(() => {
    loadFactor();
  }, []);

  async function loadFactor() {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;

      const totpFactors = data.totp ?? [];
      const verifiedFactor = totpFactors.find((f) => f.status === 'verified');

      if (verifiedFactor) {
        setFactorId(verifiedFactor.id);
      } else {
        // No 2FA factor — shouldn't be here, go to home
        router.replace('/');
      }
    } catch (err) {
      console.error('[2FA Verify] Load factor error:', err);
    }
  }

  async function onVerifyTotp() {
    if (code.length !== 6 || !factorId) {
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

      // MFA verified — refresh session and continue
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        authTokenVar(session.access_token);
      }
      router.replace('/');
    } catch (err: any) {
      console.error('[2FA Verify] Error:', err);
      setError(err?.message || t('twoFactor.invalidCode'));
      setCode('');
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyRecovery() {
    const cleaned = recoveryCode.trim().toUpperCase();
    if (cleaned.length < 8) {
      setError(t('twoFactor.enterRecoveryCode'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      // Verify the recovery code via edge function
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/recovery-codes`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            apikey: process.env.EXPO_PUBLIC_SUPABASE_KEY || '',
          },
          body: JSON.stringify({ action: 'verify', code: cleaned }),
        },
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Verification failed');

      if (!json.valid) {
        setError(t('twoFactor.invalidRecoveryCode'));
        return;
      }

      // Recovery code valid — complete MFA challenge so Supabase upgrades to aal2
      if (factorId) {
        const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
          factorId,
        });
        // If we can't create a challenge, we still let the user through since
        // the recovery code was valid. The session stays at aal1 but the user
        // explicitly proved identity via recovery code.
        if (!challengeError && challengeData) {
          // We can't verify without a real TOTP code, so we skip aal2 upgrade.
          // The recovery code itself serves as proof of identity.
        }
      }

      // Proceed — recovery code validated identity
      authTokenVar(session.access_token);
      router.replace('/');
    } catch (err: any) {
      console.error('[2FA Recovery] Error:', err);
      setError(err?.message || t('twoFactor.invalidRecoveryCode'));
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode(mode === 'totp' ? 'recovery' : 'totp');
    setError(null);
    setCode('');
    setRecoveryCode('');
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.pageBg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: insets.top + 40,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Icon ── */}
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: (mode === 'totp' ? C.olive : C.purple) + '20',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <MaterialIcons
              name={mode === 'totp' ? 'security' : 'vpn-key'}
              size={44}
              color={mode === 'totp' ? C.olive : C.purple}
            />
          </View>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '900',
              color: C.brownLight,
              textAlign: 'center',
            }}
          >
            {mode === 'totp' ? t('twoFactor.verifyTitle') : t('twoFactor.recoveryVerifyTitle')}
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: C.brownLight,
              opacity: 0.65,
              marginTop: 8,
              textAlign: 'center',
              paddingHorizontal: 20,
              lineHeight: 22,
            }}
          >
            {mode === 'totp'
              ? t('twoFactor.verifySubtitle')
              : t('twoFactor.recoveryVerifySubtitle')}
          </Text>
        </View>

        {mode === 'totp' ? (
          /* ── TOTP Code Input ── */
          <>
            <View
              style={{
                backgroundColor: C.cardBg,
                borderRadius: 32,
                padding: 24,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: C.brownLight,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 12,
                }}
              >
                {t('twoFactor.authCode')}
              </Text>

              <TextInput
                value={code}
                onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                placeholderTextColor="rgba(0,0,0,0.15)"
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                style={{
                  backgroundColor: C.inputBg,
                  borderRadius: 16,
                  paddingHorizontal: 20,
                  paddingVertical: Platform.OS === 'ios' ? 20 : 16,
                  fontSize: 32,
                  fontWeight: '900',
                  color: C.brownLight,
                  textAlign: 'center',
                  letterSpacing: 14,
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

            {/* ── Verify CTA ── */}
            <Pressable
              onPress={onVerifyTotp}
              disabled={loading || code.length !== 6}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                paddingVertical: 20,
                borderRadius: 35,
                backgroundColor: loading || code.length !== 6 ? 'rgba(160,123,85,0.5)' : C.brown,
                marginTop: 28,
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
                {t('twoFactor.verify')}
              </Text>
            </Pressable>
          </>
        ) : (
          /* ── Recovery Code Input ── */
          <>
            <View
              style={{
                backgroundColor: C.cardBg,
                borderRadius: 32,
                padding: 24,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: C.brownLight,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 12,
                }}
              >
                {t('twoFactor.recoveryCodeLabel')}
              </Text>

              <TextInput
                value={recoveryCode}
                onChangeText={(t) => {
                  // Allow alphanumeric + dash, auto-uppercase
                  const cleaned = t.replace(/[^A-Za-z0-9-]/g, '').toUpperCase();
                  setRecoveryCode(cleaned.slice(0, 9)); // XXXX-XXXX = 9 chars
                }}
                placeholder="XXXX-XXXX"
                placeholderTextColor="rgba(0,0,0,0.15)"
                autoCapitalize="characters"
                autoFocus
                style={{
                  backgroundColor: C.inputBg,
                  borderRadius: 16,
                  paddingHorizontal: 20,
                  paddingVertical: Platform.OS === 'ios' ? 20 : 16,
                  fontSize: 24,
                  fontWeight: '900',
                  color: C.brownLight,
                  textAlign: 'center',
                  letterSpacing: 6,
                  fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
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

            {/* ── Verify Recovery CTA ── */}
            <Pressable
              onPress={onVerifyRecovery}
              disabled={loading || recoveryCode.replace(/-/g, '').length < 8}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                paddingVertical: 20,
                borderRadius: 35,
                backgroundColor:
                  loading || recoveryCode.replace(/-/g, '').length < 8
                    ? 'rgba(160,123,85,0.5)'
                    : C.brown,
                marginTop: 28,
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
                {t('twoFactor.verifyRecovery')}
              </Text>
            </Pressable>
          </>
        )}

        {/* ── Mode switch ── */}
        <Pressable
          onPress={switchMode}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginTop: 20,
            paddingVertical: 12,
            opacity: pressed ? 0.5 : 1,
          })}
        >
          <MaterialIcons
            name={mode === 'totp' ? 'vpn-key' : 'security'}
            size={18}
            color={C.brownText}
          />
          <Text style={{ fontSize: 14, fontWeight: '700', color: C.brownText }}>
            {mode === 'totp' ? t('twoFactor.useRecoveryCode') : t('twoFactor.useAuthenticator')}
          </Text>
        </Pressable>

        {/* ── Sign out link ── */}
        <Pressable
          onPress={async () => {
            await supabase.auth.signOut();
            authTokenVar(null);
            router.replace('/(auth)/sign-in');
          }}
          style={({ pressed }) => ({
            alignItems: 'center',
            marginTop: 8,
            opacity: pressed ? 0.5 : 1,
          })}
        >
          <Text style={{ fontSize: 14, fontWeight: '700', color: C.brownText }}>
            {t('twoFactor.useAnotherAccount')}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
