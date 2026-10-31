import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon, type IconName } from '@/components/icons/Icon';

/**
 * Shared button (00-foundations §4.1). Height 56, full pill radius.
 * `size="lg"` is the 18pt label used by in-flow component buttons;
 * `md` is the 16pt label used by full-width bottom CTAs.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'outline' | 'selected' | 'unselected' | 'ghost' | 'text' | 'danger';

type VariantStyle = { bg: string; border?: string; borderWidth?: number; fg: string };

const VARIANTS: Record<ButtonVariant, VariantStyle> = {
  primary: { bg: palette.plum, fg: palette.white },
  // `secondary` is the pre-redesign name; it now renders as the outline button.
  secondary: { bg: palette.white, border: palette.plum, borderWidth: 1.5, fg: palette.plum },
  outline: { bg: palette.white, border: palette.plum, borderWidth: 1.5, fg: palette.plum },
  soft: { bg: palette.softButton, fg: palette.ink },
  // Yes / No option pair (Assessment `4002:14809` / `4002:14810`).
  selected: { bg: palette.selected, border: palette.plum, borderWidth: 1.5, fg: palette.ink },
  unselected: { bg: palette.white, fg: palette.plumDeep },
  ghost: { bg: palette.selected, fg: palette.plum },
  text: { bg: 'transparent', fg: palette.plum },
  danger: { bg: palette.danger, fg: palette.white },
};

export function AppButton({
  title,
  busy = false,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'right',
  style,
  textStyle,
  disabled,
  ...props
}: Omit<PressableProps, 'style' | 'children'> & {
  title: string;
  busy?: boolean;
  variant?: ButtonVariant;
  size?: 'md' | 'lg';
  /** Icon next to the label; primary buttons usually use `arrow/forward`. */
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  const v = VARIANTS[variant];
  const isText = variant === 'text';
  const label = size === 'lg' ? { fontSize: 18, letterSpacing: -0.07 } : { fontSize: 16, letterSpacing: 0 };
  // Component buttons (lg) carry a 24pt icon with a 12 gap; full-width frame buttons an 18pt icon with 10 (outline 8).
  const iconSize = size === 'lg' ? 24 : 18;
  const gap = size === 'lg' ? 12 : variant === 'outline' || variant === 'secondary' ? 8 : 10;
  const iconNode = icon ? <Icon name={icon} size={iconSize} color={v.fg} /> : null;
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled || busy, busy }}
      disabled={disabled || busy}
      style={({ pressed }) => [
        {
          height: isText ? 48 : 56,
          paddingHorizontal: isText ? 12 : 24,
          borderRadius: 999,
          flexDirection: 'row',
          gap,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: v.bg,
          borderWidth: v.borderWidth ?? 0,
          borderColor: v.border,
          // No disabled or pressed state is designed (00 §10); keep the previous opacity cues.
          opacity: disabled || busy ? 0.55 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {busy && <ActivityIndicator color={v.fg} />}
      {iconPosition === 'left' && iconNode}
      <Text
        numberOfLines={1}
        style={[Type.bodyStrong, label, { color: v.fg, flexShrink: 1, textAlign: 'center' }, isText && { fontSize: 15 }, textStyle]}
      >
        {title}
      </Text>
      {iconPosition === 'right' && iconNode}
    </Pressable>
  );
}

/**
 * Round icon button from the Button Icon FAB set `4002:12313`:
 * xl 80 plum with a forward arrow, lg 64 white with the card shadow, sm 48 well.
 */
export function IconFab({
  icon = 'arrow/forward',
  size = 80,
  style,
  accessibilityLabel,
  ...props
}: Omit<PressableProps, 'style' | 'children'> & {
  icon?: IconName;
  size?: 80 | 64 | 48;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
}) {
  const look =
    size === 80
      ? { bg: palette.plum, fg: palette.white, shadow: undefined }
      : size === 64
        ? { bg: palette.white, fg: palette.plum, shadow: '0px 8px 16px 0px rgba(36,26,46,0.05)' }
        : { bg: palette.bg, fg: palette.plum, shadow: undefined };
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        { width: size, height: size, borderRadius: size / 2, backgroundColor: look.bg, boxShadow: look.shadow, opacity: pressed ? 0.85 : 1 },
        style,
      ]}
    >
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={24} color={look.fg} />
      </View>
    </Pressable>
  );
}
