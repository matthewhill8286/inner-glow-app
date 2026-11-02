import React from 'react';
import { Pressable, ScrollView, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { GlowField, type GlowSpec } from '@/components/glow/Glow';
import { AppButton } from '@/components/ui/AppButton';
import { IconButton } from '@/components/ui/IconButton';

type Action = { label: string; onPress: () => void; busy?: boolean };

/** Close a moment: back to where it was opened from, else Home. */
export function closeMoment() {
  if (router.canGoBack()) router.back();
  else router.replace('/(tabs)/home');
}

/**
 * Moment chrome (03 §3.2): full screen with no tab bar, glows behind, a close button top right,
 * then a primary button, an optional outlined button and a text link pinned at the bottom.
 * `dark` is the night look (white close at 12 %, light button, white link).
 */
export function MomentShell({
  glows = [],
  background,
  dark = false,
  children,
  cta,
  secondary,
  link,
  contentStyle,
}: {
  glows?: GlowSpec[];
  /** Drawn behind everything, under the glows (gradients, star fields). */
  background?: React.ReactNode;
  dark?: boolean;
  children: React.ReactNode;
  cta?: Action;
  secondary?: Action;
  link?: Action;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: dark ? palette.ink : palette.bg }}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      {background}
      <GlowField glows={glows.map((g) => ({ ...g, y: g.y + insets.top - 44 }))} />
      <IconButton
        size={44}
        variant="glass"
        tone={dark ? 'white' : 'plum'}
        icon="arrow/close"
        accessibilityLabel={t('common.close')}
        onPress={closeMoment}
        style={{ position: 'absolute', right: 24, top: insets.top + 10, zIndex: 2 }}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[{ paddingTop: insets.top + 74, paddingHorizontal: 24, paddingBottom: 24 }, contentStyle]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {(cta || secondary || link) && (
        <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 12, paddingTop: 8, gap: 10 }}>
          {cta && (
            <AppButton
              title={cta.label}
              busy={cta.busy}
              onPress={cta.onPress}
              textStyle={dark ? { color: palette.ink } : undefined}
              style={dark ? { backgroundColor: palette.softButton } : undefined}
            />
          )}
          {secondary && (
            <AppButton
              variant="outline"
              title={secondary.label}
              busy={secondary.busy}
              onPress={secondary.onPress}
              style={{ backgroundColor: 'transparent' }}
              textStyle={{ color: palette.plumDeep }}
            />
          )}
          {link && (
            <Pressable accessibilityRole="button" onPress={link.onPress} hitSlop={8} style={{ alignSelf: 'center', minHeight: 36, justifyContent: 'center' }}>
              <Text style={[Type.label, { fontWeight: '700', color: dark ? 'rgba(255,255,255,0.70)' : palette.lavender }]}>{link.label}</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

/** "TODAY · 09:00 → 14:20" style eyebrow. */
export function Eyebrow({ text, dark = false, style }: { text: string; dark?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={style}>
      <Text style={[Type.labelM, { letterSpacing: 0.72, color: dark ? 'rgba(255,255,255,0.60)' : palette.textSubtle }]}>{text.toUpperCase()}</Text>
    </View>
  );
}

/** White stat tile (Calm wave, Night sleep): value over a caption. */
export function StatTile({ value, caption, dark = false }: { value: string; caption: string; dark?: boolean }) {
  return (
    <View style={{ flex: 1, borderRadius: dark ? 20 : 22, paddingVertical: dark ? 10 : 12, paddingHorizontal: dark ? 14 : 16, gap: 2, backgroundColor: dark ? 'rgba(255,255,255,0.08)' : palette.white }}>
      <Text style={[dark ? Type.headline : Type.titleMd, { color: dark ? palette.white : palette.plumDeep }]}>{value}</Text>
      <Text style={[Type.caption, { fontWeight: '500', color: dark ? 'rgba(255,255,255,0.60)' : palette.textMuted }]}>{caption}</Text>
    </View>
  );
}
