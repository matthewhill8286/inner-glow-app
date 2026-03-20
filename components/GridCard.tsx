import React from 'react';
import { View, Text, Pressable, StyleSheet, useColorScheme } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors, UI } from '@/constants/theme';

interface GridCardProps {
  title: string;
  icon: string;
  color: string;
  onPress: () => void;
  isLocked?: boolean;
}

export function GridCard({ title, icon, color, onPress, isLocked = false }: GridCardProps) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.gridItem,
        { backgroundColor: colors.card, opacity: pressed || isLocked ? 0.7 : 1 },
      ]}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 16,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 10,
        }}
      >
        <MaterialIcons name={icon as any} size={28} color={isLocked ? colors.mutedText : color} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Text style={[styles.gridLabel, { color: isLocked ? colors.mutedText : colors.text }]}>
          {title}
        </Text>
        {isLocked && <MaterialIcons name="lock" size={12} color={colors.mutedText} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gridItem: {
    flex: 1,
    minWidth: '45%',
    padding: 20,
    borderRadius: UI.radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  gridLabel: {
    fontWeight: '800',
    fontSize: 14,
  },
});
