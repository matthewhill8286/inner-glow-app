import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { UI, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface SummaryCardProps {
  title: string;
  onPress: () => void;
  icon: any; // MaterialIcons name
  style?: any;
  children: React.ReactNode;
}

export const SummaryCard = ({ title, onPress, icon, style, children }: SummaryCardProps) => {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.mutedText }]}>{title}</Text>
        <MaterialIcons name={icon} size={20} color={colors.mutedText} />
      </View>
      {children}
    </Pressable>
  );
};

export const SummaryRow = ({
  label,
  value,
  align = 'start',
}: {
  label: string;
  value: string;
  align?: 'start' | 'end';
}) => {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  return (
    <View
      style={{
        alignItems: align === 'start' ? 'flex-start' : 'flex-end',
        flex: align === 'start' ? 1 : 0,
      }}
    >
      <Text style={[styles.statLabel, { color: colors.subtleText }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 18,
    borderRadius: UI.radius.xxl,
    borderWidth: 1,
    ...UI.shadow.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
  },
});
