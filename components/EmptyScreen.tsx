import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { GlowField } from '@/components/glow/Glow';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppButton } from '@/components/ui/AppButton';
import { NavBar } from '@/components/ui/IconButton';
import { screenBottomPadding } from '@/lib/screen-layout';

/**
 * A whole screen that has nothing to show yet (09 §2.4, §3.5, §3.10–3.12): the corner glows
 * (mustard @0.15, lilac @0.25), a header, the shared `EmptyState` block and one primary action.
 *
 * - `header.kind = 'title'` (Journal): a SemiBold 30 title at y 70 and the action right under the
 *   empty block, as on tab roots.
 * - `header.kind = 'nav'` (Mood history, Glow score, Glow AI talks): the library Nav Bar and the
 *   action pinned at the bottom, above the tab bar when it shows.
 */
export function EmptyScreen({
  header,
  glowColor,
  title,
  body,
  action,
  tabBarVisible = true,
}: {
  header: { kind: 'title'; title: string } | { kind: 'nav'; title: string; onBack: () => void; backLabel: string };
  glowColor: string;
  title: string;
  body: string;
  action: { label: string; onPress: () => void };
  tabBarVisible?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const bottom = screenBottomPadding(insets.bottom, tabBarVisible);
  const button = <AppButton title={action.label} onPress={action.onPress} />;
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <GlowField
        glows={[
          { color: palette.mustard, opacity: 0.15, x: 200, y: 40, width: 220, blur: 90 },
          { color: palette.lavenderSoft, opacity: 0.25, x: -70, y: -50, width: 280, blur: 90 },
        ]}
      />
      {header.kind === 'title' ? (
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + 26, paddingHorizontal: 24, paddingBottom: bottom }}>
          <Text accessibilityRole="header" style={[Type.titleXl, { color: palette.ink }]}>
            {header.title}
          </Text>
          <EmptyState glowColor={glowColor} title={title} body={body} style={{ marginTop: 14 }} />
          <View style={{ marginTop: 24 }}>{button}</View>
        </ScrollView>
      ) : (
        <>
          <NavBar title={header.title} backLabel={header.backLabel} onBack={header.onBack} style={{ marginTop: insets.top + 10, marginHorizontal: 24 }} />
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 18, paddingHorizontal: 24 }}>
            <EmptyState glowColor={glowColor} title={title} body={body} />
          </ScrollView>
          <View style={{ paddingHorizontal: 24, paddingBottom: tabBarVisible ? bottom : insets.bottom + 48 }}>{button}</View>
        </>
      )}
    </View>
  );
}
