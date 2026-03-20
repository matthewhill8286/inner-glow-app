import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { supabase } from '@/supabase/supabase';
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
  green: '#5B8A5A',
};

export default function ResetPassword() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function onUpdatePassword() {
    if (newPassword.length < 6) {
      setError(t('auth.passwordMinLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;
      setSuccess(true);
    } catch (err: any) {
      console.error('[ResetPassword] Error:', err);
      setError(err?.message || t('auth.passwordUpdateFailed'));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: C.pageBg,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
        }}
      >
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: C.green + '20',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 28,
          }}
        >
          <MaterialIcons name="check-circle" size={52} color={C.green} />
        </View>
        <Text
          style={{
            fontSize: 26,
            fontWeight: '900',
            color: C.brownLight,
            textAlign: 'center',
            marginBottom: 12,
          }}
        >
          {t('auth.passwordUpdated')}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: C.brownLight,
            opacity: 0.6,
            textAlign: 'center',
            lineHeight: 22,
            marginBottom: 36,
            paddingHorizontal: 20,
          }}
        >
          {t('auth.passwordUpdatedSubtitle')}
        </Text>
        <Pressable
          onPress={() => router.replace('/(auth)/sign-in')}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            paddingVertical: 20,
            paddingHorizontal: 48,
            borderRadius: 35,
            backgroundColor: C.brownDark,
            opacity: pressed ? 0.9 : 1,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 4,
          })}
        >
          <Text style={{ color: 'white', fontWeight: '800', fontSize: 17 }}>
            {t('auth.signIn')}
          </Text>
          <MaterialIcons name="login" size={18} color="#fff" />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.pageBg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: insets.top + 40,
            paddingBottom: 120,
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
                backgroundColor: C.brown + '20',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <MaterialIcons name="lock-reset" size={44} color={C.brown} />
            </View>
            <Text
              style={{
                fontSize: 28,
                fontWeight: '900',
                color: C.brownLight,
                textAlign: 'center',
              }}
            >
              {t('auth.setNewPassword')}
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
              {t('auth.setNewPasswordSubtitle')}
            </Text>
          </View>

          {/* ── Password fields ── */}
          <View
            style={{
              backgroundColor: C.cardBg,
              borderRadius: 32,
              padding: 24,
              gap: 16,
            }}
          >
            {/* New password */}
            <View>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: C.brownLight,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 8,
                }}
              >
                {t('auth.newPassword')}
              </Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder={t('auth.newPasswordPlaceholder') ?? '••••••••'}
                  placeholderTextColor="rgba(0,0,0,0.15)"
                  secureTextEntry={!showPassword}
                  autoFocus
                  style={{
                    backgroundColor: C.inputBg,
                    borderRadius: 16,
                    paddingHorizontal: 20,
                    paddingVertical: Platform.OS === 'ios' ? 18 : 14,
                    paddingRight: 52,
                    fontSize: 16,
                    fontWeight: '700',
                    color: C.brownLight,
                  }}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: 0,
                    bottom: 0,
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={22}
                    color={C.brownText}
                  />
                </Pressable>
              </View>
              <Text
                style={{
                  fontSize: 12,
                  color: C.brownText,
                  opacity: 0.5,
                  marginTop: 6,
                  marginLeft: 4,
                }}
              >
                {t('auth.passwordHint')}
              </Text>
            </View>

            {/* Confirm password */}
            <View>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: C.brownLight,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 8,
                }}
              >
                {t('auth.confirmPassword')}
              </Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder={t('auth.confirmPasswordPlaceholder') ?? '••••••••'}
                  placeholderTextColor="rgba(0,0,0,0.15)"
                  secureTextEntry={!showConfirm}
                  style={{
                    backgroundColor: C.inputBg,
                    borderRadius: 16,
                    paddingHorizontal: 20,
                    paddingVertical: Platform.OS === 'ios' ? 18 : 14,
                    paddingRight: 52,
                    fontSize: 16,
                    fontWeight: '700',
                    color: C.brownLight,
                  }}
                />
                <Pressable
                  onPress={() => setShowConfirm(!showConfirm)}
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: 0,
                    bottom: 0,
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons
                    name={showConfirm ? 'visibility-off' : 'visibility'}
                    size={22}
                    color={C.brownText}
                  />
                </Pressable>
              </View>
            </View>

            {/* Password match indicator */}
            {confirmPassword.length > 0 && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 4,
                }}
              >
                <MaterialIcons
                  name={newPassword === confirmPassword ? 'check-circle' : 'cancel'}
                  size={16}
                  color={newPassword === confirmPassword ? C.green : C.red}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: newPassword === confirmPassword ? C.green : C.red,
                  }}
                >
                  {newPassword === confirmPassword
                    ? t('auth.passwordsMatch')
                    : t('auth.passwordsDoNotMatch')}
                </Text>
              </View>
            )}
          </View>

          {/* Error */}
          {error && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: C.red + '12',
                borderRadius: 16,
                padding: 14,
                marginTop: 20,
              }}
            >
              <MaterialIcons name="error-outline" size={18} color={C.red} />
              <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: C.red }}>
                {error}
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Bottom CTA ── */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingBottom: Platform.OS === 'ios' ? 40 : 24,
          paddingTop: 16,
          backgroundColor: C.pageBg,
        }}
      >
        <Pressable
          onPress={onUpdatePassword}
          disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            paddingVertical: 20,
            borderRadius: 35,
            backgroundColor:
              loading || newPassword.length < 6 || newPassword !== confirmPassword
                ? 'rgba(62,39,35,0.35)'
                : C.brownDark,
            opacity: pressed ? 0.9 : 1,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity:
              loading || newPassword.length < 6 || newPassword !== confirmPassword ? 0 : 0.15,
            shadowRadius: 10,
            elevation:
              loading || newPassword.length < 6 || newPassword !== confirmPassword ? 0 : 4,
          })}
        >
          {loading ? <ActivityIndicator size="small" color="#fff" /> : null}
          <Text style={{ color: 'white', fontWeight: '800', fontSize: 17 }}>
            {t('auth.updatePassword')}
          </Text>
          <MaterialIcons name="lock" size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}
