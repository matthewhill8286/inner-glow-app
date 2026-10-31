import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { AppButton, IconFab } from '@/components/ui/AppButton';
import { AppField } from '@/components/ui/AppField';
import { IconButton, NavBar, StepTag, TitlePill, TopNav } from '@/components/ui/IconButton';
import { Chip, MetaChip, ProTag, Tag } from '@/components/ui/Chip';
import { ListGroup, ListRow } from '@/components/ui/ListRow';
import { BottomSheet, SheetPanel } from '@/components/ui/BottomSheet';
import { Toast } from '@/components/ui/Toast';
import { EmptyState } from '@/components/ui/EmptyState';
import AuraArt from '@/assets/svg/illustrations/empty/aura.svg';
import SearchingRings from '@/assets/svg/illustrations/assessment/searching-rings.svg';
import CheckinAura from '@/assets/svg/illustrations/setup/checkin-aura.svg';
import SleepSoundsHero from '@/assets/svg/illustrations/practices/sleep-sounds-hero.svg';
import BoxBreathingHero from '@/assets/svg/illustrations/practices/box-breathing-hero.svg';
import ShieldArt from '@/assets/svg/illustrations/settings/shield.svg';
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
  const [preset, setPreset] = useState('08:30');
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [reminders, setReminders] = useState(true);
  const [sound, setSound] = useState('Rain');
  const [favourite, setFavourite] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
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

        <Section title="Library · Nav bar and icon buttons">
          <NavBar title="Conversation history" backLabel="Back" onBack={() => {}} />
          <NavBar
            title="Favourites"
            backLabel="Back"
            onBack={() => {}}
            trailing={<IconButton variant="solid" icon={favourite ? 'line/heart-filled' : 'line/heart'} iconSize={20} active={favourite} onPress={() => setFavourite((f) => !f)} accessibilityLabel="Favourite" />}
          />
          <View style={{ backgroundColor: palette.ink, borderRadius: 24, padding: 12, gap: 12 }}>
            <NavBar title="Sleep" tone="dark" backLabel="Back" onBack={() => {}} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <IconButton variant="onDark" icon="arrow/close" accessibilityLabel="Close on dark" />
              <IconButton variant="nav" tone="white" accessibilityLabel="Back on dark" />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <IconButton variant="nav" accessibilityLabel="Back" />
            <IconButton variant="nav" icon="arrow/close" accessibilityLabel="Close outline" />
            <IconButton variant="filled" icon="arrow/close" accessibilityLabel="Close filled" />
            <IconButton variant="solid" icon="line/heart" iconSize={20} accessibilityLabel="Heart" />
            <IconButton variant="solid" icon="line/heart-filled" iconSize={20} active accessibilityLabel="Heart active" />
          </View>
        </Section>

        <Section title="Library · Buttons">
          <AppButton title="Continue" />
          <AppButton title="Continue" variant="secondary" />
          <AppButton title="Continue" variant="ghost" />
          <AppButton title="Continue" variant="danger" />
          <View style={{ backgroundColor: palette.ink, borderRadius: 24, padding: 12 }}>
            <AppButton title="Continue" variant="onDark" />
          </View>
          <Text style={[Type.labelM, { color: palette.lavender }]}>Disabled</Text>
          <AppButton title="Continue" disabled />
          <AppButton title="Continue" variant="secondary" disabled />
          <AppButton title="Continue" variant="ghost" disabled />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <AppButton title="Continue" size="s" />
            <AppButton title="Continue" size="s" variant="secondary" />
            <AppButton title="Continue" size="s" variant="ghost" />
            <AppButton title="Continue" size="s" variant="danger" />
            <AppButton title="Continue" size="s" disabled />
          </View>
        </Section>

        <Section title="Library · Fields">
          <AppField variant="box" label="Label" placeholder="Value" />
          <AppField variant="box" label="Label" defaultValue="Value" />
          <AppField variant="box" label="Label" defaultValue="Value" error="Something needs fixing" />
          <AppField variant="box" label="Label" defaultValue="Value" editable={false} />
          <AppField variant="search" placeholder="Search" />
        </Section>

        <Section title="Library · Chips, tags, segmented">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {['07:30', '08:30', '09:30'].map((t) => (
              <Chip key={t} kind="preset" label={t} selected={preset === t} onPress={() => setPreset(t)} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <Tag label="Work" />
            <Tag label="Tag" variant="brand" />
            <ProTag />
            <Tag label="Tag" variant="glow" />
            <View style={{ backgroundColor: palette.ink, borderRadius: 999, padding: 6 }}>
              <Tag label="Tag" variant="onDark" />
            </View>
            <Tag label="Aspirin" onRemove={() => {}} />
            <MetaChip label="4 min" />
          </View>
          <SegmentedControl variant="compact" options={[{ value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]} value={period} onChange={setPeriod} />
        </Section>

        <Section title="Library · List rows">
          <ListGroup>
            <ListRow icon="line/bell" label="Reminders" supportingText="Every day at 08:30" trailing="toggle" toggled={reminders} onToggle={setReminders} />
            <ListRow icon="line/globe" label="Language" value="English" onPress={() => {}} />
            <ListRow icon="line/shield" label="Security" onPress={() => {}} />
            <ListRow icon="line/moon" label="Bedtime" trailing="value" value="22:30" />
          </ListGroup>
          <ListGroup>
            {['Rain', 'Ocean', 'Birds'].map((s) => (
              <ListRow key={s} label={s} trailing="radio" selected={sound === s} onPress={() => setSound(s)} />
            ))}
          </ListGroup>
          <ListGroup appearance="card">
            <ListRow icon="line/heart" label="Label" value="Value" onPress={() => {}} />
            <ListRow icon="line/heart" label="Label" trailing="toggle" toggled onToggle={() => {}} />
          </ListGroup>
        </Section>

        <Section title="Library · Sheet, toast, empty state">
          <View style={{ marginHorizontal: -24, borderRadius: 0, overflow: 'hidden', backgroundColor: 'rgba(36,26,46,0.45)', paddingTop: 24 }}>
            <SheetPanel>
              <Text style={[Type.titleMd, { color: palette.ink }]}>Thursday, 30 October</Text>
              <Text style={[Type.bodySm, { color: palette.textMuted }]}>Inline preview of the sheet panel.</Text>
              <AppButton title="Open as a modal" onPress={() => setSheetOpen(true)} style={{ alignSelf: 'stretch' }} />
            </SheetPanel>
          </View>
          <Toast icon="line/heart" message="Saved to favourites" />
          <EmptyState glowColor={palette.lavenderSoft} title="No talks yet" body="Whatever’s on your mind, Glow AI is here to listen without judgement.">
            <AppButton title="Start a talk" />
          </EmptyState>
        </Section>

        <Section title="Library · Art">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
            <AuraArt width={120} height={120} />
            <SearchingRings width={96} height={96} />
            <ShieldArt width={150} height={105} />
            <CheckinAura width={160} height={147} />
          </View>
          <SleepSoundsHero width={327} height={176} />
          <BoxBreathingHero width={327} height={176} />
        </Section>

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
          <AppButton title="Prefer to skip, thanks" variant="tonal" icon="arrow/close" />
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
      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)}>
        <Text style={[Type.titleMd, { color: palette.ink }]}>Choose a sound</Text>
        <ListGroup style={{ alignSelf: 'stretch' }}>
          {['Rain', 'Ocean', 'Birds'].map((s) => (
            <ListRow key={s} label={s} trailing="radio" selected={sound === s} onPress={() => setSound(s)} />
          ))}
        </ListGroup>
        <AppButton title="Done" onPress={() => setSheetOpen(false)} style={{ alignSelf: 'stretch' }} />
      </BottomSheet>
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
