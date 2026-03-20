import React from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';

type ChipsProps = {
  options: string[];
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
};

export default function Chips({
  options,
  value,
  onChange,
  multiple = false,
}: Readonly<ChipsProps>) {
  const selected = Array.isArray(value) ? value : value ? [value] : [];

  function toggle(option: string) {
    if (multiple) {
      if (selected.includes(option)) onChange(selected.filter((v) => v !== option));
      else onChange([...selected, option]);
    } else {
      onChange(option);
    }
  }

  return (
    <View style={styles.container}>
      {options.map((option) => {
        const isActive = selected.includes(option);
        return (
          <Chip key={option} label={option} active={isActive} onPress={() => toggle(option)} />
        );
      })}
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
}: Readonly<{ label: string; active: boolean; onPress: () => void }>) {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const scale = React.useRef(new Animated.Value(1)).current;

  function pressIn() {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  }
  function pressOut() {
    Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={[
          styles.chip,
          { backgroundColor: colors.inputBg },
          active && { backgroundColor: colors.primary },
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
      >
        <Text style={[styles.text, { color: colors.text }, active && { color: colors.onPrimary }]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: UI.radius.pill },
  text: { fontSize: 15, fontWeight: '700' },
});
