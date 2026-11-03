import React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenStatusBar } from '@/components/ui/ScreenStatusBar';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { GlowField } from '@/components/glow/Glow';
import { AppButton } from '@/components/ui/AppButton';
import { useProfile } from '@/hooks/useProfile';
import { greetingName } from '@/lib/profile-stats';

/** Contour diameters and opacities around the light (06 §P13). */
const RINGS: [number, number][] = [
  [89.8, 0.26],
  [128.2, 0.2],
  [164.6, 0.14],
  [197.6, 0.08],
  [228.6, 0.04],
];

/** Feedback sent (06 §P13): the aura and light, a thank-you with the person's name, Back to Settings. */
export default function FeedbackSentScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile({ lazy: true });
  const name = greetingName(profile);
  const top = insets.top - 44;
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScreenStatusBar style="dark" />
      <GlowField
        glows={[
          { color: palette.mustard, opacity: 0.28, x: 57, y: 170 + top, width: 260, blur: 80 },
          { color: palette.lavenderSoft, opacity: 0.3, x: 107, y: 220 + top, width: 160, blur: 50 },
        ]}
      />
      <View style={{ alignItems: 'center', marginTop: top + 156 }}>
        <Svg width={288} height={288}>
          <Defs>
            <RadialGradient id="sentLight" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={palette.cream} />
              <Stop offset="0.6" stopColor={palette.gold} stopOpacity={0.9} />
              <Stop offset="1" stopColor={palette.gold} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          {RINGS.map(([d, o]) => (
            <Circle key={d} cx={144} cy={144} r={d / 2} stroke={palette.plum} strokeOpacity={o} strokeWidth={1} fill="none" />
          ))}
          <Circle cx={144} cy={144} r={40} fill="url(#sentLight)" />
        </Svg>
        <Text accessibilityRole="header" style={[Type.titleLg, { fontSize: 28, lineHeight: 34, color: palette.ink, marginTop: 6, textAlign: 'center' }]}>
          {name ? t('feedbackFlow.thanksName', { name }) : t('feedbackFlow.thanks')}
        </Text>
        <Text style={[Type.body, { fontWeight: '400', lineHeight: 22, color: palette.textMuted, textAlign: 'center', marginTop: 10, maxWidth: 279 }]}>
          {t('feedbackFlow.sentBody')}
        </Text>
      </View>
      <View style={{ position: 'absolute', left: 24, right: 24, bottom: insets.bottom + 24 }}>
        <AppButton title={t('feedbackFlow.backToSettings')} onPress={() => router.dismissTo('/(tabs)/profile/settings')} />
      </View>
    </View>
  );
}
