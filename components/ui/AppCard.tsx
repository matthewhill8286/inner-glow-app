import React from 'react';
import { View, type ViewProps } from 'react-native';
import { Colors, UI } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
export function AppCard({ style, ...props }: ViewProps) {
  const colors = Colors[useColorScheme() ?? 'light'];
  return (
    <View
      {...props}
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: UI.radius.card,
          padding: 16,
          gap: 12,
          ...UI.shadow.card,
        },
        style,
      ]}
    />
  );
}
