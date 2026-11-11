import React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { GlowField } from '@/components/glow/Glow';
import { Icon } from '@/components/icons/Icon';
import { AppButton } from '@/components/ui/AppButton';
import { ScreenStatusBar } from '@/components/ui/ScreenStatusBar';

/**
 * Account deleted (`6801:7048`): the soft danger orb with a heart, the confirmation, the reminder
 * to cancel Pro in the App Store, a thank-you, and Close.
 */
export default function AccountDeleted() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const top = insets.top - 44;
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScreenStatusBar style="dark" />
      <GlowField
        glows={[
          { color: palette.lavenderSoft, opacity: 0.3, x: -70, y: -50 + top, width: 280, blur: 90 },
          { color: palette.dangerSoft, opacity: 0.6, x: 200, y: 40 + top, width: 220, blur: 90 },
        ]}
      />
      <View style={{ alignItems: 'center', marginTop: top + 220, paddingHorizontal: 24, gap: 24 }}>
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: palette.dangerSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="line/heart" size={36} color={palette.plum} />
        </View>
        <Text accessibilityRole="header" style={[Type.titleLg, { fontSize: 30, color: palette.ink, textAlign: 'center' }]}>
          {t('accountDeleted.title')}
        </Text>
        <Text style={[Type.body, { fontWeight: '400', lineHeight: 21, color: palette.textMuted, textAlign: 'center' }]}>
          {t('accountDeleted.body')}
        </Text>
        <Text style={[Type.body, { fontSize: 14, fontWeight: '500', lineHeight: 20, color: palette.plum, textAlign: 'center' }]}>
          {t('accountDeleted.thanks')}
        </Text>
      </View>
      <View style={{ position: 'absolute', left: 24, right: 24, bottom: insets.bottom + 24 }}>
        <AppButton title={t('accountDeleted.close')} onPress={() => router.replace('/(onboarding)/welcome')} />
      </View>
    </View>
  );
}
