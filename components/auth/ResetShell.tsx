import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { GlowField } from '@/components/glow/Glow';
import { NavBar } from '@/components/ui/IconButton';

/**
 * Shared page for the password reset screens (08 §1.2): the lavender and gold glows, the Nav Bar
 * with an empty title, a 30 SemiBold title and the muted body at 24 side padding, then the screen's
 * content. The CTA is pinned 48 above the bottom safe area, or follows the content when `inlineCta`
 * is set (Forgot password, 01 §2.10).
 */
export function ResetShell({
  title,
  body,
  onBack,
  children,
  cta,
  inlineCta = false,
}: {
  title: string;
  body?: string;
  onBack?: () => void;
  children?: React.ReactNode;
  cta: React.ReactNode;
  inlineCta?: boolean;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <GlowField
        glows={[
          { color: palette.lavenderSoft, opacity: 0.25, x: -70, y: -50, width: 280, blur: 90 },
          { color: palette.mustard, opacity: 0.15, x: 200, y: 40, width: 220, blur: 90 },
        ]}
      />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 6,
          paddingHorizontal: 24,
          paddingBottom: Math.max(insets.bottom, 16) + 32,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: 44 }}>
          {onBack && <NavBar backLabel={t('common.back')} onBack={onBack} />}
        </View>
        <Text
          accessibilityRole="header"
          style={[Type.titleXl, { letterSpacing: 0, color: palette.ink, marginTop: 18 }]}
        >
          {title}
        </Text>
        {body ? (
          <Text style={[Type.bodyM, { lineHeight: 21, color: palette.textMuted, marginTop: 8 }]}>
            {body}
          </Text>
        ) : null}
        {children}
        {inlineCta ? (
          <View style={{ marginTop: 32 }}>{cta}</View>
        ) : (
          <>
            <View style={{ flex: 1, minHeight: 32 }} />
            {cta}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
