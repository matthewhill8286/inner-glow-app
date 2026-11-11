import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { GlowField } from '@/components/glow/Glow';
import { Icon, type IconName } from '@/components/icons/Icon';
import { NavBar } from '@/components/ui/IconButton';
import { LegalNote } from '@/components/ui/controls';
import { AppButton } from '@/components/ui/AppButton';
import { ScreenStatusBar } from '@/components/ui/ScreenStatusBar';
import { backTo } from '@/lib/navigation';
import { screenBottomPadding } from '@/lib/screen-layout';
import { SourcesLink } from '@/components/SourcesLink';

const INPUTS: { key: string; icon: IconName }[] = [
  { key: 'mood', icon: 'line/heart' },
  { key: 'sleep', icon: 'line/moon' },
  { key: 'practices', icon: 'line/meditate' },
  { key: 'stress', icon: 'line/activity' },
  { key: 'reflection', icon: 'line/journal' },
];

/**
 * How the Glow score works (`6832:9550`): the five inputs over the last 7 days, a "Good to know"
 * note, the self-reflection disclaimer and Got it.
 */
export default function AboutGlowScore() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const close = () => backTo(undefined, '/(tabs)/freud-score');
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScreenStatusBar style="dark" />
      <GlowField
        glows={[
          { color: palette.mustard, opacity: 0.3, x: -70, y: -50, width: 280, blur: 90 },
          { color: palette.lavenderSoft, opacity: 0.3, x: 200, y: 40, width: 220, blur: 90 },
        ]}
      />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 10,
          paddingHorizontal: 24,
          paddingBottom: screenBottomPadding(insets.bottom) + 80,
        }}
      >
        <NavBar backLabel={t('common.back')} onBack={close} title={t('aboutScore.nav')} />
        <Text
          accessibilityRole="header"
          style={[
            Type.titleLg,
            { fontSize: 30, lineHeight: 36, color: palette.ink, marginTop: 16 },
          ]}
        >
          {t('aboutScore.title')}
        </Text>
        <Text
          style={[
            Type.body,
            { fontWeight: '400', lineHeight: 21, color: palette.plumDeep, marginTop: 10 },
          ]}
        >
          {t('aboutScore.intro')}
        </Text>
        <Text
          style={[
            Type.captionS,
            { fontWeight: '600', color: palette.lavender, marginTop: 24, marginBottom: 8 },
          ]}
        >
          {t('aboutScore.looksAt')}
        </Text>
        <View style={{ borderRadius: 24, backgroundColor: palette.white, paddingHorizontal: 16 }}>
          {INPUTS.map((input, i) => (
            <View
              key={input.key}
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
                <Icon name={input.icon} size={18} color={palette.plum} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[Type.bodyMSemi, { fontWeight: '500', color: palette.ink }]}>
                  {t(`aboutScore.inputs.${input.key}.title`)}
                </Text>
                <Text style={[Type.captionS, { color: palette.textMuted }]}>
                  {t(`aboutScore.inputs.${input.key}.body`)}
                </Text>
              </View>
            </View>
          ))}
        </View>
        <Text
          style={[Type.captionS, { fontWeight: '600', color: palette.lavender, marginTop: 24 }]}
        >
          {t('aboutScore.goodToKnow')}
        </Text>
        <Text
          style={[
            Type.body,
            { fontWeight: '400', lineHeight: 21, color: palette.plumDeep, marginTop: 8 },
          ]}
        >
          {t('aboutScore.goodToKnowBody')}
        </Text>
        <LegalNote text={t('aboutScore.disclaimer')} style={{ marginTop: 20 }} />
        <SourcesLink topic="score" style={{ marginTop: 10 }} />
      </ScrollView>
      <View
        style={{
          position: 'absolute',
          left: 24,
          right: 24,
          bottom: screenBottomPadding(insets.bottom) - 4,
        }}
      >
        <AppButton title={t('aboutScore.gotIt')} onPress={close} />
      </View>
    </View>
  );
}
