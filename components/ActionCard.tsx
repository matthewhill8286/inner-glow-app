import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { UI, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface CardProps {
  title: string;
  description?: string;
  icon: any; // MaterialIcons name
  children?: React.ReactNode;
  onPress?: () => void;
  style?: any;
}

export const ActionCard = ({ title, description, icon, children, onPress, style }: CardProps) => {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  const content = (
    <View
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconWrap, { backgroundColor: colors.primary + '12' }]}>
          <MaterialIcons name={icon} size={22} color={colors.primary} />
        </View>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
      </View>
      {description && (
        <Text style={[styles.cardDescription, { color: colors.mutedText }]}>{description}</Text>
      )}
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress}>
        {({ pressed }) => (
          <View style={{ transform: [{ scale: pressed ? 0.98 : 1 }] }}>{content}</View>
        )}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: UI.radius.xxl,
    borderWidth: 1,
    ...UI.shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
});
