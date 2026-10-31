import React, { useState } from 'react';
import { Pressable, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { palette, shadow } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon, type IconName } from '@/components/icons/Icon';

/**
 * Shared input. Three looks:
 * - `pill` (default): the sign-in field (Input Text `4002:12759`, 00-foundations §4.6). SemiBold 14 label,
 *   56pt white pill, focus stroke plus 4px ring. No error state is designed, so errors use the danger colour.
 * - `box`: the library Field `6746:4369` (§11.5). Bold 12 lavender label, 52pt white box with radius 16,
 *   Regular 15 value. Stroke 1 `#E6E0EA`, 1.5 plum when focused, 1.5 danger on error; no focus ring.
 *   Disabled is `#F5F1F7` with subtle text.
 * - `search`: the library Search Field `6753:4157`. 48pt `#F5F1F7` with a 1px `#E6E0EA` stroke (1.5 plum
 *   when focused), radius 24, 20pt lavender search glyph, Regular 14 text.
 */
export type FieldVariant = 'pill' | 'box' | 'search';

export function AppField({
  label,
  error,
  style,
  containerStyle,
  startIcon,
  endIcon,
  onEndIconPress,
  revealable,
  secureTextEntry,
  variant = 'pill',
  onFocus,
  onBlur,
  ...props
}: TextInputProps & {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  startIcon?: IconName;
  endIcon?: IconName;
  onEndIconPress?: () => void;
  /** Shows the eye toggle for password fields. */
  revealable?: boolean;
  variant?: FieldVariant;
}) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const secure = !!secureTextEntry && (!revealable || hidden);
  const trailingIcon: IconName | undefined = revealable ? 'line/eye' : endIcon;
  const trailingPress = revealable ? () => setHidden((h) => !h) : onEndIconPress;
  const disabled = props.editable === false;
  const leadingIcon: IconName | undefined = startIcon ?? (variant === 'search' ? 'line/search' : undefined);

  const box: ViewStyle =
    variant === 'pill'
      ? {
          height: 56,
          borderRadius: 999,
          backgroundColor: palette.surface,
          gap: 8,
          borderWidth: 1,
          borderColor: error ? palette.danger : focused ? palette.plum : 'transparent',
          boxShadow: focused ? shadow.focusRing : undefined,
        }
      : variant === 'box'
        ? {
            height: 52,
            borderRadius: 16,
            backgroundColor: disabled ? palette.surfaceLilacSoft : palette.surface,
            gap: 8,
            borderWidth: error || focused ? 1.5 : 1,
            borderColor: error ? palette.danger : focused ? palette.plum : palette.borderLilac,
          }
        : {
            height: 48,
            borderRadius: 24,
            backgroundColor: palette.surfaceLilacSoft,
            gap: 10,
            borderWidth: focused ? 1.5 : 1,
            borderColor: focused ? palette.plum : palette.borderLilac,
          };
  const text =
    variant === 'pill'
      ? [Type.bodyStrong, { color: palette.textMuted, letterSpacing: -0.05 }]
      : [variant === 'box' ? Type.bodyM : Type.bodyS, { color: disabled ? palette.textSubtle : palette.ink }];
  const placeholderColor = variant === 'pill' ? palette.textMuted : palette.textSubtle;
  // The search glyph is drawn 20pt with a 1.5 stroke, which is 1.8 on the 24 grid.
  const iconSize = variant === 'pill' ? 24 : 20;
  const iconStroke = variant === 'search' ? 1.8 : undefined;
  const iconColor = variant === 'search' ? palette.lavender : palette.textMuted;

  return (
    <View style={[{ gap: 8 }, containerStyle]}>
      {label ? (
        <Text style={variant === 'pill' ? [Type.label, { color: palette.plumDeep }] : [Type.labelM, { color: disabled ? palette.textSubtle : palette.lavender }]}>
          {label}
        </Text>
      ) : null}
      <View style={[{ paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }, box]}>
        {leadingIcon && <Icon name={leadingIcon} size={iconSize} color={iconColor} strokeWidth={iconStroke} />}
        <TextInput
          {...props}
          secureTextEntry={secure}
          accessibilityLabel={props.accessibilityLabel ?? label}
          accessibilityState={{ disabled }}
          placeholderTextColor={placeholderColor}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[...text, { flex: 1, height: '100%' }, style]}
        />
        {trailingIcon && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealable ? (hidden ? 'Show password' : 'Hide password') : undefined}
            onPress={trailingPress}
            hitSlop={12}
          >
            <Icon name={trailingIcon} size={iconSize} color={palette.textSubtle} />
          </Pressable>
        )}
      </View>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={[Type.caption, { color: palette.danger }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
