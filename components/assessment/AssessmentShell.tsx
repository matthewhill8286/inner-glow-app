import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { GlowField, type GlowSpec } from '@/components/glow/Glow';
import { TopNav } from '@/components/ui/IconButton';
import { Tag } from '@/components/ui/Chip';

/**
 * Assessment shell (02 §2, re-extracted Nov 2026): the step-colour top glow, the Top Nav with a
 * 48 back button, "Assessment" and the "N of M" Tag, the question title (SemiBold 30 plum-deep,
 * centred), the step body, and the bottom actions pinned 48 above the home indicator.
 *
 * `background` is drawn behind everything (full-frame art such as the age aura or the sleep moons).
 */
export function AssessmentShell({
  navTitle,
  title,
  backLabel,
  onBack,
  stepLabel,
  glows,
  background,
  titleWidth = 343,
  titleGap = 48,
  actions,
  compactActions = false,
  scroll = true,
  children,
  contentStyle,
}: {
  /** "Assessment" in the Top Nav. */
  navTitle: string;
  title: string;
  backLabel: string;
  onBack: () => void;
  stepLabel: string;
  glows: GlowSpec[];
  background?: React.ReactNode;
  /** Some titles wrap narrower in Figma (A5 290, A8 340). */
  titleWidth?: number;
  titleGap?: number;
  actions: React.ReactNode;
  /** Actions with a Skip link under Continue sit lower, on the home indicator inset. */
  compactActions?: boolean;
  scroll?: boolean;
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const body = (
    <>
      <Text accessibilityRole="header" style={[Type.titleXl, { color: palette.plumDeep, textAlign: 'center', letterSpacing: 0, width: titleWidth, maxWidth: '100%', alignSelf: 'center' }]}>
        {title}
      </Text>
      <View style={[{ marginTop: titleGap }, contentStyle]}>{children}</View>
    </>
  );
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <GlowField glows={glows} />
      {background}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TopNav
          title={navTitle}
          backLabel={backLabel}
          onBack={onBack}
          style={{ marginTop: insets.top + 16, marginHorizontal: 16 }}
          trailing={<Tag label={stepLabel} style={{ alignSelf: 'center' }} />}
        />
        {scroll ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingTop: 40, paddingHorizontal: 16, paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {body}
          </ScrollView>
        ) : (
          <View style={{ flex: 1, paddingTop: 40, paddingHorizontal: 16 }}>{body}</View>
        )}
        <View style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: insets.bottom + (compactActions ? 0 : 48), gap: compactActions ? 8 : 12, alignItems: 'stretch' }}>
          {actions}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

/** A centred caption above a block, as on the medication search ("3 results", "Selected"). */
export function SectionCaption({ children }: { children: string }) {
  return <Text style={[Type.labelM, { color: palette.lavender }]}>{children}</Text>;
}
