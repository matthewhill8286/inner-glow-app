import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Chip } from '@/components/ui/Chip';
import { FEELINGS, toggleFeeling, type Feeling } from '@/lib/feelings';

/** Pick any number of feelings (TestFlight report 38). */
export function FeelingChips({
  value,
  onChange,
  style,
}: {
  value: Feeling[];
  onChange: (next: Feeling[]) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { t } = useTranslation();
  return (
    <View
      accessibilityRole="list"
      style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, style]}
    >
      {FEELINGS.map((f) => (
        <Chip
          key={f}
          label={t(`feelings.${f}`)}
          selected={value.includes(f)}
          onPress={() => onChange(toggleFeeling(value, f))}
        />
      ))}
    </View>
  );
}
