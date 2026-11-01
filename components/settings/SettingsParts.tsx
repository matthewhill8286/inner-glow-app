import React from 'react';
import { Image, ScrollView, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Circle, Stop } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { GlowField, type GlowSpec } from '@/components/glow/Glow';
import { NavBar } from '@/components/ui/IconButton';

/** 08 §1.2 default glows for settings screens. */
export const SETTINGS_GLOWS: GlowSpec[] = [
  { color: palette.lavenderSoft, opacity: 0.25, x: -70, y: -50, width: 280, blur: 90 },
  { color: palette.mustard, opacity: 0.15, x: 200, y: 40, width: 220, blur: 90 },
];

/**
 * Settings screen shell (06 §3.0, 08 §1.2): the library Nav Bar with a centred title, an optional
 * SemiBold 26–28 large title, content with 24 side padding, and an optional bottom CTA pinned 48
 * above the home indicator.
 */
export function SettingsScreen({
  title,
  backLabel,
  onBack,
  largeTitle,
  glows = SETTINGS_GLOWS,
  cta,
  children,
  contentStyle,
}: {
  title: string;
  backLabel: string;
  onBack: () => void;
  largeTitle?: string;
  glows?: GlowSpec[];
  cta?: React.ReactNode;
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <GlowField glows={glows} />
      <NavBar
        title={title}
        backLabel={backLabel}
        onBack={onBack}
        style={{ marginTop: insets.top + 10, marginHorizontal: 24 }}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          {
            paddingTop: 18,
            paddingHorizontal: 24,
            paddingBottom: cta ? 24 : insets.bottom + 32,
            gap: 28,
          },
          contentStyle,
        ]}
      >
        {largeTitle ? (
          <Text
            accessibilityRole="header"
            style={[
              Type.titleMd,
              { fontSize: 28, lineHeight: 36, color: palette.ink, marginBottom: -4 },
            ]}
          >
            {largeTitle}
          </Text>
        ) : null}
        {children}
      </ScrollView>
      {cta ? (
        <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: insets.bottom + 14 }}>
          {cta}
        </View>
      ) : null}
    </View>
  );
}

/** A section label (Bold 12 lavender) with its card 10 below. */
export function SettingsSection({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 10 }}>
      {label ? (
        <Text
          accessibilityRole="header"
          style={[Type.microBold, { fontSize: 12, lineHeight: 16, color: palette.lavender }]}
        >
          {label}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

/** Profile avatar (06 P1/P3): the photo, or the initial on a lilac → plum gradient circle. */
export function ProfileAvatar({
  size,
  name,
  photoUrl,
}: {
  size: number;
  name?: string | null;
  photoUrl?: string | null;
}) {
  const initial = (name ?? '').trim().charAt(0).toLocaleUpperCase() || '·';
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {photoUrl ? (
        <Image
          source={{ uri: photoUrl }}
          style={{ width: size, height: size }}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <>
          <Svg width={size} height={size} style={{ position: 'absolute' }}>
            <Defs>
              <LinearGradient id="avatarFill" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={palette.lavenderSoft} />
                <Stop offset="1" stopColor={palette.plum} />
              </LinearGradient>
            </Defs>
            <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#avatarFill)" />
          </Svg>
          <Text
            style={[
              Type.body,
              { fontSize: size * 0.354, lineHeight: size * 0.45, color: palette.white },
            ]}
          >
            {initial}
          </Text>
        </>
      )}
    </View>
  );
}
