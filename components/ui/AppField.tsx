import React, { useState } from 'react';
import { Pressable, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { palette, shadow } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon, type IconName } from '@/components/icons/Icon';

/**
 * Shared input (Input Text `4002:12759`, 00-foundations §4.6): SemiBold 14 label,
 * 56pt white pill field, focus stroke plus 4px ring. No error state is designed,
 * so errors use the danger colour on the border and message.
 */
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
}) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const secure = !!secureTextEntry && (!revealable || hidden);
  const trailingIcon: IconName | undefined = revealable ? 'line/eye' : endIcon;
  const trailingPress = revealable ? () => setHidden((h) => !h) : onEndIconPress;

  return (
    <View style={[{ gap: 8 }, containerStyle]}>
      {label ? <Text style={[Type.label, { color: palette.plumDeep }]}>{label}</Text> : null}
      <View
        style={{
          height: 56,
          borderRadius: 999,
          backgroundColor: palette.surface,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          borderWidth: 1,
          borderColor: error ? palette.danger : focused ? palette.plum : 'transparent',
          boxShadow: focused ? shadow.focusRing : undefined,
        }}
      >
        {startIcon && <Icon name={startIcon} size={24} color={palette.textMuted} />}
        <TextInput
          {...props}
          secureTextEntry={secure}
          accessibilityLabel={props.accessibilityLabel ?? label}
          placeholderTextColor={palette.textMuted}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[Type.bodyStrong, { flex: 1, height: '100%', color: palette.textMuted, letterSpacing: -0.05 }, style]}
        />
        {trailingIcon && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealable ? (hidden ? 'Show password' : 'Hide password') : undefined}
            onPress={trailingPress}
            hitSlop={12}
          >
            <Icon name={trailingIcon} size={24} color={palette.textSubtle} />
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
