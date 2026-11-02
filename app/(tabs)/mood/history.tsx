import React, { useMemo, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { GlowField } from '@/components/glow/Glow';
import { Icon } from '@/components/icons/Icon';
import { AppButton } from '@/components/ui/AppButton';
import { EmptyScreen } from '@/components/EmptyScreen';
import { SettingsScreen } from '@/components/settings/SettingsParts';
import { DayDetailsSheet } from '@/components/mood/DayDetailsSheet';
import { useMood } from '@/hooks/useMood';
import { MOOD_SCALE, moodStep } from '@/lib/mood-scale';
import { mixStops, monthGrid, monthRows, monthStart, monthSummary } from '@/lib/mood-month';
import { backTo } from '@/lib/navigation';
import { screenBottomPadding } from '@/lib/screen-layout';
import type { MoodCheckIn } from '@/lib/types';

const DISC = 24;
const ROW = 52;
const TOP = 44;

/**
 * Mood history (04 §M6): the month with previous and next, a Monday-first calendar where each day is
 * a disc in that day's mood colour with a soft halo, the legend, how the month went with its mood
 * mix, and See insights. Tapping a logged day opens Day details (09 §3.14). The old list, filter and
 * AI Suggestions tab are gone; insights live on Mood stats.
 */
export default function MoodHistory() {
  const { t, i18n } = useTranslation();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { moodCheckIns: logs, isLoading } = useMood();
  const now = useMemo(() => new Date(), []);
  const [offset, setOffset] = useState(0);
  const [open, setOpen] = useState<MoodCheckIn | null>(null);

  const month = monthStart(now, offset);
  const grid = useMemo(() => monthGrid(logs, month, now), [logs, month, now]);
  const rows = monthRows(month);
  const summary = useMemo(() => monthSummary(logs, month), [logs, month]);
  const cardW = width - 48;
  // Columns are 40 wide from x 16, spread so the last one ends 16 from the right edge.
  const pitch = (cardW - 32 - 40) / 6;
  const cx = (column: number) => 16 + pitch * column + 20;
  const cy = (row: number) => TOP + ROW * row + DISC / 2;
  const cardH = TOP + ROW * (rows - 1) + DISC + 22;
  const letters = t('moodHistory.weekdays').split(',');

  // Mood · History empty (09 §3.12): the calendar, legend and summary wait for the first check-in.
  if (!isLoading && logs.length === 0) {
    return (
      <EmptyScreen
        header={{ kind: 'nav', title: t('emptyStates.mood.title'), backLabel: t('common.back'), onBack: () => backTo(undefined, '/(tabs)/mood') }}
        glowColor={palette.rose}
        title={t('emptyStates.mood.emptyTitle')}
        body={t('emptyStates.mood.body')}
        action={{ label: t('emptyStates.mood.action'), onPress: () => router.push('/(tabs)/mood/check-in') }}
      />
    );
  }

  const monthName = month.toLocaleDateString(i18n.language, offset === 0 || month.getFullYear() === now.getFullYear() ? { month: 'long' } : { month: 'long', year: 'numeric' });
  const stops = mixStops(summary.shares);

  return (
    <SettingsScreen
      title={t('moodHistory.title')}
      backLabel={t('common.back')}
      onBack={() => backTo(undefined, '/(tabs)/mood')}
      // Mood screens keep the tab bar (09), so the button scrolls with the content above it.
      contentStyle={{ gap: 16, paddingBottom: screenBottomPadding(insets.bottom) }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text accessibilityRole="header" style={[Type.titleLg, { lineHeight: 36, color: palette.ink }]}>
          {monthName}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <MonthButton icon="arrow/chevron-left" label={t('moodHistory.previous')} onPress={() => setOffset((o) => o - 1)} />
          <MonthButton icon="arrow/chevron-right" label={t('moodHistory.next')} disabled={offset >= 0} onPress={() => setOffset((o) => Math.min(0, o + 1))} />
        </View>
      </View>

      <View style={{ height: cardH, borderRadius: 24, backgroundColor: palette.white, overflow: 'hidden' }}>
        {/* Halos in one canvas behind the discs. */}
        <GlowField
          scaleToWidth={false}
          glows={grid
            .filter((c) => c.score)
            .map((c) => ({ color: moodStep(c.score!).color, opacity: 0.55, x: cx(c.column) - 17, y: cy(c.row) - 17, width: 34, blur: 8 }))}
        />
        {letters.map((l, i) => (
          <Text key={i} style={[Type.micro, { position: 'absolute', top: 16, left: cx(i) - 20, width: 40, textAlign: 'center', color: palette.textSubtle }]}>
            {l}
          </Text>
        ))}
        {grid.map((c) => {
          const step = c.score ? moodStep(c.score) : null;
          const label = `${new Date(month.getFullYear(), month.getMonth(), c.day).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long' })}${
            step ? `, ${t(`moodScale.${step.key}`)}` : `, ${t('moodHistory.noLog')}`
          }`;
          return (
            <Pressable
              key={c.day}
              accessibilityRole={c.log ? 'button' : 'text'}
              accessibilityLabel={label}
              disabled={!c.log}
              onPress={() => setOpen(c.log)}
              hitSlop={10}
              style={({ pressed }) => ({
                position: 'absolute',
                left: cx(c.column) - DISC / 2,
                top: cy(c.row) - DISC / 2,
                width: DISC,
                height: DISC,
                borderRadius: DISC / 2,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: step ? step.color : 'transparent',
                opacity: pressed ? 0.75 : step ? 0.95 : 1,
                borderWidth: step ? 0 : 1.2,
                borderColor: '#D6CCC0',
              })}
            >
              <Text style={[Type.micro, { fontSize: 10, lineHeight: 14, fontWeight: c.today ? '700' : '500', color: c.today ? palette.plum : palette.ink }]}>
                {c.day}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 6 }}>
        {MOOD_SCALE.map((s) => (
          <View key={s.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: s.color }} />
            <Text style={[Type.caption, { fontWeight: '500', color: palette.textMuted }]}>{t(`moodScale.${s.key}`)}</Text>
          </View>
        ))}
      </View>

      <View style={{ backgroundColor: palette.white, borderRadius: 24, padding: 20, gap: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <Text style={[Type.bodyMSemi, { color: palette.ink, flexShrink: 1 }]}>
            {summary.mostly
              ? t('moodHistory.mostly', { mood: t(`moodScale.${moodStep(summary.mostly).key}`).toLowerCase() })
              : t('moodHistory.noneThisMonth')}
          </Text>
          {summary.total > 0 && (
            <Text style={[Type.caption, { fontWeight: '500', color: palette.textSubtle }]}>{t('moodHistory.checkIns', { count: summary.total })}</Text>
          )}
        </View>
        {summary.total > 0 && (
          <Svg width={cardW - 40} height={14} accessibilityElementsHidden>
            <Defs>
              <LinearGradient id="monthMix" x1="0" y1="0" x2="1" y2="0">
                {stops.map((s, i) => (
                  <Stop key={i} offset={s.offset} stopColor={moodStep(s.score).color} stopOpacity={0.95} />
                ))}
              </LinearGradient>
            </Defs>
            <Rect x={0} y={0} width={cardW - 40} height={14} rx={7} fill="url(#monthMix)" />
          </Svg>
        )}
      </View>

      <AppButton
        title={t('moodHistory.insights')}
        icon="line/chart"
        iconPosition="left"
        onPress={() => router.push('/(tabs)/mood/stats')}
        style={{ marginTop: 8 }}
      />

      <DayDetailsSheet log={open} onClose={() => setOpen(null)} />
    </SettingsScreen>
  );
}

function MonthButton({ icon, label, onPress, disabled }: { icon: 'arrow/chevron-left' | 'arrow/chevron-right'; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => ({ width: 36, height: 36, borderRadius: 18, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.4 : pressed ? 0.7 : 1 })}
    >
      <Icon name={icon} size={18} />
    </Pressable>
  );
}
