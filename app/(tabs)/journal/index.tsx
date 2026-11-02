import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Svg, { Circle, Defs, Polyline, RadialGradient, Stop } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon } from '@/components/icons/Icon';
import type { IconName } from '@/components/icons/iconData';
import { Glow, GlowField } from '@/components/glow/Glow';
import { IconButton } from '@/components/ui/IconButton';
import { EmptyScreen } from '@/components/EmptyScreen';
import { EntryCard } from '@/components/journal/EntryCard';
import { useJournal } from '@/hooks/useJournal';
import { monthDots } from '@/lib/journal-entry';
import { activeDays, streak } from '@/lib/profile-stats';
import { screenBottomPadding } from '@/lib/screen-layout';

const DOT = 8;
const ROW_GAP = 40;
const HALO = 9;
const RECENT = 3;

/** The month constellation (04 J1 `6681:3233`): gold logged days with halos, open rings for the rest, joined in date order. */
function MonthDots({ dots, perRow }: ReturnType<typeof monthDots>) {
  const [width, setWidth] = useState(0);
  // Early in the month there is only the first row. HALO leaves room for the glow round edge dots.
  const height = (dots.length > perRow ? ROW_GAP : 0) + HALO * 2;
  const step = perRow > 1 ? (width - HALO * 2) / (perRow - 1) : 0;
  const centre = (i: number) => ({
    x: HALO + (i % perRow) * step,
    y: HALO + Math.floor(i / perRow) * ROW_GAP,
  });
  const line = dots
    .map((d, i) => (d.state === 'logged' ? centre(i) : null))
    .filter((p): p is { x: number; y: number } => !!p)
    .map((p) => `${p.x},${p.y}`)
    .join(' ');

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height }}>
      {width > 0 && (
        <Svg width={width} height={height}>
          <Defs>
            <RadialGradient id="dayHalo" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={palette.mustard} stopOpacity={0.55} />
              <Stop offset="1" stopColor={palette.mustard} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          {line.includes(' ') && (
            <Polyline points={line} fill="none" stroke="rgba(226,204,64,0.55)" strokeWidth={1.2} />
          )}
          {dots.map((d, i) => {
            const { x, y } = centre(i);
            if (d.state === 'logged')
              return (
                <React.Fragment key={d.day}>
                  <Circle cx={x} cy={y} r={HALO} fill="url(#dayHalo)" />
                  <Circle cx={x} cy={y} r={DOT / 2} fill={palette.mustard} />
                </React.Fragment>
              );
            return (
              <Circle
                key={d.day}
                cx={x}
                cy={y}
                r={d.state === 'today' ? 3 : 3.4}
                fill="none"
                stroke={d.state === 'today' ? palette.plum : '#D6CCC0'}
                strokeWidth={d.state === 'today' ? 2 : 1.2}
              />
            );
          })}
        </Svg>
      )}
    </View>
  );
}

function EntryTile({
  icon,
  title,
  sub,
  glow,
  onPress,
}: {
  icon: IconName;
  title: string;
  sub: string;
  glow: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${sub}`}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        height: 124,
        borderRadius: 24,
        backgroundColor: palette.white,
        padding: 16,
        overflow: 'hidden',
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <Glow
        color={glow}
        opacity={0.45}
        width={90}
        blur={22}
        style={{ position: 'absolute', left: 75, top: -15 }}
      />
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: palette.plum,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={20} color={palette.white} />
      </View>
      <Text
        style={[
          Type.bodyStrong,
          { lineHeight: 22, letterSpacing: 0, color: palette.ink, marginTop: 12 },
        ]}
      >
        {title}
      </Text>
      <Text style={[Type.captionS, { color: palette.textSubtle, marginTop: 2 }]}>{sub}</Text>
    </Pressable>
  );
}

/**
 * Journal home (04 J1): the title with Search and Stats, the month constellation with the journal
 * streak, the Write and Speak tiles, and the three most recent entries. Before the first entry the
 * whole screen is the empty state (09 §3.11).
 */
export default function JournalHome() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { journalEntries, isLoading } = useJournal();
  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, []),
  );

  const dates = useMemo(() => journalEntries.map((e) => e.createdAt), [journalEntries]);
  const month = useMemo(() => monthDots(dates), [dates]);
  const days = useMemo(() => streak(activeDays(dates)).count, [dates]);
  const monthName = new Intl.DateTimeFormat(i18n.language, { month: 'long' })
    .format(new Date())
    .toUpperCase();

  if (!isLoading && journalEntries.length === 0) {
    return (
      <EmptyScreen
        header={{ kind: 'title', title: t('emptyStates.journal.title') }}
        glowColor={palette.lavenderSoft}
        title={t('emptyStates.journal.emptyTitle')}
        body={t('emptyStates.journal.body')}
        action={{
          label: t('emptyStates.journal.action'),
          onPress: () => router.push('/(tabs)/journal/new'),
        }}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <GlowField
        glows={[
          { color: palette.mustard, opacity: 0.3, x: -50, y: -20, width: 280, blur: 80 },
          { color: palette.lavenderSoft, opacity: 0.25, x: 180, y: 60, width: 220, blur: 80 },
        ]}
      />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 24,
          paddingBottom: screenBottomPadding(insets.bottom),
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text
            accessibilityRole="header"
            style={[
              Type.titleXl,
              { flex: 1, lineHeight: 42, letterSpacing: 0, color: palette.ink },
            ]}
          >
            {t('journalHome.title')}
          </Text>
          <IconButton
            icon="line/search"
            variant="solid"
            iconSize={20}
            accessibilityLabel={t('journalHome.search')}
            onPress={() => router.push('/(tabs)/search')}
          />
          <IconButton
            icon="line/chart"
            variant="solid"
            iconSize={20}
            accessibilityLabel={t('journalHome.journalStats')}
            onPress={() => router.push('/(tabs)/journal/stats')}
          />
        </View>

        <View
          accessible
          accessibilityLabel={`${t('journalHome.daysOf', { logged: month.logged, total: month.dots.length })}${days > 1 ? `, ${t('journalSaved.streak', { count: days })}` : ''}`}
          style={{
            marginTop: 20,
            backgroundColor: palette.white,
            borderRadius: 24,
            padding: 20,
            paddingTop: 18,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={[Type.microBold, { lineHeight: 15, color: palette.lavender }]}>
                {monthName}
              </Text>
              <Text style={[Type.titleMd, { lineHeight: 31, color: palette.ink, marginTop: 1 }]}>
                {t('journalHome.daysOf', { logged: month.logged, total: month.dots.length })}
              </Text>
            </View>
            {days > 1 && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  marginTop: 4,
                  paddingVertical: 4,
                  paddingLeft: 8,
                  paddingRight: 10,
                  borderRadius: 999,
                  backgroundColor: palette.selected,
                }}
              >
                <Icon name="line/flame" size={14} color={palette.plum} />
                <Text style={[Type.caption, { color: palette.plum }]}>
                  {t('journalSaved.streak', { count: days })}
                </Text>
              </View>
            )}
          </View>
          <View style={{ marginTop: 24 }}>
            <MonthDots {...month} />
          </View>
          {!month.todayLogged && (
            <Text
              style={[Type.caption, { fontWeight: '500', color: palette.textMuted, marginTop: 16 }]}
            >
              {t('journalHome.tonightOpen')}
            </Text>
          )}
        </View>

        <Text
          style={[
            Type.bodyStrong,
            { lineHeight: 22, letterSpacing: 0, color: palette.ink, marginTop: 24 },
          ]}
        >
          {t('journalHome.newEntry')}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <EntryTile
            icon="line/note"
            title={t('journalHome.write')}
            sub={t('journalHome.writeSub')}
            glow={palette.mustard}
            onPress={() => router.push('/(tabs)/journal/new')}
          />
          <EntryTile
            icon="line/mic"
            title={t('journalHome.speak')}
            sub={t('journalHome.speakSub')}
            glow={palette.lavenderSoft}
            onPress={() => router.push('/(tabs)/journal/voice')}
          />
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginTop: 26,
          }}
        >
          <Text style={[Type.bodyStrong, { lineHeight: 22, letterSpacing: 0, color: palette.ink }]}>
            {t('journalHome.recent')}
          </Text>
          <Text
            accessibilityRole="link"
            onPress={() => router.push('/(tabs)/journal/history')}
            style={[Type.label, { color: palette.lavender }]}
          >
            {t('journalHome.seeAll')}
          </Text>
        </View>
        <View style={{ gap: 10, marginTop: 12 }}>
          {journalEntries.slice(0, RECENT).map((entry) => (
            <EntryCard key={entry.id} entry={entry} lang={i18n.language} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
