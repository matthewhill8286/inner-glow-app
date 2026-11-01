import { useEffect } from 'react';
import {
  StyleSheet,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Blur, Canvas, Circle, Group, Oval, vec } from '@shopify/react-native-skia';
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { palette } from '@/constants/theme';
import { Icon } from '@/components/icons/Icon';
import { useAccessibilityPrefs, useGlowOpacity } from '@/lib/accessibility-prefs';

/**
 * Figma glows are ellipses with a low-opacity solid fill and a LAYER_BLUR
 * (00-foundations §3.2–3.3). Skia's blur takes a Gaussian sigma, and a Figma
 * blur radius is roughly two sigmas, so `sigma = blur / 2`.
 */
export type GlowSpec = {
  color: string;
  opacity: number;
  /** Top-left of the ellipse in Figma frame coordinates (375pt wide frame). */
  x: number;
  y: number;
  width: number;
  height?: number;
  /** Figma LAYER_BLUR radius. */
  blur: number;
};

const DESIGN_WIDTH = 375;

/**
 * All glows for one screen in a single Skia canvas behind the content.
 * Horizontal positions scale with the window width; vertical ones stay as designed.
 */
export function GlowField({
  glows,
  style,
  scaleToWidth = true,
}: {
  glows: GlowSpec[];
  style?: StyleProp<ViewStyle>;
  scaleToWidth?: boolean;
}) {
  const { width } = useWindowDimensions();
  const sx = scaleToWidth ? width / DESIGN_WIDTH : 1;
  const glowOpacity = useGlowOpacity();
  return (
    <Canvas style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      {glows.map((g, i) => (
        <Oval
          key={i}
          x={g.x * sx}
          y={g.y}
          width={g.width * sx}
          height={g.height ?? g.width}
          color={g.color}
          opacity={glowOpacity(g.opacity)}
        >
          <Blur blur={g.blur / 2} />
        </Oval>
      ))}
    </Canvas>
  );
}

/**
 * A single glow inside a component (tab active glow, knobs). The canvas is
 * padded by 1.5× the blur so the blur is not clipped; the view keeps the
 * ellipse's own size, so it can be positioned like the Figma node.
 */
export function Glow({
  color,
  opacity,
  width,
  height,
  blur,
  style,
}: Omit<GlowSpec, 'x' | 'y'> & { style?: StyleProp<ViewStyle> }) {
  const h = height ?? width;
  const pad = blur * 1.5;
  const glowOpacity = useGlowOpacity();
  return (
    <View pointerEvents="none" style={[{ width, height: h }, style]}>
      <Canvas
        style={{
          position: 'absolute',
          left: -pad,
          top: -pad,
          width: width + pad * 2,
          height: h + pad * 2,
        }}
      >
        <Oval x={pad} y={pad} width={width} height={h} color={color} opacity={glowOpacity(opacity)}>
          <Blur blur={blur / 2} />
        </Oval>
      </Canvas>
    </View>
  );
}

/**
 * Parametric Glow AI orb (05 §2.1). All layers scale from the outer diameter S.
 * `breathing` runs the suggested idle motion (0.96 → 1.04 over ~4 s) on the outer and blue layers.
 */
export function GlowOrb({
  size,
  showIcon = true,
  breathing = true,
  style,
}: {
  size: number;
  showIcon?: boolean;
  breathing?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const pad = size * 0.4;
  const box = size + pad * 2;
  const c = box / 2;
  const progress = useSharedValue(0);
  const reduceMotion = useAccessibilityPrefs((s) => s.reduceMotion);

  useEffect(() => {
    if (!breathing || reduceMotion) {
      progress.value = 0.5;
      return;
    }
    progress.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [breathing, reduceMotion, progress]);

  const breathe = useDerivedValue(() => [{ scale: 0.96 + 0.08 * progress.value }]);

  return (
    <View pointerEvents="none" style={[{ width: size, height: size }, style]}>
      <Canvas style={{ position: 'absolute', left: -pad, top: -pad, width: box, height: box }}>
        <Group origin={vec(c, c)} transform={breathe}>
          <Circle cx={c} cy={c} r={size / 2} color={palette.lavenderSoft} opacity={0.5}>
            <Blur blur={(size * 0.21) / 2} />
          </Circle>
          <Circle
            cx={c + size * 0.105}
            cy={c + size * 0.053}
            r={(size * 0.684) / 2}
            color={palette.sky}
            opacity={0.35}
          >
            <Blur blur={(size * 0.158) / 2} />
          </Circle>
        </Group>
        <Circle cx={c} cy={c} r={(size * 0.579) / 2} color={palette.mustard} opacity={0.6}>
          <Blur blur={(size * 0.116) / 2} />
        </Circle>
        <Circle cx={c} cy={c} r={(size * 0.326) / 2} color={palette.cream} opacity={0.95}>
          <Blur blur={(size * 0.053) / 2} />
        </Circle>
      </Canvas>
      {showIcon && (
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <Icon name="line/sparkle" size={size * 0.179} />
        </View>
      )}
    </View>
  );
}

/** Two-layer mini orb used in the chat header (32pt frame, 05 §2.1). */
export function MiniGlowOrb({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View pointerEvents="none" style={[{ width: 32, height: 32 }, style]}>
      <Canvas style={{ position: 'absolute', left: -16, top: -16, width: 64, height: 64 }}>
        <Circle cx={32} cy={32} r={20} color={palette.mustard} opacity={0.5}>
          <Blur blur={4} />
        </Circle>
        <Circle cx={32} cy={32} r={11} color={palette.cream}>
          <Blur blur={1.5} />
        </Circle>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
