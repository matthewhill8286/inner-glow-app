import React from 'react';
import { View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Glow, GlowField } from '@/components/glow/Glow';
import { LogoMark } from '@/components/brand/LogoMark';
import Step1Contours from '@/assets/svg/illustrations/onboarding/step1-contours.svg';
import Step5Network from '@/assets/svg/illustrations/onboarding/step5-network.svg';

const W = 375;

/**
 * A Figma frame `width` x `height` drawn at design coordinates and scaled to the screen width,
 * so glows, SVG art and positions all keep their proportions (01 §2.4, §2.6).
 */
export function DesignFrame({ height, children, style }: { height: number; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { width } = useWindowDimensions();
  const s = width / W;
  return (
    <View style={[{ width, height: height * s }, style]} pointerEvents="none">
      <View
        style={{
          position: 'absolute',
          width: W,
          height,
          left: (width - W) / 2,
          top: (height * s - height) / 2,
          transform: [{ scale: s }],
        }}
      >
        {children}
      </View>
    </View>
  );
}

/** A white core with a soft gold halo, used at the centre of several artworks. */
function Core({ x, y, size }: { x: number; y: number; size: number }) {
  return (
    <>
      <Glow color={palette.mustard} opacity={0.55} width={size + 40} blur={40} style={{ position: 'absolute', left: x - 20, top: y - 20 }} />
      <View style={{ position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: size / 2, backgroundColor: '#FFFDF8' }} />
    </>
  );
}

/** Welcome landing illustration `6638:2886`, 375x380. */
export function LandingArt() {
  return (
    <DesignFrame height={380}>
      <GlowField
        scaleToWidth={false}
        glows={[
          { color: palette.mustard, opacity: 0.42, x: 27.5, y: 50, width: 320, blur: 90 },
          { color: '#E8A65C', opacity: 0.18, x: 157.5, y: 160, width: 200, blur: 80 },
        ]}
      />
      <Svg width={W} height={380} style={{ position: 'absolute' }}>
        {[
          [120, 0.55],
          [100, 0.55],
          [76, 0.55],
        ].map(([r, o]) => (
          <Circle key={r} cx={187.5} cy={210} r={r} stroke={palette.plum} strokeOpacity={o} strokeWidth={0.75} fill="none" />
        ))}
      </Svg>
      <LogoMark size={110} style={{ position: 'absolute', left: 132.5, top: 155 }} />
    </DesignFrame>
  );
}

/** Carousel artwork for Steps One–Five, 375x480 (01 §2.6). */
export function StepArt({ step }: { step: 1 | 2 | 3 | 4 | 5 }) {
  return <DesignFrame height={480}>{ART[step]()}</DesignFrame>;
}

const ART: Record<1 | 2 | 3 | 4 | 5, () => React.ReactNode> = {
  // Topographic aura contours around a glowing core.
  1: () => (
    <>
      <GlowField
        scaleToWidth={false}
        glows={[
          { color: palette.mustard, opacity: 0.4, x: 22.5, y: 90, width: 330, blur: 90 },
          { color: palette.sky, opacity: 0.15, x: 7.5, y: 105, width: 180, blur: 80 },
        ]}
      />
      <Step1Contours width={W} height={480} style={{ position: 'absolute' }} />
      <Glow color={palette.mustard} opacity={0.55} width={116} blur={40} style={{ position: 'absolute', left: 129.5, top: 197 }} />
      <View style={{ position: 'absolute', left: 149.5, top: 217, width: 76, height: 76, borderRadius: 38, backgroundColor: '#F7F3EF' }} />
      <Glow color={palette.mustard} opacity={0.9} width={34} blur={8} style={{ position: 'absolute', left: 170.5, top: 238 }} />
    </>
  ),
  // A soft mood spectrum with a marker, thumb and scale ticks.
  2: () => (
    <>
      <GlowField scaleToWidth={false} glows={[{ color: palette.mustard, opacity: 0.18, x: 27.5, y: 90, width: 320, blur: 90 }]} />
      {/* The Figma bar is a gradient with a 26pt layer blur; each colour stop is a blurred glow here. */}
      {[
        ['#FFB3BE', 22.5],
        ['#D8B4D8', 88],
        ['#EFE6DA', 152.5],
        ['#E2CC40', 218],
        ['#7FC6F1', 282.5],
      ].map(([c, x]) => (
        <Glow key={c as string} color={c as string} opacity={0.9} width={70} height={70} blur={26} style={{ position: 'absolute', left: x as number, top: 215 }} />
      ))}
      <Svg width={W} height={480} style={{ position: 'absolute' }}>
        <Rect x={258} y={175} width={1.5} height={150} fill={palette.plum} fillOpacity={0.6} />
        {[40, 69.5, 99, 128.5, 158, 187.5, 217, 246.5, 276, 305.5, 335].map((x) => {
          const major = x === 40 || x === 187.5 || x === 335;
          return <Rect key={x} x={x} y={320} width={1} height={major ? 14 : 8} fill={palette.plum} fillOpacity={0.3} />;
        })}
      </Svg>
      <Core x={243.8} y={235} size={30} />
    </>
  ),
  // Two overlapping circles: you and Glow AI.
  3: () => (
    <>
      <Glow color={palette.lavenderSoft} opacity={0.55} width={230} blur={50} style={{ position: 'absolute', left: 35, top: 135 }} />
      <Glow color={palette.mustard} opacity={0.55} width={230} blur={50} style={{ position: 'absolute', left: 113, top: 135 }} />
      <Glow color="#FFFDF8" opacity={0.85} width={110} blur={30} style={{ position: 'absolute', left: 134, top: 195 }} />
      <Svg width={W} height={480} style={{ position: 'absolute' }}>
        <Circle cx={150} cy={250} r={95} stroke={palette.plum} strokeOpacity={0.22} strokeWidth={1} fill="none" />
        <Circle cx={228} cy={250} r={95} stroke={palette.plum} strokeOpacity={0.22} strokeWidth={1} fill="none" />
      </Svg>
      <Core x={178} y={239} size={22} />
    </>
  ),
  // Sunrise over a horizon with its reflection.
  4: () => (
    <>
      <Svg width={W} height={480} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#EAF2F5" />
            <Stop offset="0.7" stopColor="#F5E9D9" />
            <Stop offset="1" stopColor={palette.bg} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={W} height={480} fill="url(#sky)" />
      </Svg>
      <Glow color={palette.mustard} opacity={0.5} width={320} blur={70} style={{ position: 'absolute', left: 27.5, top: 170 }} />
      <Svg width={W} height={480} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="sun" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#F6E6A0" />
            <Stop offset="1" stopColor="#E9B66E" />
          </LinearGradient>
          <LinearGradient id="reflection" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.mustard} stopOpacity={0.45} />
            <Stop offset="1" stopColor={palette.mustard} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        {/* Top halves only: the sun (130 wide) and two hairline arcs, all centred on the horizon. */}
        <Path d="M57.5 360 A130 130 0 0 1 317.5 360" stroke={palette.plum} strokeOpacity={0.12} strokeWidth={1} fill="none" />
        <Path d="M87.5 360 A100 100 0 0 1 287.5 360" stroke={palette.plum} strokeOpacity={0.16} strokeWidth={1} fill="none" />
        <Path d="M122.5 360 A65 65 0 0 1 252.5 360 Z" fill="url(#sun)" />
        <Rect x={0} y={360} width={W} height={1} fill={palette.plum} fillOpacity={0.35} />
        <Rect x={122.5} y={362} width={130} height={60} fill="url(#reflection)" />
      </Svg>
    </>
  ),
  // A constellation of stars joined to a central core.
  5: () => (
    <>
      <GlowField scaleToWidth={false} glows={[{ color: palette.mustard, opacity: 0.3, x: 17.5, y: 75, width: 340, blur: 90 }]} />
      <Step5Network width={W} height={480} style={{ position: 'absolute' }} />
      <Core x={167.5} y={225} size={40} />
      {STARS.map(([x, y, big]) => {
        const halo = big ? 36 : 24;
        const point = big ? 12 : 8;
        return (
          <React.Fragment key={`${x}-${y}`}>
            <Glow color={palette.mustard} opacity={0.45} width={halo} blur={8} style={{ position: 'absolute', left: x, top: y }} />
            <Svg width={halo} height={halo} style={{ position: 'absolute', left: x, top: y }}>
              <Circle cx={halo / 2} cy={halo / 2} r={point / 2 - 0.5} fill="#FFFDF8" stroke={palette.mustard} strokeOpacity={0.9} strokeWidth={1} />
            </Svg>
          </React.Fragment>
        );
      })}
    </>
  ),
};

/** Step Five stars: halo origin x, y and whether it is a large star. */
const STARS: [number, number, boolean][] = [
  [83.5, 163, false],
  [55.5, 263, false],
  [221.5, 337, false],
  [293.5, 273, false],
  [195.5, 115, false],
  [135.5, 203, false],
  [25.5, 203, false],
  [325.5, 213, false],
  [119.5, 323, true],
  [265.5, 151, true],
  [221.5, 213, true],
  [159.5, 287, true],
];

/** The gold-to-lavender fill used by the loading and step progress bars. */
export function GradientBar({ width, height = 3, id = 'onbBar' }: { width: number; height?: number; id?: string }) {
  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={palette.mustard} />
          <Stop offset="1" stopColor={palette.lavender} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} rx={2} fill={`url(#${id})`} />
    </Svg>
  );
}
