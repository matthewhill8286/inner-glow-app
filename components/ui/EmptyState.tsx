import React from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Glow } from '@/components/glow/Glow';

/** Aura contour diameters and opacities, inside out (09 §2.4). */
const AURA = [
  { d: 41.2, o: 0.3 },
  { d: 67, o: 0.25 },
  { d: 91, o: 0.2 },
  { d: 112.4, o: 0.15 },
  { d: 131.6, o: 0.1 },
];

/**
 * Shared empty state (09 §2.4): 160 illustration with a per-screen glow, five
 * aura contours and a gold core, then a SemiBold 22 title and Regular 14 body.
 * The Figma contours are wobbly; plain circles stand in until the SVG export lands.
 */
export function EmptyState({
  glowColor,
  title,
  body,
  children,
  style,
}: {
  glowColor: string;
  title: string;
  body: string;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ alignItems: 'center', paddingTop: 40, paddingBottom: 8, gap: 12 }, style]}>
      <View style={{ width: 160, height: 160 }}>
        <Glow color={glowColor} opacity={0.35} width={128} blur={40} style={{ position: 'absolute', left: 16, top: 16 }} />
        <Svg width={160} height={160} style={{ position: 'absolute' }}>
          <Defs>
            <RadialGradient id="emptyCore" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={palette.cream} />
              <Stop offset="1" stopColor={palette.gold} />
            </RadialGradient>
          </Defs>
          {AURA.map((a) => (
            <Circle key={a.d} cx={80} cy={80} r={a.d / 2} stroke={palette.plum} strokeOpacity={a.o} strokeWidth={1} fill="none" />
          ))}
          <Circle cx={80} cy={80} r={11} fill="url(#emptyCore)" />
        </Svg>
      </View>
      <Text accessibilityRole="header" style={[Type.titleMd, { color: palette.ink, textAlign: 'center' }]}>
        {title}
      </Text>
      <Text style={[Type.bodySm, { color: palette.textMuted, textAlign: 'center' }]}>{body}</Text>
      {children}
    </View>
  );
}
