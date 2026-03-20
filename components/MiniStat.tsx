import React from 'react';
import { View, Text, useColorScheme } from 'react-native';
import { Colors, UI } from '@/constants/theme';

export function MiniStat({
  label,
  value,
  icon,
}: Readonly<{ label: string; value: string; icon?: string }>) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        borderRadius: UI.radius.lg,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {icon && <Text style={{ fontSize: 18, marginBottom: 6 }}>{icon}</Text>}
      <Text style={{ color: colors.mutedText, fontWeight: '700', fontSize: 13 }}>{label}</Text>
      <Text style={{ fontSize: 22, fontWeight: '900', marginTop: 4, color: colors.text }}>
        {value}
      </Text>
    </View>
  );
}
