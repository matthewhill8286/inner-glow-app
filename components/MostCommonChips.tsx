/* ---------------------------
 * 2) MostCommonChips
 * -------------------------- */

import { Pressable, StyleSheet, TextStyle, View, Text, ViewStyle } from 'react-native';

export type Chip = { id: string; label: string };

type MostCommonChipsProps = {
  title?: string; // default "Most Common:"
  chips: Chip[];
  onRemove?: (chipId: string) => void;
  // Optional selected state support (purely visual unless consumers change handlers)
  selectedIds?: string[] | Set<string>;
  containerStyle?: ViewStyle;
  titleStyle?: TextStyle;
  chipStyle?: ViewStyle;
  chipTextStyle?: TextStyle;
  chipRemoveTextStyle?: TextStyle;
  selectedChipStyle?: ViewStyle;
  selectedChipTextStyle?: TextStyle;
  selectedChipRemoveTextStyle?: TextStyle;
};

export function MostCommonChips({
  title = 'Most Common:',
  chips,
  onRemove,
  selectedIds,
  containerStyle,
  titleStyle,
  chipStyle,
  chipTextStyle,
  chipRemoveTextStyle,
  selectedChipStyle,
  selectedChipTextStyle,
  selectedChipRemoveTextStyle,
}: MostCommonChipsProps) {
  const isSelected = (id: string) => {
    if (!selectedIds) return false;
    return Array.isArray(selectedIds) ? selectedIds.includes(id) : selectedIds.has(id);
  };

  return (
    <View style={[styles.chipsRow, containerStyle]}>
      <Text style={[styles.chipsTitle, titleStyle]}>{title}</Text>

      <View style={styles.chipsWrap}>
        {chips.map((chip) => {
          const active = isSelected(chip.id);
          return (
            <Pressable
              key={chip.id}
              onPress={() => onRemove?.(chip.id)}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [
                styles.chip,
                chipStyle,
                active ? [styles.chipSelected, selectedChipStyle] : null,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  chipTextStyle,
                  active ? [styles.chipTextSelected, selectedChipTextStyle] : null,
                ]}
              >
                {chip.label}
              </Text>

              {/* Decorative close to indicate removable/togglable, whole chip is pressable */}
              <View style={[styles.chipRemoveBtn, active ? styles.chipRemoveBtnSelected : null]}>
                <Text
                  style={[
                    styles.chipRemoveText,
                    chipRemoveTextStyle,
                    active ? [styles.chipRemoveTextSelected, selectedChipRemoveTextStyle] : null,
                  ]}
                >
                  ×
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/* ---------------------------
 * Styles (tuned to your screenshots)
 * -------------------------- */

const styles = StyleSheet.create({
  pressed: { opacity: 0.75 },
  // MostCommonChips
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B6B43',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,

    backgroundColor: '#F2ECE6', // neutral/unstyled look (not selected)
    borderRadius: 999,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E6DDD6',
  },
  chipSelected: {
    backgroundColor: '#828a6a',
    borderColor: '#828a6a',
  },
  chipText: {
    color: '#6A5E55',
    fontSize: 14,
    fontWeight: '700',
  },
  chipTextSelected: {
    color: 'white',
  },
  chipRemoveBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EADFD8',
  },
  chipRemoveBtnSelected: {
    backgroundColor: '#6f7a5d',
  },
  chipRemoveText: {
    color: '#6A5E55',
    opacity: 0.7,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 18,
    marginTop: -1,
  },
  chipRemoveTextSelected: {
    color: 'white',
    opacity: 1,
  },
});
