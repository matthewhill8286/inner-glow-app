import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { AppButton } from '@/components/ui/AppButton';
import { LandingArt } from '@/components/onboarding/OnboardingArt';

/** Welcome landing `4002:13785` (01 §2.4). Get Started opens the consent screen. */
export default function Welcome() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top - 44, paddingBottom: insets.bottom + 24, flexGrow: 1 }} bounces={false}>
        <LandingArt />
        <View style={{ paddingHorizontal: 24, alignItems: 'center', marginTop: 4 }}>
          <Text accessibilityRole="header" style={{ ...Type.display, fontSize: 30, lineHeight: 38, letterSpacing: -1.2, color: palette.plumDeep, textAlign: 'center' }}>
            {t('onboarding.welcomeTitle')}
          </Text>
          <Text style={{ ...Type.bodySMedium, letterSpacing: -0.07, color: palette.textMuted, textAlign: 'center', marginTop: 16, maxWidth: 327, lineHeight: 20 }}>
            {t('onboarding.welcomeBody')}
          </Text>
        </View>
        <View style={{ flex: 1, minHeight: 32 }} />
        <View style={{ paddingHorizontal: 24 }}>
          <AppButton title={t('onboarding.getStarted')} size="lg" onPress={() => router.push('/(onboarding)/consent')} />
        </View>
        <Pressable accessibilityRole="link" hitSlop={8} onPress={() => router.push('/(auth)/sign-in')} style={{ alignSelf: 'center', marginTop: 20 }}>
          <Text style={{ ...Type.label, fontWeight: '700', letterSpacing: -0.2, color: palette.textMuted }}>
            {t('onboarding.haveAccount')} <Text style={{ color: palette.plum }}>{t('onboarding.signIn')}</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
