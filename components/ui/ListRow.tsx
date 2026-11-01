import React from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon, type IconName } from '@/components/icons/Icon';
import { Radio, Toggle } from '@/components/ui/controls';

/**
 * List Row, library set `6746:4495` (00-foundations §11.3).
 *
 * Row 60 high, padding 12/16, gap 12. Optional leading bubble 36 `#F1ECF5` r18 with a 20pt Icon/Line.
 * Label Medium 15 ink; supporting text Regular 12 muted, 2 below. Trailing: chevron 18 (with an
 * optional value), toggle 46×28, radio 22, or value Regular 13 muted.
 *
 * Style Grouped: rows sit in a `ListGroup` card (`#FFFFFF` r24, no padding) and every row but the
 * first has a 1px `#EFEAF2` divider from the label to 16 before the right edge. Figma keeps the
 * divider at x 64 even without an icon; here it starts at 16 in that case.
 * Style Card: each row is its own `#FFFFFF` r20 card.
 */
export type ListTrailing = 'chevron' | 'toggle' | 'radio' | 'value' | 'none';
export type ListStyle = 'grouped' | 'card';

export type ListRowProps = {
  label: string;
  supportingText?: string;
  icon?: IconName;
  trailing?: ListTrailing;
  /** Value text: the trailing for `value`, and shown before the chevron for `chevron`. */
  value?: string;
  /** Toggle state for `trailing="toggle"`. */
  toggled?: boolean;
  onToggle?: (v: boolean) => void;
  /** Radio state for `trailing="radio"`. */
  selected?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  /** Keeps the label and supporting text to one line each (talk lists). */
  singleLine?: boolean;
  /** Destructive row (06 §3.0): `#FBEDEE` bubble, icon and label in danger red. */
  tone?: 'default' | 'danger';
  /** Toggle knob colour; Notifications and Security use `#FFF6D6` (08 §1.1). */
  knobColor?: string;
  /** Accessibility label for the switch when the row itself opens something else. */
  toggleLabel?: string;
  /** Set by `ListGroup`. */
  divider?: boolean;
  /** Set by `ListGroup`. */
  appearance?: ListStyle;
};

export function ListRow({
  label,
  supportingText,
  icon,
  trailing = 'chevron',
  value,
  toggled = false,
  onToggle,
  selected = false,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  style,
  singleLine = false,
  tone = 'default',
  knobColor,
  toggleLabel,
  divider = false,
  appearance = 'grouped',
}: ListRowProps) {
  const isToggle = trailing === 'toggle';
  const danger = tone === 'danger';
  // A toggle row with its own onPress (a reminder that opens its time sheet) keeps a live switch.
  const splitToggle = isToggle && !!onToggle && !!onPress;
  const press = isToggle && onToggle && !onPress ? () => onToggle(!toggled) : onPress;
  const role =
    isToggle && !splitToggle
      ? 'switch'
      : trailing === 'radio'
        ? 'radio'
        : press
          ? 'button'
          : undefined;
  const state =
    isToggle && !splitToggle
      ? { checked: toggled }
      : trailing === 'radio'
        ? { selected }
        : undefined;

  return (
    <Pressable
      accessibilityRole={role}
      accessibilityState={state}
      accessibilityHint={accessibilityHint}
      accessibilityLabel={
        accessibilityLabel ?? (supportingText ? `${label}, ${supportingText}` : label)
      }
      accessibilityValue={
        trailing === 'value' || (trailing === 'chevron' && value) ? { text: value } : undefined
      }
      onPress={press}
      disabled={!press}
      style={({ pressed }) => [
        {
          minHeight: 60,
          paddingVertical: 12,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          backgroundColor: pressed
            ? palette.surfaceLilacSoft
            : appearance === 'card'
              ? palette.surface
              : 'transparent',
          borderRadius: appearance === 'card' ? 20 : 0,
        },
        style,
      ]}
    >
      {divider && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: icon ? 64 : 16,
            right: 16,
            height: 1,
            backgroundColor: palette.surfaceLilac,
          }}
        />
      )}
      {icon && (
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: danger ? palette.dangerSoft : palette.selected,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={20} color={danger ? palette.danger : undefined} />
        </View>
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          numberOfLines={singleLine ? 1 : undefined}
          style={[Type.bodyMMedium, { color: danger ? palette.danger : palette.ink }]}
        >
          {label}
        </Text>
        {supportingText ? (
          <Text
            numberOfLines={singleLine ? 1 : undefined}
            style={[Type.captionS, { color: palette.textMuted }]}
          >
            {supportingText}
          </Text>
        ) : null}
      </View>
      {(trailing === 'value' || trailing === 'chevron') && value ? (
        <Text style={[Type.captionM, { color: palette.textMuted }]}>{value}</Text>
      ) : null}
      {trailing === 'chevron' && <Icon name="arrow/chevron-right" size={18} />}
      {/* Unless the row opens something else, it handles the press and the switch is display-only. */}
      {splitToggle ? (
        <Toggle
          value={toggled}
          onValueChange={onToggle!}
          knobColor={knobColor}
          accessibilityLabel={toggleLabel ?? label}
        />
      ) : (
        isToggle && (
          <View pointerEvents="none">
            <Toggle value={toggled} onValueChange={() => {}} knobColor={knobColor} />
          </View>
        )
      )}
      {trailing === 'radio' && <Radio selected={selected} />}
    </Pressable>
  );
}

/** Wraps `ListRow`s: one white r24 card with dividers (`grouped`), or a stack of r20 row cards (`card`). */
export function ListGroup({
  children,
  appearance = 'grouped',
  gap = 8,
  style,
}: {
  children: React.ReactNode;
  appearance?: ListStyle;
  /** Space between rows in the `card` style. */
  gap?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const rows = React.Children.toArray(children).filter(
    React.isValidElement,
  ) as React.ReactElement<ListRowProps>[];
  const grouped = appearance === 'grouped';
  return (
    <View
      style={[
        grouped
          ? { backgroundColor: palette.surface, borderRadius: 24, overflow: 'hidden' }
          : { gap },
        style,
      ]}
    >
      {rows.map((row, i) => React.cloneElement(row, { divider: grouped && i > 0, appearance }))}
    </View>
  );
}
