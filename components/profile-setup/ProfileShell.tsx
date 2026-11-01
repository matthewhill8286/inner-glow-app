import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { GlowField, type GlowSpec } from '@/components/glow/Glow';
import { IconButton } from '@/components/ui/IconButton';

/** Every profile setup frame starts with these two corner glows (`6676:3017` and on). */
export const SHELL_GLOWS: GlowSpec[] = [
  { color: palette.mustard, opacity: 0.28, x: 37.5, y: -10, width: 300, blur: 80 },
  { color: palette.lavenderSoft, opacity: 0.25, x: 170, y: 90, width: 200, blur: 80 },
];

const TRACK = 120;

/**
 * Step track (120×3 at the top centre): a plum track with a mustard → lavender fill, 30 per step of 4.
 * Every frame draws the track at full plum, so the empty part is as dark as the fill end (10 §3.3);
 * the code follows Figma.
 */
function StepTrack({ step, total }: { step: number; total: number }) {
  const fill = (TRACK * step) / total;
  return (
    <Svg width={TRACK} height={3} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total, now: step }}>
      <Defs>
        <LinearGradient id="profileStep" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={palette.mustard} />
          <Stop offset="1" stopColor={palette.lavender} />
        </LinearGradient>
      </Defs>
      <Rect width={TRACK} height={3} rx={1.5} fill={palette.plum} />
      <Rect width={fill} height={3} rx={1.5} fill="url(#profileStep)" />
    </Svg>
  );
}

/**
 * Profile setup shell (02 §4, re-extracted Nov 2026): the white library back button, the step track and
 * "Skip" on one row, a left-aligned SemiBold 26 title with a Regular 14 subtitle, the step body, and a
 * Primary L button pinned 48 above the home indicator, or with a SemiBold 14 lavender link 16 below it.
 */
export function ProfileShell({
  step,
  total,
  title,
  subtitle,
  onBack,
  onSkip,
  backLabel,
  skipLabel,
  glows = [],
  background,
  cta,
  link,
  scroll = true,
  children,
}: {
  step: number;
  total: number;
  title: string;
  subtitle: string;
  onBack: () => void;
  onSkip: () => void;
  backLabel: string;
  skipLabel: string;
  /** Glows on top of `SHELL_GLOWS`. */
  glows?: GlowSpec[];
  background?: React.ReactNode;
  cta: React.ReactNode;
  link?: { label: string; onPress: () => void };
  scroll?: boolean;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const body = (
    <View style={{ paddingHorizontal: 24, paddingTop: 30 }}>
      <View style={{ gap: 14 }}>
        <Text accessibilityRole="header" style={[Type.titleLg, { color: palette.ink }]}>
          {title}
        </Text>
        <Text style={[Type.bodySm, { lineHeight: 17, color: palette.textMuted }]}>{subtitle}</Text>
      </View>
      {children}
    </View>
  );
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <GlowField glows={[...SHELL_GLOWS, ...glows]} />
      {background}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ marginTop: insets.top + 10, height: 44, marginHorizontal: 24, flexDirection: 'row', alignItems: 'center' }}>
          <IconButton variant="nav" accessibilityLabel={backLabel} onPress={onBack} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <StepTrack step={step} total={total} />
          </View>
          <Pressable accessibilityRole="button" onPress={onSkip} hitSlop={12} style={{ width: 44, alignItems: 'flex-end' }}>
            <Text style={[Type.buttonS, { color: palette.lavender }]}>{skipLabel}</Text>
          </Pressable>
        </View>
        {scroll ? (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {body}
          </ScrollView>
        ) : (
          <View style={{ flex: 1 }}>{body}</View>
        )}
        <View style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: insets.bottom + (link ? 15 : 48), gap: 16 }}>
          {cta}
          {link && (
            <Pressable accessibilityRole="button" onPress={link.onPress} hitSlop={8} style={{ alignSelf: 'center' }}>
              <Text style={[Type.buttonS, { color: palette.lavender, textAlign: 'center' }]}>{link.label}</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
