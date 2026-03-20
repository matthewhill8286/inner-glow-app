import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { supabase } from '@/supabase/supabase';
import { authTokenVar } from '@/lib/state';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

/* ── Design tokens (matches Figma assessment palette) ── */
const C = {
  pageBg: '#F7F4F2',
  cardBg: '#FFFFFF',
  brown: '#a07b55',
  brownText: '#96784E',
  brownLight: '#6a5e55',
  inputBg: '#f2ece6',
  tagBg: '#E8DDD9',
  red: '#C45B5B',
  olive: '#828a6a',
};

export default function SignUp() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCreate() {
    if (!email || !pass) {
      setError(t('auth.emailPasswordRequired'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: { display_name: name.trim() || undefined },
        },
      });

      if (error) throw error;
      if (!data.session && !data.user) throw new Error('Failed to create account');

      const { session } = data;
      const token = session?.access_token || '';
      if (token) authTokenVar(token);
      router.replace('/(onboarding)/assessment');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
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
          paddingTop: insets.top + 24,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Branding area ── */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: C.olive,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <MaterialIcons name="favorite" size={32} color="#fff" />
          </View>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '900',
              color: C.brownLight,
              textAlign: 'center',
            }}
          >
            {t('auth.createYourAccount')}
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: C.brownLight,
              opacity: 0.7,
              marginTop: 6,
              textAlign: 'center',
              paddingHorizontal: 16,
            }}
          >
            {t('auth.signUpSubtitle')}
          </Text>
        </View>

        {/* ── Form Card ── */}
        <View
          style={{
            backgroundColor: C.cardBg,
            borderRadius: 32,
            padding: 24,
            paddingTop: 28,
          }}
        >
          {/* Error banner */}
          {error && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: C.red + '12',
                borderRadius: 16,
                padding: 14,
                marginBottom: 20,
              }}
            >
              <MaterialIcons name="error-outline" size={18} color={C.red} />
              <Text
                style={{ flex: 1, fontSize: 13, fontWeight: '600', color: C.red }}
              >
                {error}
              </Text>
            </View>
          )}

          {/* Name */}
          <Text style={labelStyle}>{t('auth.name')}</Text>
          <View style={inputWrap}>
            <MaterialIcons
              name="person-outline"
              size={18}
              color={C.brownText}
              style={{ marginRight: 10 }}
            />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t('auth.namePlaceholder')}
              placeholderTextColor="rgba(0,0,0,0.3)"
              style={inputField}
              autoCapitalize="words"
              autoComplete="name"
            />
          </View>

          {/* Email */}
          <Text style={[labelStyle, { marginTop: 18 }]}>{t('auth.email')}</Text>
          <View style={inputWrap}>
            <MaterialIcons
              name="mail-outline"
              size={18}
              color={C.brownText}
              style={{ marginRight: 10 }}
            />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.emailPlaceholder')}
              placeholderTextColor="rgba(0,0,0,0.3)"
              style={inputField}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          {/* Password */}
          <Text style={[labelStyle, { marginTop: 18 }]}>{t('auth.password')}</Text>
          <View style={inputWrap}>
            <MaterialIcons
              name="lock-outline"
              size={18}
              color={C.brownText}
              style={{ marginRight: 10 }}
            />
            <TextInput
              value={pass}
              onChangeText={setPass}
              placeholder={t('auth.createPasswordPlaceholder')}
              placeholderTextColor="rgba(0,0,0,0.3)"
              style={inputField}
              secureTextEntry={!showPass}
              autoComplete="new-password"
            />
            <Pressable onPress={() => setShowPass(!showPass)} hitSlop={8}>
              <MaterialIcons
                name={showPass ? 'visibility' : 'visibility-off'}
                size={20}
                color={C.brownText}
              />
            </Pressable>
          </View>

          {/* Password hint */}
          <Text
            style={{
              fontSize: 12,
              color: C.brownLight,
              opacity: 0.5,
              marginTop: 8,
              marginLeft: 4,
            }}
          >
            {t('auth.passwordHint')}
          </Text>
        </View>

        {/* ── CTA Button ── */}
        <Pressable
          onPress={onCreate}
          disabled={loading}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            paddingVertical: 20,
            borderRadius: 35,
            backgroundColor: loading ? 'rgba(160,123,85,0.5)' : C.brown,
            marginTop: 28,
            opacity: pressed ? 0.9 : 1,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 4,
          })}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : null}
          <Text style={{ color: 'white', fontWeight: '800', fontSize: 18 }}>
            {loading ? t('auth.creatingAccount') : t('auth.createAccountBtn')}
          </Text>
        </Pressable>

        {/* ── Terms ── */}
        <Text
          style={{
            fontSize: 12,
            color: C.brownLight,
            opacity: 0.5,
            textAlign: 'center',
            marginTop: 16,
            paddingHorizontal: 12,
            lineHeight: 18,
          }}
        >
          {t('auth.termsAndPrivacy')}
        </Text>

        {/* ── Footer link ── */}
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <Pressable
            onPress={() => router.navigate('/(auth)/sign-in')}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: C.brownLight }}>
              {t('auth.alreadyHaveAccountShort')}{' '}
              <Text style={{ color: C.brown, textDecorationLine: 'underline' }}>
                {t('auth.signIn')}
              </Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ── Shared styles ── */
const labelStyle = {
  fontSize: 12,
  fontWeight: '700' as const,
  color: C.brownLight,
  textTransform: 'uppercase' as const,
  letterSpacing: 0.5,
  marginBottom: 8,
};

const inputWrap = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  backgroundColor: C.inputBg,
  borderRadius: 16,
  paddingHorizontal: 14,
  paddingVertical: Platform.OS === 'ios' ? 14 : 10,
};

const inputField = {
  flex: 1,
  fontSize: 15,
  fontWeight: '600' as const,
  color: '#1B1A18',
};
