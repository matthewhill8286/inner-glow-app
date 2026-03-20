import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSleep } from '@/hooks/useSleep';
import { SleepEntry } from '@/lib/types';
import { useTranslation } from 'react-i18next';

/* ── colors ──────────────────────────────────────── */
const SLEEP_COLORS = {
  core: '#5B8A5A',
  rem: '#7B6DC9',
  normal: '#4AAD7A',
  irregular: '#C45B5B',
  post: '#E8985A',
};

/* ── safe back ───────────────────────────────────── */
function goBack(from?: string) {
  if (from) router.replace(from as any);
  else router.back();
}

/* ── helpers ──────────────────────────────────────── */
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function getSleepType(duration: number) {
  if (duration >= 7) return { label: 'Normal', color: SLEEP_COLORS.normal };
  if (duration >= 5) return { label: 'Core', color: SLEEP_COLORS.core };
  if (duration >= 3) return { label: 'REM', color: SLEEP_COLORS.rem };
  return { label: 'Irregular', color: SLEEP_COLORS.irregular };
}

function getEntryDuration(entry: SleepEntry): number {
  // Prefer start/end timestamps (always reliable)
  if (entry.startISO && entry.endISO) {
    const ms = new Date(entry.endISO).getTime() - new Date(entry.startISO).getTime();
    return Math.max(0, ms / (1000 * 60 * 60));
  }
  // Fallback: duration field (may be hours or minutes depending on source)
  if (entry.duration) {
    return entry.duration > 24 ? entry.duration / 60 : entry.duration;
  }
  return 0;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/* ── Calendar Component ──────────────────────────── */
function SleepCalendar({
  entries,
  colors,
  onSelectDate,
}: {
  entries: SleepEntry[];
  colors: any;
  onSelectDate: (date: string) => void;
}) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  // Map entries to day → entry
  const dayMap = useMemo(() => {
    const map: Record<number, SleepEntry> = {};
    entries.forEach((e) => {
      const d = new Date(e.startISO);
      if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
        map[d.getDate()] = e;
      }
    });
    return map;
  }, [entries, viewYear, viewMonth]);

  const goMonthPrev = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else setViewMonth(viewMonth - 1);
  };
  const goMonthNext = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else setViewMonth(viewMonth + 1);
  };

  // Build grid of cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View>
      {/* Month navigation */}
      <View style={cal.monthNav}>
        <Pressable onPress={goMonthPrev} style={cal.navBtn}>
          <MaterialIcons name="chevron-left" size={22} color={colors.text} />
        </Pressable>
        <Text style={[cal.monthLabel, { color: colors.text }]}>
          {MONTHS[viewMonth]} {viewYear}
        </Text>
        <Pressable onPress={goMonthNext} style={cal.navBtn}>
          <MaterialIcons name="chevron-right" size={22} color={colors.text} />
        </Pressable>
      </View>

      {/* Weekday headers */}
      <View style={cal.weekRow}>
        {WEEKDAYS.map((wd) => (
          <Text key={wd} style={[cal.weekday, { color: colors.subtleText }]}>
            {wd}
          </Text>
        ))}
      </View>

      {/* Day cells */}
      <View style={cal.grid}>
        {cells.map((day, i) => {
          if (day === null) return <View key={i} style={cal.cell} />;
          const entry = dayMap[day];
          const isToday =
            day === now.getDate() && viewMonth === now.getMonth() && viewYear === now.getFullYear();
          const dur = entry ? getEntryDuration(entry) : 0;
          const type = entry ? getSleepType(dur) : null;

          return (
            <Pressable
              key={i}
              onPress={() => {
                if (entry) onSelectDate(entry.id);
              }}
              style={[
                cal.cell,
                type && { backgroundColor: type.color + '25' },
                isToday && { borderWidth: 2, borderColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  cal.dayNum,
                  { color: type ? type.color : colors.text },
                  isToday && { fontWeight: '900' },
                ]}
              >
                {day}
              </Text>
              {type && <View style={[cal.dayDot, { backgroundColor: type.color }]} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/* ── Main Screen ─────────────────────────────────── */
export default function SleepHistoryScreen() {
  const { t } = useTranslation();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { sleepEntries: entries, isLoading: loading } = useSleep();

  return (
    <View style={[s.container, { backgroundColor: colors.background, paddingTop: insets.top + 6 }]}>
      {/* ── Header ──────────────────────────────── */}
      <View style={s.header}>
        <Pressable
          onPress={() => goBack(from)}
          style={({ pressed }) => [
            s.backBtn,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <MaterialIcons
            name={Platform.OS === 'ios' ? 'arrow-back-ios-new' : 'arrow-back'}
            size={18}
            color={colors.text}
          />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, { color: colors.text }]}>{t('sleepHistory.title')}</Text>
          <Text style={[s.headerSub, { color: colors.mutedText }]}>
            {t('sleepHistory.subtitle')}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={{ gap: 12, paddingTop: 20 }}>
            {[200, 80, 100].map((h, i) => (
              <View
                key={i}
                style={{ height: h, borderRadius: UI.radius.xxl, backgroundColor: colors.inputBg }}
              />
            ))}
          </View>
        ) : (
          <>
            {/* ── Calendar ──────────────────────── */}
            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SleepCalendar
                entries={entries}
                colors={colors}
                onSelectDate={(id) => router.push(`/(tabs)/sleep/${id}`)}
              />
            </View>

            {/* ── AI Suggestions Teaser ─────────── */}
            <Pressable
              onPress={() => router.push('/(tabs)/sleep/insights' as any)}
              style={({ pressed }) => [
                s.aiTeaser,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <Text style={{ fontSize: 18 }}>🤖</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.aiTitle, { color: colors.text }]}>Sleep AI Suggestions</Text>
                  <Text style={[s.aiSub, { color: colors.mutedText }]}>
                    Patterns & recommendations
                  </Text>
                </View>
              </View>
              <View style={[s.aiBadge, { backgroundColor: '#7B6DC920' }]}>
                <Text style={{ fontSize: 14, fontWeight: '900', color: '#7B6DC9' }}>
                  {Math.min(89, entries.length * 12)}+
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={18} color={colors.subtleText} />
            </Pressable>

            {/* ── Sleep History List ────────────── */}
            <View style={s.sectionHeader}>
              <Text style={[s.sectionTitle, { color: colors.text }]}>
                {t('sleepHistory.title')}
              </Text>
              <Text style={[s.sectionCount, { color: colors.mutedText }]}>
                {t('sleepHistory.entriesCount', { count: entries.length })}
              </Text>
            </View>

            {entries.length === 0 ? (
              <View style={s.emptyState}>
                <MaterialIcons name="hotel" size={52} color={colors.border} />
                <Text style={[s.emptyTitle, { color: colors.text }]}>
                  {t('sleepHistory.noEntries')}
                </Text>
                <Text style={[s.emptySub, { color: colors.mutedText }]}>
                  {t('sleepHistory.startTracking')}
                </Text>
                <Pressable
                  onPress={() => router.push('/(tabs)/sleep/log')}
                  style={({ pressed }) => [
                    s.emptyBtn,
                    {
                      backgroundColor: colors.primary,
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                    },
                  ]}
                >
                  <MaterialIcons name="add" size={18} color="#FFF" />
                  <Text style={s.emptyBtnText}>{t('sleepHistory.logSleep')}</Text>
                </Pressable>
              </View>
            ) : (
              entries.map((entry, i) => {
                const dur = getEntryDuration(entry);
                const type = getSleepType(dur);
                const date = new Date(entry.startISO);

                return (
                  <Pressable
                    key={entry.id}
                    onPress={() => router.push(`/(tabs)/sleep/${entry.id}`)}
                    style={({ pressed }) => [
                      s.entryCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                      },
                    ]}
                  >
                    <View style={[s.entryDot, { backgroundColor: type.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[s.entryDate, { color: colors.text }]}>
                        {date.toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                      <Text style={[s.entryDurText, { color: colors.mutedText }]}>
                        You slept for {dur.toFixed(1)}h
                      </Text>
                    </View>
                    <View style={[s.typeBadge, { backgroundColor: type.color + '18' }]}>
                      <Text style={[s.typeBadgeText, { color: type.color }]}>{type.label}</Text>
                    </View>
                    {entry.quality && (
                      <View style={[s.qualBadge, { backgroundColor: '#E8985A18' }]}>
                        <Text style={{ fontSize: 12 }}>
                          {entry.quality >= 4 ? '😊' : entry.quality >= 3 ? '😐' : '😟'}
                        </Text>
                      </View>
                    )}
                    <MaterialIcons name="chevron-right" size={18} color={colors.subtleText} />
                  </Pressable>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      {/* ── FAB ─────────────────────────────────── */}
      <Pressable
        onPress={() => router.push('/(tabs)/sleep/log')}
        style={({ pressed }) => [s.fab, { transform: [{ scale: pressed ? 0.92 : 1 }] }]}
      >
        <MaterialIcons name="add" size={28} color="#FFF" />
      </Pressable>
    </View>
  );
}

/* ── Calendar Styles ─────────────────────────────── */
const cal = StyleSheet.create({
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navBtn: { padding: 4 },
  monthLabel: { fontSize: 16, fontWeight: '800' },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  dayNum: {
    fontSize: 13,
    fontWeight: '600',
  },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
});

/* ── Main Styles ─────────────────────────────────── */
const s = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: UI.spacing.xl,
  } as any,

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 6,
    marginBottom: 4,
  } as any,
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: '900' },
  headerSub: { fontSize: 14, marginTop: 2 },

  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100,
    gap: 14,
  },

  card: {
    borderRadius: UI.radius.xxl,
    padding: 16,
    borderWidth: 1,
    ...UI.shadow.sm,
  },

  /* AI teaser */
  aiTeaser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: UI.radius.xxl,
    padding: 14,
    borderWidth: 1,
    ...UI.shadow.sm,
  },
  aiTitle: { fontSize: 14, fontWeight: '800' },
  aiSub: { fontSize: 12, marginTop: 1 },
  aiBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },

  /* section */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: '900' },
  sectionCount: { fontSize: 13, fontWeight: '600' },

  /* empty state */
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', marginTop: 8 },
  emptySub: { fontSize: 13, textAlign: 'center' },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: UI.radius.lg,
    marginTop: 8,
  },
  emptyBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 },

  /* entry cards */
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: UI.radius.xxl,
    padding: 14,
    borderWidth: 1,
    ...UI.shadow.sm,
  },
  entryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  entryDate: { fontSize: 14, fontWeight: '800' },
  entryDurText: { fontSize: 12, marginTop: 2 },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: { fontSize: 11, fontWeight: '700' },
  qualBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* FAB */
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 120 : 100,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: '#8B6B47',
    alignItems: 'center',
    justifyContent: 'center',
    ...UI.shadow.lg,
  } as any,
});
