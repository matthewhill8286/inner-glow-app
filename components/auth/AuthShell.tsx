import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { GlowField } from '@/components/glow/Glow';
import { LogoMark } from '@/components/brand/LogoMark';

/**
 * Shared page for Sign in and Sign up (01 §2.8, §2.9): gold glow, the "inner glow" lockup at
 * the top, a centred title, then the screen's form. Fields sit on the page with no card.
 */
export function AuthShell({ title, children, footer }: { title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: palette.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <GlowField glows={[{ color: palette.mustard, opacity: 0.22, x: 37, y: -20, width: 300, blur: 90 }]} />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 26, paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }} accessibilityRole="image" accessibilityLabel="inner glow">
          <LogoMark size={36} coreColor={palette.lavender} />
          <Text style={{ ...Type.titleSm, lineHeight: 24, letterSpacing: -0.6, color: palette.plumDeep }}>inner glow</Text>
        </View>
        <Text accessibilityRole="header" style={{ ...Type.display, fontSize: 30, lineHeight: 38, letterSpacing: -0.3, color: palette.plumDeep, textAlign: 'center', marginTop: 44 }}>
          {title}
        </Text>
        {children}
        {footer ? (
          <>
            <View style={{ flex: 1, minHeight: 24 }} />
            {footer}
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Bold 14 muted line with a plum link, used under both forms. */
export function AuthLinkLine({ lead, link, onPress }: { lead: string; link: string; onPress: () => void }) {
  return (
    <Text style={{ ...Type.label, fontWeight: '700', letterSpacing: -0.2, color: palette.textMuted, textAlign: 'center' }}>
      {lead}{' '}
      <Text accessibilityRole="link" onPress={onPress} style={{ color: palette.plum }}>
        {link}
      </Text>
    </Text>
  );
}
