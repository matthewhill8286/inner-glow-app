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
 * Shared button. The library set `6746:4335` (00-foundations §11.4) defines
 * primary, secondary, ghost, danger and onDark at sizes L (56) and S (40), each
 * with Default, Pressed and Disabled looks. The other variants come from the
 * earlier per-screen instances (§4.1) and keep the opacity cues for those states.
 *
 * Sizes: `md` is library L (16 label), `s` is library S (40 high, 14 label),
 * and `lg` is the 18pt label used by the older in-flow component buttons.
 */
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'onDark'
  | 'soft'
  | 'outline'
  | 'selected'
  | 'unselected'
  | 'tonal'
  | 'text';

type Look = { bg: string; border?: string; borderWidth?: number; fg: string };
type StateLooks = { normal: Look; pressed?: Look; disabled?: Look };

const DISABLED_FILL: Look = { bg: palette.toggleOffAlt, fg: palette.textSubtle };

const LOOKS: Record<ButtonVariant, StateLooks> = {
  // Library set `6746:4335`.
  primary: {
    normal: { bg: palette.plum, fg: palette.white },
    pressed: { bg: palette.plumDeep, fg: palette.white },
    disabled: DISABLED_FILL,
  },
  secondary: {
    normal: { bg: palette.selected, border: palette.plum, borderWidth: 1.5, fg: palette.plum },
    pressed: { bg: palette.surfaceLilac, border: palette.plum, borderWidth: 1.5, fg: palette.plum },
    disabled: { bg: palette.surfaceLilacSoft, border: palette.borderLilac, borderWidth: 1.5, fg: palette.textSubtle },
  },
  ghost: {
    normal: { bg: 'transparent', fg: palette.plum },
    pressed: { bg: palette.selected, fg: palette.plum },
    disabled: { bg: 'transparent', fg: palette.textSubtle },
  },
  danger: {
    normal: { bg: palette.danger, fg: palette.white },
    pressed: { bg: 'rgba(180,80,90,0.85)', fg: palette.white },
    disabled: DISABLED_FILL,
  },
  // Figma labels this variant #000000; ink is used so it matches every other dark text.
  onDark: {
    normal: { bg: palette.surfaceLilac, fg: palette.ink },
    pressed: { bg: palette.borderLilac, fg: palette.ink },
    disabled: DISABLED_FILL,
  },

  // Earlier per-screen buttons (§4.1).
  outline: { normal: { bg: palette.white, border: palette.plum, borderWidth: 1.5, fg: palette.plum } },
  soft: { normal: { bg: palette.softButton, fg: palette.ink } },
  // Yes / No option pair (Assessment `4002:14809` / `4002:14810`).
  selected: { normal: { bg: palette.selected, border: palette.plum, borderWidth: 1.5, fg: palette.ink } },
  unselected: { normal: { bg: palette.white, fg: palette.plumDeep } },
  // The old `ghost` look ("Prefer to skip, thanks", Assessment `4002:14631`): lilac fill, no stroke.
  tonal: { normal: { bg: palette.selected, fg: palette.plum } },
  text: { normal: { bg: 'transparent', fg: palette.plum } },
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
  size?: 'md' | 'lg' | 's';
  /** Icon next to the label; primary buttons usually use `arrow/forward`. */
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  const looks = LOOKS[variant];
  const isText = variant === 'text';
  const small = size === 's';
  const inactive = !!disabled || busy;
  // Variants with designed Pressed / Disabled looks use them; the others fall back to opacity.
  const lookFor = (pressed: boolean): Look =>
    disabled && looks.disabled ? looks.disabled : pressed && looks.pressed ? looks.pressed : looks.normal;
  const label =
    size === 'lg' ? { ...Type.bodyStrong, fontSize: 18, letterSpacing: -0.07 } : small ? Type.buttonS : { ...Type.bodyStrong, letterSpacing: 0 };
  // Component buttons (lg) carry a 24pt icon with a 12 gap; full-width frame buttons an 18pt icon with 10 (outline 8).
  const iconSize = size === 'lg' ? 24 : small ? 16 : 18;
  const gap = size === 'lg' ? 12 : small ? 6 : variant === 'outline' || variant === 'secondary' ? 8 : 10;
  const height = small ? 40 : isText ? 48 : 56;

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy }}
      disabled={inactive}
      style={({ pressed }) => {
        const v = lookFor(pressed);
        const opacityCue = !looks.disabled && disabled ? 0.55 : !looks.pressed && pressed ? 0.85 : busy && !disabled ? 0.85 : 1;
        return [
          {
            height,
            paddingHorizontal: isText ? 12 : small ? 16 : 24,
            borderRadius: 999,
            flexDirection: 'row',
            gap,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: v.bg,
            borderWidth: v.borderWidth ?? 0,
            borderColor: v.border,
            opacity: opacityCue,
          },
          style,
        ];
      }}
    >
      {({ pressed }) => {
        const v = lookFor(pressed);
        const iconNode = icon ? <Icon name={icon} size={iconSize} color={v.fg} /> : null;
        return (
          <>
            {busy && <ActivityIndicator color={v.fg} />}
            {iconPosition === 'left' && iconNode}
            <Text
              numberOfLines={1}
              style={[label, { color: v.fg, flexShrink: 1, textAlign: 'center' }, isText && { fontSize: 15 }, textStyle]}
            >
              {title}
            </Text>
            {iconPosition === 'right' && iconNode}
          </>
        );
      }}
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
