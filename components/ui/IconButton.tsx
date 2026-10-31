import React from 'react';
import { Pressable, Text, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon, type IconName } from '@/components/icons/Icon';

/**
 * Back / close buttons (00-foundations §4.2). Sizes seen in Figma:
 * 44 (icon 22, stroke 1.5), 48 (Top Nav, icon 24, stroke 1), 50 (icon 24, stroke 1.5),
 * and the glass close buttons at 40 (icon 20) and 44 (icon 22).
 */
export function IconButton({
  icon = 'arrow/back',
  size = 44,
  variant = 'outline',
  tone = 'plum',
  style,
  accessibilityLabel,
  ...props
}: Omit<PressableProps, 'style' | 'children'> & {
  icon?: IconName;
  size?: 40 | 44 | 48 | 50;
  variant?: 'outline' | 'glass';
  tone?: 'plum' | 'white';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
}) {
  const fg = tone === 'white' ? palette.white : palette.plum;
  const iconSize = size === 40 ? 20 : size === 44 ? 22 : 24;
  const glassBg = tone === 'white' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.80)';
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={size < 48 ? (48 - size) / 2 : undefined}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: variant === 'glass' ? glassBg : 'transparent',
          borderWidth: variant === 'outline' ? (size === 48 ? 1 : 1.5) : 0,
          borderColor: fg,
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <Icon name={icon} size={iconSize} color={fg} />
    </Pressable>
  );
}

/** Centred header title pill ("Tag Master" lg outlined, §4.3): h40, lavender outline. */
export function TitlePill({ label, tone = 'lavender', style }: { label: string; tone?: 'lavender' | 'ink'; style?: StyleProp<ViewStyle> }) {
  const color = tone === 'ink' ? palette.ink : palette.lavender;
  return (
    <View style={[{ height: 40, borderRadius: 32, paddingHorizontal: 14, borderWidth: 1, borderColor: color, justifyContent: 'center' }, style]}>
      <Text accessibilityRole="header" style={[Type.bodyStrong, { color, letterSpacing: -0.05 }]}>
        {label}
      </Text>
    </View>
  );
}

/** Step tag in the Top Nav ("1 of 14"): h28, radius 32, Bold 14, recoloured to selected/plum. */
export function StepTag({ label, style }: { label: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ height: 28, borderRadius: 32, paddingHorizontal: 10, justifyContent: 'center', backgroundColor: palette.selected }, style]}>
      <Text style={[Type.label, { fontWeight: '700', color: palette.plum }]}>{label}</Text>
    </View>
  );
}

/** Top Nav (§4.4): 48 back button, SemiBold 20 title, optional trailing element such as a StepTag. */
export function TopNav({
  title,
  onBack,
  backLabel,
  trailing,
  style,
}: {
  title?: string;
  onBack?: () => void;
  backLabel: string;
  trailing?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 }, style]}>
      {onBack && <IconButton size={48} accessibilityLabel={backLabel} onPress={onBack} />}
      {title ? (
        <Text accessibilityRole="header" numberOfLines={1} style={[Type.titleSm, { color: palette.plumDeep, flex: 1, letterSpacing: -0.1 }]}>
          {title}
        </Text>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      {trailing}
    </View>
  );
}

export type { IconName };
