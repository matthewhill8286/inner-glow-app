import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { GlowField } from '@/components/glow/Glow';
import { Icon, type IconName } from '@/components/icons/Icon';
import { AppButton } from '@/components/ui/AppButton';
import { ScreenStatusBar } from '@/components/ui/ScreenStatusBar';
import { useYearlyPrice } from '@/hooks/useYearlyPrice';
import { FREE_TALKS_PER_WEEK } from '@/lib/talks';

/** What the free plan limits, matching the app's real gates rather than the frame's sample values. */
const ROWS: { key: string; icon: IconName }[] = [
  { key: 'glowAi', icon: 'line/sparkle' },
  { key: 'reflections', icon: 'line/journal' },
  { key: 'suggestions', icon: 'line/leaf' },
  { key: 'voice', icon: 'line/mic' },
];

/**
 * Pro has ended (`6809:7083`): shown once when Pro or the trial expires. The crown orb, the title,
 * a card listing what is now limited, "Renew Pro" and "Continue with free".
 */
export default function ProEnded() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const price = useYearlyPrice();
  const close = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'));
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScreenStatusBar style="dark" />
      <GlowField
        glows={[
          { color: palette.lavenderSoft, opacity: 0.3, x: -70, y: -50, width: 280, blur: 90 },
          { color: palette.mustard, opacity: 0.25, x: 200, y: 40, width: 220, blur: 90 },
        ]}
      />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 76, paddingHorizontal: 24, paddingBottom: 160, alignItems: 'center' }}>
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: palette.selected,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="line/crown" size={36} color={palette.plum} />
        </View>
        <Text accessibilityRole="header" style={[Type.titleLg, { fontSize: 30, color: palette.ink, textAlign: 'center', marginTop: 24 }]}>
          {t('proEnded.title')}
        </Text>
        <Text style={[Type.body, { fontWeight: '400', lineHeight: 21, color: palette.textMuted, textAlign: 'center', marginTop: 16 }]}>
          {t('proEnded.body')}
        </Text>
        <View style={{ alignSelf: 'stretch', marginTop: 24, borderRadius: 24, backgroundColor: palette.white, paddingHorizontal: 16 }}>
          {ROWS.map((row, i) => (
            <View
              key={row.key}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 12,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: palette.borderLilac,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: palette.selected,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name={row.icon} size={18} color={palette.plum} />
              </View>
              <Text style={[Type.bodyMSemi, { flex: 1, fontWeight: '500', color: palette.ink }]}>
                {t(`proEnded.rows.${row.key}.label`)}
              </Text>
              <Text style={[Type.captionM, { color: palette.textMuted }]}>
                {t(`proEnded.rows.${row.key}.value`, { count: FREE_TALKS_PER_WEEK })}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={{ position: 'absolute', left: 24, right: 24, bottom: insets.bottom + 24, gap: 16 }}>
        <AppButton
          title={price ? t('proEnded.renewWithPrice', { price }) : t('proEnded.renew')}
          onPress={() => router.replace({ pathname: '/(utils)/trial-upgrade', params: { variant: 'home' } })}
        />
        <Pressable accessibilityRole="button" hitSlop={8} onPress={close}>
          <Text style={[Type.body, { fontSize: 14, fontWeight: '600', color: palette.plum, textAlign: 'center' }]}>
            {t('proEnded.continueFree')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
