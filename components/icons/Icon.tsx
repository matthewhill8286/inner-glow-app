import Svg, { Circle, Path } from 'react-native-svg';
import type { StyleProp, ViewStyle } from 'react-native';
import { palette } from '@/constants/theme';
import { ICONS, type IconName } from './iconData';

export type { IconName } from './iconData';

type Props = {
  name: IconName;
  /** Rendered size in pt; the 24 grid scales with it, as Figma instances do. */
  size?: number;
  color?: string;
  /** Colour of the mustard "glow dot". */
  accent?: string;
  /** Overrides the set's stroke width (measured on the 24 grid). */
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function Icon({
  name,
  size = 24,
  color = palette.plum,
  accent = palette.mustard,
  strokeWidth,
  style,
  accessibilityLabel,
}: Props) {
  const def = ICONS[name];
  const sw = strokeWidth ?? def.strokeWidth;
  const paintFor = (paint: string) =>
    paint === 'accent' ? accent : paint === 'tear' ? palette.sky : color;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={style}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
    >
      {def.shapes.map((shape, i) => {
        const stroked = shape.paint === 'stroke';
        const common = {
          fill: stroked ? 'none' : paintFor(shape.paint),
          stroke: stroked ? color : undefined,
          strokeWidth: stroked ? sw : undefined,
          strokeLinecap: 'round' as const,
          strokeLinejoin: 'round' as const,
        };
        return shape.kind === 'circle' ? (
          <Circle key={i} cx={shape.cx} cy={shape.cy} r={shape.r} {...common} />
        ) : (
          <Path key={i} d={shape.d} {...common} />
        );
      })}
    </Svg>
  );
}
