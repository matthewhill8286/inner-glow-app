import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle, TextStyle } from 'react-native';

/* ---------------------------
 * 1) NumberSelections (1..N selector)
 * -------------------------- */

type NumberSelectionsProps = {
  total: number; // e.g. 5
  value: number; // selected step (1-based)
  onChange?: (next: number) => void;
  containerStyle?: ViewStyle;
  pillStyle?: ViewStyle;
  numberStyle?: TextStyle;
  selectedCircleStyle?: ViewStyle;
  selectedNumberStyle?: TextStyle;
  disabled?: boolean;
};

export function NumberSelection({
  total,
  value,
  onChange,
  containerStyle,
  pillStyle,
  numberStyle,
  selectedCircleStyle,
  selectedNumberStyle,
  disabled,
}: NumberSelectionsProps) {
  const steps = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <View style={[styles.stepPillContainer, pillStyle, containerStyle]}>
      {steps.map((step) => {
        const isSelected = step === value;

        return (
          <Pressable
            key={step}
            disabled={disabled}
            onPress={() => onChange?.(step)}
            style={({ pressed }) => [styles.stepItem, pressed && !disabled ? styles.pressed : null]}
            hitSlop={10}
          >
            {isSelected ? (
              <View style={[styles.selectedOuterRing, selectedCircleStyle]}>
                <View style={styles.selectedInnerCircle}>
                  <Text style={[styles.stepNumberSelected, selectedNumberStyle]}>{step}</Text>
                </View>
              </View>
            ) : (
              <Text style={[styles.stepNumber, numberStyle]}>{step}</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------------------------
 * Styles (tuned to your screenshots)
 * -------------------------- */

const styles = StyleSheet.create({
  pressed: { opacity: 0.75 },

  // NumberSelections
  stepPillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    backgroundColor: '#F5F1EA',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,

    // subtle container shadow-ish feel (optional)
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  stepItem: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B6B43',
  },
  selectedOuterRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',

    // outer ring like the screenshot
    borderWidth: 3,
    borderColor: '#EBC9B7',
  },
  selectedInnerCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4E5A47', // deep olive
  },
  stepNumberSelected: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
