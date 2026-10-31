import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Colors, UI } from '@/constants/theme';
import { Typography } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
export function AppButton({
  title,
  busy = false,
  variant = 'primary',
  style,
  disabled,
  ...props
}: Omit<PressableProps, 'style' | 'children'> & {
  title: string;
  busy?: boolean;
  variant?: 'primary' | 'secondary';
  style?: StyleProp<ViewStyle>;
}) {
  const colors = Colors[useColorScheme() ?? 'light'];
  const primary = variant === 'primary';
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled || busy, busy }}
      disabled={disabled || busy}
      style={({ pressed }) => [
        {
          minHeight: 48,
          paddingVertical: 13,
          paddingHorizontal: 18,
          borderRadius: UI.radius.lg,
          flexDirection: 'row',
          gap: 10,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: primary ? colors.tint : colors.border,
          backgroundColor: primary ? colors.tint : colors.card,
          opacity: disabled || busy ? 0.55 : pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      {busy && <ActivityIndicator color={primary ? '#FFF' : colors.text} />}
      <Text
        style={{
          fontFamily: Typography.family.body,
          fontSize: 16,
          fontWeight: Typography.weight.semibold,
          color: primary ? '#FFF' : colors.text,
          flexShrink: 1,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
