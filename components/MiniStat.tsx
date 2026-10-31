import { Typography } from '@/constants/typography';
import { WellnessIconText } from '@/components/WellnessIconText';
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
      {icon && (
        <WellnessIconText
          style={{ fontFamily: Typography.family.body, fontSize: 18, marginBottom: 6 }}
        >
          {icon}
        </WellnessIconText>
      )}
      <Text
        style={{
          fontFamily: Typography.family.body,
          color: colors.mutedText,
          fontWeight: Typography.weight.semibold,
          fontSize: 13,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: Typography.family.body,
          fontSize: 22,
          fontWeight: Typography.weight.semibold,
          marginTop: 4,
          color: colors.text,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
