import React from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Glow } from '@/components/glow/Glow';
import SleepArc from '@/assets/svg/illustrations/assessment/sleep-arc.svg';
import StressCalm from '@/assets/svg/illustrations/assessment/stress-calm.svg';
import StressLight from '@/assets/svg/illustrations/assessment/stress-light.svg';
import StressModerate from '@/assets/svg/illustrations/assessment/stress-moderate.svg';
import StressHigh from '@/assets/svg/illustrations/assessment/stress-high.svg';
import StressIntense from '@/assets/svg/illustrations/assessment/stress-intense.svg';

/** Figma frames are 375 wide; horizontal positions scale with the screen, vertical ones stay. */
const DESIGN_W = 375;

function useScaleX() {
  const { width } = useWindowDimensions();
  return width / DESIGN_W;
}

/* ── Sleep moons (A8 `4002:14823`, layer `6673:3005`) ──────────────────────────────────── */

/** Moon centres in the frame (shifted up by `MOONS_TOP`), and the crescent shadow per level. */
const MOONS_TOP = 330;
const MOONS = [
  { cx: 47.5, cy: 470, shade: -24.1 / 36, shadeOpacity: 0.44 },
  { cx: 88.5, cy: 392.2, shade: -17.6 / 36, shadeOpacity: 0.33 },
  { cx: 187.5, cy: 360, shade: -11.2 / 36, shadeOpacity: 0.22 },
  { cx: 286.5, cy: 392.2, shade: -7 / 54, shadeOpacity: 0.11 },
  { cx: 327.5, cy: 470, shade: 0, shadeOpacity: 0 },
] as const;

/**
 * One moon: a `#EDE6F2` disc with a plum @0.35 outline, and a same-size plum disc shifted left and
 * clipped to the moon, which leaves a crescent. Selected: 54 instead of 36, a cream disc with a
 * plum @0.90 2.7 outline, and a mustard halo behind it.
 */
function Moon({ size, selected, shade, shadeOpacity, id }: { size: number; selected: boolean; shade: number; shadeOpacity: number; id: string }) {
  const r = size / 2;
  const stroke = selected ? 2.7 : 1.08;
  return (
    <Svg width={size} height={size}>
      <Defs>
        <ClipPath id={id}>
          <Circle cx={r} cy={r} r={r - stroke / 2} />
        </ClipPath>
      </Defs>
      <Circle cx={r} cy={r} r={r - stroke / 2} fill={selected ? palette.cream : '#EDE6F2'} />
      {shadeOpacity > 0 && <Circle cx={r + shade * size} cy={r} r={r - stroke / 2} fill={palette.plum} fillOpacity={shadeOpacity} clipPath={`url(#${id})`} />}
      <Circle cx={r} cy={r} r={r - stroke / 2} fill="none" stroke={palette.plum} strokeOpacity={selected ? 0.9 : 0.35} strokeWidth={stroke} />
    </Svg>
  );
}

export function SleepMoons({
  value,
  onChange,
  labels,
  caption,
}: {
  value: number | null | undefined;
  onChange: (level: number) => void;
  /** Level names 1–5 (Very poor … Restful). */
  labels: string[];
  caption: string | null;
}) {
  const sx = useScaleX();
  return (
    <View>
      <View style={{ height: 520 - MOONS_TOP, marginHorizontal: -16 }}>
        <Glow color={palette.lavenderSoft} opacity={0.25} width={320} blur={70} style={{ position: 'absolute', left: 27.5 * sx, top: 240 - MOONS_TOP }} />
        <SleepArc width={282 * sx} height={112} style={{ position: 'absolute', left: 46.5 * sx, top: 359 - MOONS_TOP }} />
        {MOONS.map((m, i) => {
          const level = i + 1;
          const selected = value === level;
          const size = selected ? 54 : 36;
          const left = m.cx * sx;
          const top = m.cy - MOONS_TOP;
          return (
            <React.Fragment key={level}>
              {selected && <Glow color={palette.mustard} opacity={0.28} width={96} blur={22} style={{ position: 'absolute', left: left - 48, top: top - 48 }} />}
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={labels[i]}
                onPress={() => onChange(level)}
                hitSlop={10}
                style={{ position: 'absolute', left: left - 28, top: top - 28, width: 56, height: 56, alignItems: 'center', justifyContent: 'center' }}
              >
                <Moon id={`moon${level}`} size={size} selected={selected} shade={m.shade} shadeOpacity={m.shadeOpacity} />
              </Pressable>
              <Text
                style={[
                  selected ? { ...Type.micro, fontWeight: '600' } : Type.micro,
                  { position: 'absolute', left: left - 40, top: top + size / 2 + 8, width: 80, textAlign: 'center', color: selected ? palette.plum : palette.textSubtle },
                ]}
              >
                {labels[i]}
              </Text>
            </React.Fragment>
          );
        })}
      </View>
      <LevelReadout label={value ? labels[value - 1] : null} caption={caption} />
    </View>
  );
}

/** The chosen level in SemiBold 30 ink and its caption in Regular 14 muted, centred (A8, A12). */
export function LevelReadout({ label, caption }: { label: string | null; caption: string | null }) {
  return (
    <View style={{ alignItems: 'center', gap: 6, minHeight: 78 }} accessibilityLiveRegion="polite">
      <Text style={[Type.titleXl, { letterSpacing: 0, color: palette.ink, opacity: label ? 1 : 0 }]}>{label ?? ' '}</Text>
      {caption ? <Text style={[Type.bodySm, { color: palette.textMuted, textAlign: 'center' }]}>{caption}</Text> : null}
    </View>
  );
}

/* ── Stress lights (A12 `4002:14998`, layer `6673:3032`) ───────────────────────────────── */

const LIGHTS_TOP = 305;
// Glow opacities as drawn in Figma: Light is the only pale one (@0.35); the others are full strength.
const LIGHTS = [
  { cx: 43, color: palette.sky, opacity: 1, Art: StressCalm },
  { cx: 115, color: '#B6BBE2', opacity: 0.35, Art: StressLight },
  { cx: 187, color: palette.mustard, opacity: 1, Art: StressModerate },
  { cx: 259, color: '#F2A98A', opacity: 1, Art: StressHigh },
  { cx: 331, color: palette.rose, opacity: 1, Art: StressIntense },
] as const;

/**
 * Five orbs in a row, each a blurred glow plus its contour art. Unselected: 70 glow (blur 16) and contour,
 * label Medium 11 subtle. Selected: 110 glow @0.60 with a cream inner light, the contour scaled to
 * 110, label SemiBold 11 plum.
 */
export function StressLights({
  value,
  onChange,
  labels,
  caption,
}: {
  value: number | null | undefined;
  onChange: (band: number) => void;
  labels: string[];
  caption: string | null;
}) {
  const sx = useScaleX();
  return (
    <View>
      <View style={{ height: 437 - LIGHTS_TOP, marginHorizontal: -16 }}>
        {LIGHTS.map((l, i) => {
          const band = i + 1;
          const selected = value === band;
          const size = selected ? 110 : 70;
          const left = l.cx * sx;
          const cy = 360 - LIGHTS_TOP;
          return (
            <React.Fragment key={band}>
              <Glow color={l.color} opacity={selected ? 0.6 : l.opacity} width={size} blur={selected ? 22 : 16} style={{ position: 'absolute', left: left - size / 2, top: cy - size / 2 }} />
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={labels[i]}
                onPress={() => onChange(band)}
                style={{ position: 'absolute', left: left - size / 2, top: cy - size / 2, width: size, height: size }}
              >
                <l.Art width={size} height={size} />
                {selected && <Glow color={palette.cream} opacity={1} width={16} blur={4} style={{ position: 'absolute', left: size / 2 - 8, top: size / 2 - 8 }} />}
              </Pressable>
              <Text
                style={[
                  selected ? { ...Type.micro, fontWeight: '600' } : Type.micro,
                  { position: 'absolute', left: left - 36, top: 424 - LIGHTS_TOP, width: 72, textAlign: 'center', color: selected ? palette.plum : palette.textSubtle },
                ]}
              >
                {labels[i]}
              </Text>
            </React.Fragment>
          );
        })}
      </View>
      <View style={{ marginTop: 33 }}>
        <LevelReadout label={value ? labels[value - 1] : null} caption={caption} />
      </View>
    </View>
  );
}
