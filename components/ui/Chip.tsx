import React from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon, type IconName } from '@/components/icons/Icon';

/**
 * Chips and pills (00-foundations §4.9).
 * - filter: h36, white with border; selected = selected fill + 1.5 plum outline
 * - option: h42 option pill (Profile Setup presets)
 * - factor: h34 lilac-bordered chip (Sleep factors)
 * - speed: h30 lavender single-select pill (Mindful pace), SemiBold when selected (10 §2)
 * - preset: library Chip `6746:4356` (§11.6), h34, `#E6E0EA` stroke, Medium 13 `#4E3A5E`;
 *   selected `#F1ECF5` + 1.5 plum, Medium 13 plum
 */
export type ChipKind = 'filter' | 'option' | 'factor' | 'speed' | 'preset';

const SIZES: Record<ChipKind, { height: number; padH: number; fontSize: number }> = {
  filter: { height: 36, padH: 14, fontSize: 13 },
  option: { height: 42, padH: 18, fontSize: 14 },
  factor: { height: 34, padH: 15, fontSize: 13 },
  speed: { height: 30, padH: 12, fontSize: 13 },
  preset: { height: 34, padH: 14, fontSize: 13 },
};

export function Chip({
  label,
  selected = false,
  kind = 'filter',
  icon,
  onPress,
  style,
}: {
  label: string;
  selected?: boolean;
  kind?: ChipKind;
  icon?: IconName;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const size = SIZES[kind];
  const speed = kind === 'speed';
  const preset = kind === 'preset';
  const fg = speed ? (selected ? palette.white : palette.lavender) : selected ? palette.plum : preset ? palette.plumDeep : palette.textMuted;
  const bg = speed ? (selected ? palette.lavender : 'transparent') : selected ? palette.selected : palette.surface;
  const border = speed ? palette.lavender : selected ? palette.plum : kind === 'factor' || preset ? palette.borderLilac : palette.border;
  // The library chip keeps Medium when selected; the older chips switch to SemiBold.
  const textStyle = selected && !preset ? Type.chipSelected : Type.chip;
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ selected }}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        {
          height: size.height,
          paddingHorizontal: size.padH,
          borderRadius: 999,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: bg,
          borderWidth: selected && !speed ? 1.5 : 1,
          borderColor: border,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {icon && <Icon name={icon} size={16} color={fg} />}
      <Text style={[textStyle, { fontSize: size.fontSize, color: fg }]}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Small non-interactive chips: meta ("4 min"), info (icon + text), Go Pro. */
export function MetaChip({ label, variant = 'meta', icon, style }: { label: string; variant?: 'meta' | 'info' | 'pro'; icon?: IconName; style?: StyleProp<ViewStyle> }) {
  // Paddings from Figma: meta 4/10, info 6/14/6/12, Go Pro 10/12/10/10.
  const look =
    variant === 'meta'
      ? { h: 22, padL: 10, padR: 10, bg: palette.borderLilac, fg: palette.plumDeep }
      : variant === 'info'
        ? { h: 29, padL: 12, padR: 14, bg: palette.selected, fg: palette.plum }
        : { h: 37, padL: 10, padR: 12, bg: palette.plum, fg: palette.white };
  return (
    <View style={[{ height: look.h, paddingLeft: look.padL, paddingRight: look.padR, borderRadius: 999, backgroundColor: look.bg, flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }, style]}>
      {icon && <Icon name={icon} size={variant === 'pro' ? 16 : 14} color={look.fg} />}
      <Text style={[Type.caption, { color: look.fg }, variant === 'pro' && { fontSize: 14, fontWeight: '700' }]}>{label}</Text>
    </View>
  );
}

/**
 * Tag, library `6753:4154` (§11.6): h22 pill, padding 4/10, gap 4, SemiBold 12.
 * - default `6753:4146`: `#F1ECF5` with plum text (read-only mood factors, medication tags)
 * - brand `6753:4148`: plum with white text (the PRO tag)
 * - glow `6753:4150`: mustard with ink text
 * - onDark `6753:4152`: white @0.12 with white text
 * `onRemove` adds a 14pt close button for removable tags.
 */
export type TagVariant = 'default' | 'brand' | 'glow' | 'onDark';

const TAG_LOOKS: Record<TagVariant, { bg: string; fg: string }> = {
  default: { bg: palette.selected, fg: palette.plum },
  brand: { bg: palette.plum, fg: palette.white },
  glow: { bg: palette.mustard, fg: palette.ink },
  onDark: { bg: 'rgba(255,255,255,0.12)', fg: palette.white },
};

export function Tag({ label, variant = 'default', icon, onRemove, style }: { label: string; variant?: TagVariant; icon?: IconName; onRemove?: () => void; style?: StyleProp<ViewStyle> }) {
  const look = TAG_LOOKS[variant];
  return (
    <View style={[{ height: 22, borderRadius: 999, paddingHorizontal: 10, backgroundColor: look.bg, flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' }, style]}>
      {icon && <Icon name={icon} size={12} color={look.fg} />}
      <Text style={[Type.tag, { color: look.fg }]}>{label}</Text>
      {onRemove && (
        <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${label}`} onPress={onRemove} hitSlop={12}>
          <Icon name="arrow/close" size={14} color={look.fg} accent={look.fg} />
        </Pressable>
      )}
    </View>
  );
}

/** The brand PRO tag (Tag Brand) used on plan and profile screens. */
export function ProTag({ label = 'PRO', style }: { label?: string; style?: StyleProp<ViewStyle> }) {
  return <Tag label={label} variant="brand" style={style} />;
}
