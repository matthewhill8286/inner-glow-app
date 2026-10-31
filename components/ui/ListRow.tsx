import React from 'react';
import { ActivityIndicator, Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon, type IconName } from '@/components/icons/Icon';

/** White r24 container for grouped list rows (09 §2.2). Dividers sit under the label, not the icon. */
export function ListGroup({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[{ backgroundColor: palette.surface, borderRadius: 24, overflow: 'hidden' }, style]}>
      {rows.map((row, i) => (
        <View key={i}>
          {i > 0 && <View style={{ height: 1, backgroundColor: palette.surfaceLilac, marginLeft: 64, marginRight: 16 }} />}
          {row}
        </View>
      ))}
    </View>
  );
}

/**
 * Grouped list row (`List Row`, 09 §2.2): 36 icon disc, Medium 15 label, optional
 * Regular 12 supporting text, and a trailing chevron, value or custom element.
 */
export function ListRow({
  icon,
  label,
  supporting,
  value,
  trailing,
  chevron = !value && !trailing,
  busy = false,
  onPress,
  accessibilityLabel,
}: {
  icon?: IconName;
  label: string;
  supporting?: string;
  value?: string;
  trailing?: React.ReactNode;
  chevron?: boolean;
  busy?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress || busy}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ busy }}
      style={({ pressed }) => ({
        minHeight: 60,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {icon && (
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: palette.selected, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={20} />
        </View>
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[Type.body, { color: palette.ink }]}>{label}</Text>
        {supporting ? <Text style={{ ...Type.caption, fontWeight: '400', color: palette.textMuted }}>{supporting}</Text> : null}
      </View>
      {busy ? (
        <ActivityIndicator color={palette.plum} />
      ) : (
        <>
          {value ? <Text style={{ ...Type.caption, fontSize: 13, fontWeight: '400', color: palette.textMuted }}>{value}</Text> : null}
          {trailing}
          {chevron && <Icon name="arrow/chevron-right" size={18} />}
        </>
      )}
    </Pressable>
  );
}
