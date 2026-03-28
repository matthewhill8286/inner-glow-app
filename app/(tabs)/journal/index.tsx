import React, { useCallback, useMemo, useRef } from 'react';
import { View, Text, Pressable, ScrollView, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import { useJournal } from '@/hooks/useJournal';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

/* ── helpers ── */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getDaysInYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
}

export default function JournalHome() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { journalEntries, isLoading } = useJournal();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []));

  const now = new Date();
  const year = now.getFullYear();

  /* ── Compute stats ── */
  const stats = useMemo(() => {
    const entries = journalEntries ?? [];
    const thisYear = entries.filter((e) => new Date(e.createdAt).getFullYear() === year);
    const positive = thisYear.filter(
      (e) => e.mood && ['Calm', 'Okay', 'Great', 'Good', 'Happy'].includes(e.mood),
    ).length;
    const negative = thisYear.filter(
      (e) => e.mood && ['Anxious', 'Sad', 'Angry', 'Overwhelmed', 'Bad', 'Low'].includes(e.mood),
    ).length;
    const noMood = thisYear.length - positive - negative;

    return {
      total: thisYear.length,
      positive,
      negative,
      skipped: noMood,
    };
  }, [journalEntries, year]);

  /* ── Contribution map: classify each day by mood ── */
  const POSITIVE_MOODS = ['Calm', 'Okay', 'Great', 'Good', 'Happy'];
  const NEGATIVE_MOODS = ['Anxious', 'Sad', 'Angry', 'Overwhelmed', 'Bad', 'Low'];

  // 'positive' | 'negative' | 'noMood' per day index
  const dayMap = useMemo(() => {
    const map = new Map<number, 'positive' | 'negative' | 'noMood'>();
    (journalEntries ?? []).forEach((e) => {
      const d = new Date(e.createdAt);
      if (d.getFullYear() !== year) return;
      const start = new Date(year, 0, 1);
      const dayIdx = Math.floor((d.getTime() - start.getTime()) / 86400000);

      // Prioritise: if any entry that day is positive or negative, use that
      const existing = map.get(dayIdx);
      if (e.mood && POSITIVE_MOODS.includes(e.mood)) {
        if (existing !== 'negative') map.set(dayIdx, 'positive');
      } else if (e.mood && NEGATIVE_MOODS.includes(e.mood)) {
        map.set(dayIdx, 'negative');
      } else if (!existing) {
        map.set(dayIdx, 'noMood');
      }
    });
    return map;
  }, [journalEntries, year]);

  const DOT_COLORS = {
    positive: '#5B8A5A',
    negative: '#E8985A',
    noMood: '#7B6DC9',
  };

  const totalDays = getDaysInYear(year);
  const cols = Math.ceil(totalDays / 7);

  /* ── Quick actions ── */
  const actions = [
    {
      label: t('journalHome.createJournal'),
      icon: 'add-circle-outline',
      path: '/(tabs)/journal/new',
      color: '#8B6B47',
    },
    {
      label: t('journalHome.myJournals'),
      icon: 'menu-book',
      path: '/(tabs)/journal/history',
      color: '#5B8A5A',
    },
    {
      label: t('journalHome.journalStats'),
      icon: 'bar-chart',
      path: '/(tabs)/journal/stats',
      color: '#E8985A',
    },
    {
      label: t('journalHome.prompts'),
      icon: 'lightbulb',
      path: '/(tabs)/journal/prompts',
      color: '#7B6DC9',
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* ── Standard Header ── */}
      <View
        style={{
          paddingHorizontal: UI.spacing.xl,
          paddingTop: insets.top + 6,
          paddingBottom: 8,
          backgroundColor: colors.background,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <MaterialIcons name="arrow-back-ios-new" size={16} color={colors.text} />
            </Pressable>
            <Text
              style={{
                fontSize: 26,
                fontWeight: '900',
                color: colors.text,
                flexShrink: 1,
              }}
              numberOfLines={1}
            >
              {t('journalHome.title')}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/(tabs)/journal/new')}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <MaterialIcons name="add" size={22} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══ Stats Card ═══ */}
        <View
          style={{
            backgroundColor: '#8B6B47',
            marginHorizontal: UI.spacing.xl,
            marginTop: 12,
            padding: 20,
            borderRadius: UI.radius.xxl,
          }}
        >
          {/* Big number */}
          <Text
            style={{
              fontSize: 64,
              fontWeight: '900',
              color: '#fff',
              lineHeight: 72,
              marginBottom: 4,
            }}
          >
            {isLoading ? '--' : stats.total}
          </Text>
          <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', marginBottom: 20 }}>
            {t('journalHome.journalsThisYear')}
          </Text>

          {/* Contribution grid */}
          <View style={{ marginBottom: 16 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 3 }}>
                {Array.from({ length: cols }, (_, col) => (
                  <View key={col} style={{ gap: 3 }}>
                    {Array.from({ length: 7 }, (_, row) => {
                      const dayIdx = col * 7 + row;
                      if (dayIdx >= totalDays)
                        return <View key={row} style={{ width: 12, height: 12 }} />;
                      const moodType = dayMap.get(dayIdx);
                      return (
                        <View
                          key={row}
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: 3,
                            backgroundColor: moodType
                              ? DOT_COLORS[moodType]
                              : 'rgba(255,255,255,0.15)',
                          }}
                        />
                      );
                    })}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Legend */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            {[
              { label: t('journalHome.positive'), color: DOT_COLORS.positive },
              { label: t('journalHome.negative'), color: DOT_COLORS.negative },
              { label: t('journalHome.noMood'), color: DOT_COLORS.noMood },
            ].map((item) => (
              <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View
                  style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color }}
                />
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ═══ Journal Statistics link ═══ */}
        <View style={{ paddingHorizontal: UI.spacing.xl, marginTop: 20 }}>
          <Pressable
            onPress={() => router.push('/(tabs)/journal/stats')}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: colors.card,
              borderRadius: UI.radius.xl,
              padding: 18,
              borderWidth: 1,
              borderColor: colors.border,
              opacity: pressed ? 0.8 : 1,
              ...UI.shadow.sm,
            })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: '#E8985A',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialIcons name="bar-chart" size={24} color="#fff" />
              </View>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
                  {t('journalHome.journalStatistics')}
                </Text>
                <Text style={{ fontSize: 12, color: colors.mutedText, marginTop: 2 }}>
                  {t('journalHome.journalTrend', { year })}
                </Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.mutedText} />
          </Pressable>
        </View>

        {/* ═══ Quick Actions ═══ */}
        <View style={{ paddingHorizontal: UI.spacing.xl, marginTop: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
            {t('journalHome.quickActions')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {actions.map((a) => (
              <Pressable
                key={a.label}
                onPress={() => router.push(a.path as any)}
                style={({ pressed }) => ({
                  width: '48%' as any,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  backgroundColor: colors.card,
                  borderRadius: UI.radius.lg,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                  opacity: pressed ? 0.8 : 1,
                  ...UI.shadow.sm,
                })}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: a.color,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons name={a.icon as any} size={20} color="#fff" />
                </View>
                <Text
                  style={{ fontSize: 13, fontWeight: '600', color: colors.text, flex: 1 }}
                  numberOfLines={1}
                >
                  {a.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ═══ Recent Entries ═══ */}
        <View style={{ paddingHorizontal: UI.spacing.xl, marginTop: 24 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
              {t('journalHome.recentJournals')}
            </Text>
            <Pressable onPress={() => router.push('/(tabs)/journal/history')}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#8B6B47' }}>
                {t('journalHome.seeAll')}
              </Text>
            </Pressable>
          </View>

          {/* No-mood nudge */}
          {!isLoading && stats.skipped > 0 && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                backgroundColor: '#7B6DC9' + '12',
                borderRadius: UI.radius.lg,
                padding: 14,
                marginBottom: 12,
              }}
            >
              <MaterialIcons name="mood" size={22} color="#7B6DC9" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#7B6DC9' }}>
                  {t('journalHome.noMoodNudge', { count: stats.skipped })}
                </Text>
                <Text style={{ fontSize: 12, color: colors.mutedText, marginTop: 2 }}>
                  {t('journalHome.noMoodNudgeSubtitle')}
                </Text>
              </View>
            </View>
          )}

          {isLoading ? (
            <View
              style={{
                height: 80,
                backgroundColor: colors.card,
                borderRadius: UI.radius.lg,
                marginBottom: 10,
              }}
            />
          ) : (journalEntries ?? []).length === 0 ? (
            <View
              style={{
                alignItems: 'center',
                padding: 30,
                backgroundColor: colors.card,
                borderRadius: UI.radius.xl,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <MaterialIcons name="edit-note" size={40} color={colors.mutedText} />
              <Text
                style={{ fontSize: 15, fontWeight: '600', color: colors.mutedText, marginTop: 8 }}
              >
                {t('journalHome.noJournalsYet')}
              </Text>
              <Text style={{ fontSize: 13, color: colors.subtleText, marginTop: 4 }}>
                {t('journalHome.startWriting')}
              </Text>
            </View>
          ) : (
            (journalEntries ?? []).slice(0, 5).map((entry) => {
              const d = new Date(entry.createdAt);
              const moodEmoji = getMoodEmoji(entry.mood);
              return (
                <Pressable
                  key={entry.id}
                  onPress={() =>
                    router.push({ pathname: '/(tabs)/journal/[id]', params: { id: entry.id } })
                  }
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.divider,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: getMoodColor(entry.mood),
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>{moodEmoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontSize: 15, fontWeight: '700', color: colors.text }}
                      numberOfLines={1}
                    >
                      {entry.title || t('journalHome.untitledEntry')}
                    </Text>
                    <Text
                      style={{ fontSize: 12, color: colors.mutedText, marginTop: 2 }}
                      numberOfLines={1}
                    >
                      {entry.content}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 11, color: colors.subtleText }}>
                      {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                    <Text style={{ fontSize: 10, color: colors.subtleText, marginTop: 2 }}>
                      {d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/* ── Mood helpers ── */
function getMoodEmoji(mood?: string | null): string {
  const map: Record<string, string> = {
    Calm: '\uD83D\uDE0C',
    Okay: '\uD83D\uDE42',
    Good: '\uD83D\uDE0A',
    Great: '\uD83D\uDE04',
    Happy: '\uD83D\uDE01',
    Anxious: '\uD83D\uDE1F',
    Sad: '\uD83D\uDE22',
    Angry: '\uD83D\uDE21',
    Overwhelmed: '\uD83E\uDD2F',
    Bad: '\uD83D\uDE14',
    Low: '\uD83D\uDE1E',
  };
  return map[mood ?? ''] ?? '\uD83D\uDCDD';
}

function getMoodColor(mood?: string | null): string {
  if (!mood) return 'rgba(139,107,71,0.12)';
  const positive = ['Calm', 'Okay', 'Good', 'Great', 'Happy'];
  if (positive.includes(mood)) return 'rgba(91,138,90,0.15)';
  return 'rgba(232,152,90,0.15)';
}
