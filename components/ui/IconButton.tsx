import React from 'react';
import { Pressable, Text, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon, type IconName } from '@/components/icons/Icon';

/**
 * Back / close buttons.
 *
 * Library looks (00-foundations §11.2), all 44 with a 22 icon:
 * - `nav`: Back Button Theme=Light `6746:4449` and Icon Button Outline `6753:4131`,
 *   white @0.70 with a 1px `#CFC6D6` stroke. With `tone="white"` it is Back Button Theme=Dark `6746:4453`.
 * - `filled`: Icon Button Filled `6753:4135`, `#F1ECF5` with no stroke.
 * - `onDark`: Icon Button On dark `6753:4139`, white @0.08 with a white @0.20 stroke.
 * - `solid`: the white right-slot circle on the practice screens (not a component); `active` fills it `#F1ECF5`.
 *
 * Earlier per-screen looks (§4.2): `outline` 44 (icon 22, stroke 1.5), 48 (Top Nav, icon 24, stroke 1),
 * 50 (icon 24, stroke 1.5), and the `glass` close buttons at 40 (icon 20) and 44 (icon 22).
 */
export type IconButtonVariant = 'outline' | 'glass' | 'nav' | 'filled' | 'onDark' | 'solid';

export function IconButton({
  icon = 'arrow/back',
  size = 44,
  variant = 'outline',
  tone = 'plum',
  active = false,
  iconSize: iconSizeProp,
  style,
  accessibilityLabel,
  ...props
}: Omit<PressableProps, 'style' | 'children'> & {
  icon?: IconName;
  size?: 40 | 44 | 48 | 50;
  variant?: IconButtonVariant;
  tone?: 'plum' | 'white';
  /** Selected state of the `solid` right-slot button (for example a favourited heart). */
  active?: boolean;
  /** Overrides the icon size picked from `size` (the right-slot icons are 20). */
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
}) {
  const white = tone === 'white' || variant === 'onDark';
  const fg = white ? palette.white : palette.plum;
  const iconSize = iconSizeProp ?? (size === 40 ? 20 : size === 44 ? 22 : 24);
  const look = (() => {
    switch (variant) {
      case 'nav':
        return white
          ? { bg: 'transparent', borderWidth: 1, border: 'rgba(255,255,255,0.40)' }
          : { bg: 'rgba(255,255,255,0.70)', borderWidth: 1, border: palette.borderStrong };
      case 'filled':
        return { bg: palette.selected, borderWidth: 0, border: undefined };
      case 'onDark':
        return { bg: 'rgba(255,255,255,0.08)', borderWidth: 1, border: 'rgba(255,255,255,0.20)' };
      case 'solid':
        return { bg: active ? palette.selected : palette.white, borderWidth: 0, border: undefined };
      case 'glass':
        return { bg: white ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.80)', borderWidth: 0, border: undefined };
      default:
        return { bg: 'transparent', borderWidth: size === 48 ? 1 : 1.5, border: fg };
    }
  })();
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={variant === 'solid' ? { selected: active } : undefined}
      hitSlop={size < 48 ? (48 - size) / 2 : undefined}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: look.bg,
          borderWidth: look.borderWidth,
          borderColor: look.border,
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

/**
 * Header row.
 * - `layout="bar"` is the library Nav Bar `6753:4187` (§11.1): 44 nav back button, title
 *   SemiBold 15 `#4E3A5E` centred between two 44 slots, gap 8. `tone="dark"` is Theme=Dark `6753:4176`.
 * - `layout="top"` (default) is the older Top Nav (§4.4): 48 back button, SemiBold 20 title on the left,
 *   optional trailing element such as a StepTag.
 */
export function TopNav({
  title,
  onBack,
  backLabel,
  trailing,
  layout = 'top',
  tone = 'light',
  style,
}: {
  title?: string;
  onBack?: () => void;
  backLabel: string;
  trailing?: React.ReactNode;
  layout?: 'top' | 'bar';
  tone?: 'light' | 'dark';
  style?: StyleProp<ViewStyle>;
}) {
  if (layout === 'bar') {
    return (
      <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 44 }, style]}>
        <View style={{ width: 44, height: 44 }}>
          {onBack && <IconButton variant="nav" tone={tone === 'dark' ? 'white' : 'plum'} accessibilityLabel={backLabel} onPress={onBack} />}
        </View>
        <Text
          accessibilityRole="header"
          numberOfLines={1}
          style={[Type.bodyMSemi, { flex: 1, textAlign: 'center', color: tone === 'dark' ? palette.white : palette.plumDeep }]}
        >
          {title}
        </Text>
        <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>{trailing}</View>
      </View>
    );
  }
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

/** Library Nav Bar (`6753:4187`): `TopNav` with the centred-title bar layout. */
export function NavBar(props: Omit<React.ComponentProps<typeof TopNav>, 'layout'>) {
  return <TopNav {...props} layout="bar" />;
}

export type { IconName };
