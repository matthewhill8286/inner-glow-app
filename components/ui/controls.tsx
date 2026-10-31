import React from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Rect, Stop } from 'react-native-svg';
import { palette, shadow } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon } from '@/components/icons/Icon';

/** Toggle 46×28 (00-foundations §4.10). On plum, off border colour; knob 22 white. */
export function Toggle({ value, onValueChange, accessibilityLabel }: { value: boolean; onValueChange: (v: boolean) => void; accessibilityLabel?: string }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      hitSlop={8}
      style={{ width: 46, height: 28, borderRadius: 14, backgroundColor: value ? palette.plum : palette.border, justifyContent: 'center' }}
    >
      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: palette.white, marginLeft: value ? 21 : 3 }} />
    </Pressable>
  );
}

/**
 * Drawn radio (§4.11): 22 ring, 1.5 stroke, 12 plum dot when selected.
 * Figma has no unselected colour that reads on the background, so the empty ring uses lavender.
 */
export function Radio({ selected }: { selected: boolean }) {
  return (
    <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: selected ? palette.plum : palette.lavender, alignItems: 'center', justifyContent: 'center' }}>
      {selected && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: palette.plum }} />}
    </View>
  );
}

/** Checkbox 22×22 radius 6 (§4.11), white check when ticked. */
export function Checkbox({ checked, onChange, accessibilityLabel }: { checked: boolean; onChange: (v: boolean) => void; accessibilityLabel?: string }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      hitSlop={10}
      style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: checked ? palette.plum : palette.surface, borderWidth: checked ? 0 : 1.5, borderColor: palette.lavender, alignItems: 'center', justifyContent: 'center' }}
    >
      {checked && <Icon name="line/check" size={14} color={palette.white} strokeWidth={2.6} />}
    </Pressable>
  );
}

/**
 * Selectable option card (Assessment Goal / Medications / Distress, §4.11).
 * White with the card shadow; selected = selected fill + 1.5 plum outline.
 */
export function SelectableCard({
  selected,
  onPress,
  children,
  radius = 999,
  style,
  accessibilityLabel,
}: {
  selected: boolean;
  onPress: () => void;
  children: React.ReactNode;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 56,
          borderRadius: radius,
          padding: 16,
          backgroundColor: selected ? palette.selected : palette.surface,
          borderWidth: 1.5,
          borderColor: selected ? palette.plum : 'transparent',
          boxShadow: selected ? undefined : shadow.card,
          opacity: pressed ? 0.9 : 1,
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

/** Segmented control (Tab Group Text, §4.13): h56 white track, h48 segments. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View accessibilityRole="tablist" style={[{ height: 56, borderRadius: 32, padding: 4, backgroundColor: palette.surface, flexDirection: 'row' }, style]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={{ flex: 1, height: 48, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? palette.selected : 'transparent', borderWidth: active ? 1.5 : 0, borderColor: palette.plum }}
          >
            <Text style={[Type.bodyStrong, { letterSpacing: -0.05, color: active ? palette.ink : palette.plumDeep }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function GradientBar({ width, height, id }: { width: number; height: number; id: string }) {
  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={palette.mustard} />
          <Stop offset="1" stopColor={palette.lavender} />
        </LinearGradient>
      </Defs>
      <Rect width={width} height={height} rx={height / 2} fill={`url(#${id})`} />
    </Svg>
  );
}

/** Onboarding step progress (§4.12): 3pt bar, width = step × 120 / total, mustard → lavender. */
export function StepProgress({ step, total, trackWidth = 120 }: { step: number; total: number; trackWidth?: number }) {
  const width = Math.max(0, Math.min(step / total, 1)) * trackWidth;
  return (
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total, now: step }} style={{ width: trackWidth, height: 3, borderRadius: 2, backgroundColor: palette.border, overflow: 'hidden' }}>
      {width > 0 && <GradientBar width={width} height={3} id="stepProgress" />}
    </View>
  );
}

/** Linear progress bar (§4.12): plum fill on the border-coloured track, or the mustard → lavender gradient. */
export function ProgressBar({ value, width, height = 8, gradient = false, style }: { value: number; width: number; height?: number; gradient?: boolean; style?: StyleProp<ViewStyle> }) {
  const fill = Math.max(0, Math.min(value, 1)) * width;
  return (
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }} style={[{ width, height, borderRadius: height / 2, backgroundColor: palette.border, overflow: 'hidden' }, style]}>
      {gradient ? fill > 0 && <GradientBar width={fill} height={height} id="progressBar" /> : <View style={{ width: fill, height, borderRadius: height / 2, backgroundColor: palette.plum }} />}
    </View>
  );
}

/** Legal / Note row (`6674:2966`, §4.8): 14pt info icon and Regular 11/140% text. */
export function LegalNote({ text, style }: { text: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }, style]}>
      <Svg width={14} height={14} viewBox="0 0 14 14" style={{ marginTop: 1 }}>
        <Circle cx={7} cy={7} r={6.2} stroke={palette.lavender} strokeWidth={1.05} fill="none" />
        <Line x1={7} y1={6.3} x2={7} y2={10} stroke={palette.lavender} strokeWidth={1.2} strokeLinecap="round" />
        <Circle cx={7} cy={4.2} r={0.8} fill={palette.lavender} />
      </Svg>
      <Text style={[Type.legal, { color: palette.textLegal, flex: 1 }]}>{text}</Text>
    </View>
  );
}
