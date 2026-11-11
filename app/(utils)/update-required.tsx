import React from 'react';
import { Linking, Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Svg, { Circle } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { GlowField } from '@/components/glow/Glow';
import { Icon } from '@/components/icons/Icon';
import { AppButton } from '@/components/ui/AppButton';
import { ScreenStatusBar } from '@/components/ui/ScreenStatusBar';

const STORE_URL =
  Platform.OS === 'ios'
    ? 'itms-apps://apps.apple.com/app/id6760898488'
    : 'market://details?id=com.innerglowai.app';

/**
 * Time for a fresh glow (`6832:8215`): shown instead of the app when this build is below the minimum
 * in `app_config`. There's no way past it except Update now.
 */
export default function UpdateRequired() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScreenStatusBar style="dark" />
      <GlowField
        glows={[
          { color: palette.lavenderSoft, opacity: 0.4, x: 62.5, y: 160, width: 250, blur: 60 },
          { color: palette.mustard, opacity: 0.3, x: 147.5, y: 220, width: 160, blur: 50 },
        ]}
      />
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}
      >
        <View style={{ width: 200, height: 200, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={200} height={200} style={{ position: 'absolute' }}>
            {[96, 84, 72, 60].map((r, i) => (
              <Circle
                key={r}
                cx={100}
                cy={100}
                r={r}
                stroke={palette.plum}
                strokeOpacity={0.12 + i * 0.08}
                strokeWidth={1}
                fill="none"
              />
            ))}
          </Svg>
          <Icon name="line/moon" size={64} color={palette.gold} />
        </View>
        <Text
          accessibilityRole="header"
          style={[
            Type.titleLg,
            { fontSize: 26, color: palette.ink, textAlign: 'center', marginTop: 40 },
          ]}
        >
          {t('updateRequired.title')}
        </Text>
        <Text
          style={[
            Type.bodySm,
            {
              lineHeight: 20,
              color: palette.textMuted,
              textAlign: 'center',
              marginTop: 11,
              maxWidth: 300,
            },
          ]}
        >
          {t('updateRequired.body')}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginTop: 24,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: palette.selected,
          }}
        >
          <Icon name="line/download" size={14} color={palette.plum} />
          <Text style={[Type.caption, { fontWeight: '600', color: palette.plum }]}>
            {t('updateRequired.chip')}
          </Text>
        </View>
      </View>
      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 24 }}>
        <AppButton
          title={t('updateRequired.cta')}
          onPress={() => void Linking.openURL(STORE_URL)}
        />
      </View>
    </View>
  );
}
