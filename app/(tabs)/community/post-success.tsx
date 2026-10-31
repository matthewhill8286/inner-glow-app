import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AppIcon from '@/components/AppIcon';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import { Typography } from '@/constants/typography';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { screenBottomPadding } from '@/lib/screen-layout';

export default function PostSuccessScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const colors = Colors[useColorScheme() ?? 'light'];
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingTop: insets.top + 24,
        paddingBottom: screenBottomPadding(insets.bottom),
      }}
    >
      <AppCard style={{ padding: 28, gap: 20, alignItems: 'center' }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            backgroundColor: colors.inputBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppIcon name="check-circle-outline" size={32} color={colors.accent} />
        </View>
        <Text
          accessibilityRole="header"
          style={[Typography.heading, { color: colors.text, textAlign: 'center' }]}
        >
          {t('communityPostSuccess.title')}
        </Text>
        <Text style={[Typography.body, { color: colors.mutedText, textAlign: 'center' }]}>
          {t('communityPostSuccess.subtitle')}
        </Text>
        <AppButton
          style={{ alignSelf: 'stretch' }}
          title={t('communityPostSuccess.seePostButton')}
          onPress={() => router.dismissTo('/(tabs)/community')}
        />
      </AppCard>
    </ScrollView>
  );
}
