import React from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { Colors, UI } from '@/constants/theme';
import { Typography } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
export function AppField({
  label,
  error,
  style,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  const colors = Colors[useColorScheme() ?? 'light'];
  return (
    <View style={{ gap: 8 }}>
      <Text style={[Typography.caption, { color: colors.mutedText }]}>{label}</Text>
      <TextInput
        {...props}
        accessibilityLabel={props.accessibilityLabel ?? label}
        placeholderTextColor={colors.placeholder}
        style={[
          Typography.body,
          {
            minHeight: 48,
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderWidth: 1,
            borderColor: error ? colors.warning : colors.border,
            borderRadius: UI.radius.md,
            backgroundColor: colors.card,
            color: colors.text,
          },
          style,
        ]}
      />
      {error && (
        <Text accessibilityLiveRegion="polite" style={[Typography.caption, { color: colors.text }]}>
          {error}
        </Text>
      )}
    </View>
  );
}
