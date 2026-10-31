import Svg, { Circle } from 'react-native-svg';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { palette } from '@/constants/theme';

/**
 * INNER GLOW "Halo" mark from Figma `6572:1591` (00-foundations §6, 01 §2):
 * halo disc 0.6S, core disc 0.3S, ring 0.72S with a 0.05S stroke.
 */
type MarkProps = {
  size?: number;
  /** `mono` draws all three shapes in ink, as the small marks in the logo sheet do. */
  variant?: 'colour' | 'mono';
  ringColor?: string;
  coreColor?: string;
  style?: StyleProp<ViewStyle>;
};

export function LogoMark({ size = 56, variant = 'colour', ringColor, coreColor, style }: MarkProps) {
  const core = coreColor ?? (variant === 'mono' ? palette.ink : palette.mustard);
  const ring = ringColor ?? (variant === 'mono' ? palette.ink : palette.plum);
  const c = size / 2;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={style} accessibilityLabel="INNER GLOW">
      <Circle cx={c} cy={c} r={size * 0.3} fill={core} fillOpacity={0.22} />
      <Circle cx={c} cy={c} r={size * 0.15} fill={core} />
      <Circle cx={c} cy={c} r={size * 0.36} stroke={ring} strokeWidth={size * 0.05} fill="none" />
    </Svg>
  );
}

/** Horizontal lockup `6572:1606`: mark + 14/56 gap + "inner glow" SemiBold 40/56 ls −3%. */
export function LogoLockup({ markSize = 36, color = palette.plumDeep, style }: { markSize?: number; color?: string; style?: StyleProp<ViewStyle> }) {
  const fontSize = (markSize * 40) / 56;
  return (
    <View style={[styles.row, { gap: (markSize * 14) / 56 }, style]} accessibilityRole="image" accessibilityLabel="inner glow">
      <LogoMark size={markSize} />
      <Text style={[styles.word, { fontSize, letterSpacing: fontSize * -0.03, color }]}>inner glow</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  word: { fontFamily: 'Urbanist', fontWeight: '600' },
});
