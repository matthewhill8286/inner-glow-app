import React from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Glow } from '@/components/glow/Glow';
import AuraArt from '@/assets/svg/illustrations/empty/aura.svg';

/**
 * Empty state block shared by six screens (09 §2.4, 00-foundations §11.7). Column, padding 40 top and
 * 8 bottom, gap 12, centred. The 160 illustration is a 128 glow (`glowColor` @0.35, blur 40), the aura
 * contours `6787:8542` and a 22 core with a `#FFF6D6` → gold radial gradient. Title SemiBold 22 ink,
 * body Regular 14 muted. `children` is the action slot (usually a primary button).
 */
export function EmptyState({
  glowColor = palette.mustard,
  title,
  body,
  children,
  style,
}: {
  glowColor?: string;
  title: string;
  body?: string;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ paddingTop: 40, paddingBottom: 8, gap: 12, alignItems: 'center' }, style]}>
      <View style={{ width: 160, height: 160 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Glow color={glowColor} opacity={0.35} width={128} blur={40} style={{ position: 'absolute', left: 16, top: 16 }} />
        <AuraArt width={160} height={160} style={{ position: 'absolute' }} />
        <Svg width={22} height={22} style={{ position: 'absolute', left: 69, top: 69 }}>
          <Defs>
            <RadialGradient id="emptyCore" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={palette.cream} />
              <Stop offset="1" stopColor={palette.gold} />
            </RadialGradient>
          </Defs>
          <Circle cx={11} cy={11} r={11} fill="url(#emptyCore)" />
        </Svg>
      </View>
      <Text accessibilityRole="header" style={[Type.titleMd, { color: palette.ink, textAlign: 'center' }]}>
        {title}
      </Text>
      {body ? <Text style={[Type.bodySm, { color: palette.textMuted, textAlign: 'center' }]}>{body}</Text> : null}
      {children ? <View style={{ alignSelf: 'stretch', marginTop: 12 }}>{children}</View> : null}
    </View>
  );
}
