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
 * - speed: h30 lavender single-select pill (Mindful pace)
 */
export type ChipKind = 'filter' | 'option' | 'factor' | 'speed';

const SIZES: Record<ChipKind, { height: number; padH: number; fontSize: number }> = {
  filter: { height: 36, padH: 14, fontSize: 13 },
  option: { height: 42, padH: 18, fontSize: 14 },
  factor: { height: 34, padH: 15, fontSize: 13 },
  speed: { height: 30, padH: 12, fontSize: 13 },
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
  const fg = speed ? (selected ? palette.white : palette.lavender) : selected ? palette.plum : palette.textMuted;
  const bg = speed ? (selected ? palette.lavender : 'transparent') : selected ? palette.selected : palette.surface;
  const border = speed ? palette.lavender : selected ? palette.plum : kind === 'factor' ? palette.borderLilac : palette.border;
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
      <Text style={[selected ? Type.chipSelected : Type.chip, { fontSize: size.fontSize, color: fg }, speed && selected && { fontWeight: '700' }]}>
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
      ? { h: 22, padL: 10, padR: 10, bg: palette.border, fg: palette.plumDeep }
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

/** Removable tag (Tag Master xs/sm): h24, radius 32, Bold 12 with a close icon. */
export function Tag({ label, onRemove, style }: { label: string; onRemove?: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ height: 24, borderRadius: 32, paddingHorizontal: 8, backgroundColor: palette.selected, flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' }, style]}>
      <Text style={[Type.caption, { fontWeight: '700', letterSpacing: -0.018, color: palette.plumDeep }]}>{label}</Text>
      {onRemove && (
        <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${label}`} onPress={onRemove} hitSlop={10}>
          <Icon name="arrow/close" size={16} color={palette.plumDeep} />
        </Pressable>
      )}
    </View>
  );
}
