import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { AppButton, IconFab } from '@/components/ui/AppButton';
import { AppField } from '@/components/ui/AppField';
import { IconButton, StepTag, TitlePill, TopNav } from '@/components/ui/IconButton';
import { Chip, MetaChip, Tag } from '@/components/ui/Chip';
import { Checkbox, LegalNote, ProgressBar, Radio, SegmentedControl, SelectableCard, StepProgress, Toggle } from '@/components/ui/controls';
import { Icon } from '@/components/icons/Icon';
import { ICONS, type IconName } from '@/components/icons/iconData';
import { GlowField, GlowOrb } from '@/components/glow/Glow';
import { LogoLockup, LogoMark } from '@/components/brand/LogoMark';
import { GlowTabBar, type GlowTab } from '@/components/navigation/GlowTabBar';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

/**
 * Developer gallery of the design foundations (docs/design-handoff/00-foundations.md),
 * for checking components against Figma on a device. Hidden in release builds.
 */
export default function DesignSystemScreen() {
  const insets = useSafeAreaInsets();
  const [on, setOn] = useState(true);
  const [checked, setChecked] = useState(true);
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
  const [chip, setChip] = useState('Work');
  if (!__DEV__) return null;

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <GlowField
        glows={[
          { color: palette.mustard, opacity: 0.18, x: -40, y: -40, width: 220, blur: 90 },
          { color: palette.lavenderSoft, opacity: 0.28, x: 200, y: 20, width: 220, blur: 80 },
        ]}
      />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 10, paddingHorizontal: 24, paddingBottom: insets.bottom + 48, gap: 28 }}>
        <TopNav title="Design system" backLabel="Back" onBack={() => {}} trailing={<StepTag label="1 of 14" />} />

        <Section title="Type">
          {(Object.keys(Type) as (keyof typeof Type)[]).map((k) => (
            <Text key={k} style={[Type[k], { color: palette.ink }]}>
              {k} — The quiet glow
            </Text>
          ))}
        </Section>

        <Section title="Logo and orb">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <LogoMark size={56} />
            <LogoMark size={28} variant="mono" />
            <LogoLockup markSize={36} />
          </View>
          <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            <GlowOrb size={152} />
          </View>
        </Section>

        <Section title="Buttons">
          <AppButton title="Start practice" size="lg" icon="arrow/forward" />
          <AppButton title="Continue" />
          <AppButton title="Soft" variant="soft" />
          <AppButton title="Outline" variant="outline" />
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <AppButton title="Yes" size="lg" variant="selected" style={{ flex: 1 }} />
            <AppButton title="No" size="lg" variant="unselected" style={{ flex: 1 }} />
          </View>
          <AppButton title="Voice" variant="outline" icon="line/mic" iconPosition="left" style={{ alignSelf: 'flex-start' }} />
          <AppButton title="Prefer to skip, thanks" variant="ghost" icon="arrow/close" />
          <AppButton title="Delete account" variant="danger" />
          <AppButton title="Text button" variant="text" />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <IconFab accessibilityLabel="Next" />
            <IconFab size={64} icon="arrow/close" accessibilityLabel="Close" />
            <IconFab size={48} icon="line/mic" accessibilityLabel="Mic" />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <IconButton accessibilityLabel="Back 44" />
            <IconButton size={48} accessibilityLabel="Back 48" />
            <IconButton size={50} accessibilityLabel="Back 50" />
            <IconButton size={40} variant="glass" icon="arrow/close" accessibilityLabel="Close 40" />
            <TitlePill label="Glow score" />
          </View>
        </Section>

        <Section title="Inputs">
          <AppField label="Email Address" placeholder="hello@gmail.com" />
          <AppField label="Password" placeholder="Enter your password..." secureTextEntry revealable />
          <AppField label="With error" placeholder="Name" error="Please enter a name" />
        </Section>

        <Section title="Chips and tags">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {['Work', 'Breathing', 'Sleep'].map((c) => (
              <Chip key={c} label={c} selected={chip === c} onPress={() => setChip(c)} />
            ))}
            <Chip label="Evening" kind="option" selected />
            <Chip label="Caffeine" kind="factor" />
            <Chip label="Slow" kind="speed" selected />
            <Chip label="Normal" kind="speed" />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <MetaChip label="4 min" />
            <MetaChip label="Error 404" variant="info" icon="line/chart" />
            <MetaChip label="Go Pro" variant="pro" icon="line/crown" />
            <Tag label="Aspirin" onRemove={() => {}} />
          </View>
        </Section>

        <Section title="Controls">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
            <Toggle value={on} onValueChange={setOn} accessibilityLabel="Toggle" />
            <Radio selected />
            <Radio selected={false} />
            <Checkbox checked={checked} onChange={setChecked} accessibilityLabel="Agree" />
          </View>
          <SegmentedControl options={[{ value: 'kg', label: 'kg' }, { value: 'lbs', label: 'lbs' }]} value={unit} onChange={setUnit} />
          <SelectableCard selected onPress={() => {}}>
            <Text style={[Type.bodyStrong, { color: palette.ink }]}>Try guided AI support</Text>
          </SelectableCard>
          <SelectableCard selected={false} onPress={() => {}}>
            <Text style={[Type.bodyStrong, { color: palette.plumDeep }]}>Reduce daily stress</Text>
          </SelectableCard>
          <StepProgress step={2} total={5} />
          <ProgressBar value={0.6} width={276} />
          <ProgressBar value={0.4} width={191} height={6} gradient />
          <LegalNote text="INNER GLOW supports your wellbeing. It is not a medical service and does not replace professional care." />
        </Section>

        <Section title="Tab bar">
          <View style={{ height: 130, marginHorizontal: -24, justifyContent: 'flex-end' }}>
            <GlowTabBar {...TAB_BAR_MOCK} tabs={PREVIEW_TABS} activeRoute="home" />
          </View>
        </Section>

        <Section title="Icons">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
            {(Object.keys(ICONS) as IconName[]).map((name) => (
              <Icon key={name} name={name} size={24} accessibilityLabel={name} />
            ))}
          </View>
        </Section>
      </ScrollView>
      <TopFade height={insets.top + 24} />
    </View>
  );
}

/** Keeps scrolled content from running under the status bar: solid background fading out below it. */
function TopFade({ height }: { height: number }) {
  return (
    <Svg pointerEvents="none" width="100%" height={height} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
      <Defs>
        <LinearGradient id="topFade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={palette.bg} stopOpacity={1} />
          <Stop offset={String((height - 24) / height)} stopColor={palette.bg} stopOpacity={1} />
          <Stop offset="1" stopColor={palette.bg} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height={height} fill="url(#topFade)" />
    </Svg>
  );
}

const PREVIEW_TABS: GlowTab[] = [
  { route: 'home', label: 'Home', icon: 'line/home' },
  { route: 'mindful', label: 'Practices', icon: 'line/meditate' },
  { route: 'chat', label: 'Glow AI', icon: 'line/sparkle', centre: true },
  { route: 'journal', label: 'Journal', icon: 'line/journal' },
  { route: 'profile', label: 'Profile', icon: 'line/user' },
];

// Static navigator stand-ins so the bar can be previewed outside the tab navigator.
const TAB_BAR_MOCK = {
  state: { routes: PREVIEW_TABS.map((t) => ({ key: t.route, name: t.route })) },
  navigation: { emit: () => ({ defaultPrevented: true }), navigate: () => {} },
  descriptors: {},
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
} as unknown as BottomTabBarProps;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 12 }}>
      <Text style={[Type.eyebrow, { color: palette.lavender, textTransform: 'uppercase' }]}>{title}</Text>
      {children}
    </View>
  );
}
