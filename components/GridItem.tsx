import { Typography } from '@/constants/typography';
import { WellnessIconText } from '@/components/WellnessIconText';
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import MaterialIcons from '@/components/AppIcon';
import { UI, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface GridItemProps {
  title: string;
  icon: any; // MaterialIcons name
  emoji?: string;
  subtitle?: string;
  onPress: () => void;
  style?: any;
}

export const GridItem = ({ title, icon, emoji, subtitle, onPress, style }: GridItemProps) => {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.gridItem,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        style,
      ]}
    >
      {emoji ? (
        <View style={[styles.emojiWrap, { backgroundColor: colors.primary + '10' }]}>
          <WellnessIconText style={{ fontFamily: Typography.family.body, fontSize: 24 }}>
            {emoji}
          </WellnessIconText>
        </View>
      ) : (
        <View style={[styles.emojiWrap, { backgroundColor: colors.primary + '10' }]}>
          <MaterialIcons name={icon} size={28} color={colors.primary} />
        </View>
      )}
      <Text style={[styles.gridLabel, { color: colors.text }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.gridSublabel, { color: colors.mutedText }]}>{subtitle}</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  gridItem: {
    flex: 1,
    padding: 18,
    borderRadius: UI.radius.xxl,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    ...UI.shadow.sm,
  },
  emojiWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  gridLabel: {
    fontFamily: Typography.family.body,
    fontSize: 15,
    fontWeight: Typography.weight.medium,
  },
  gridSublabel: { fontFamily: Typography.family.body, fontSize: 12 },
});
