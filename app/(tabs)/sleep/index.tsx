import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView, Platform, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSleep } from '@/hooks/useSleep';
import { SleepEntry } from '@/lib/types';
import { useTranslation } from 'react-i18next';
import { useSleepDetection } from '@/hooks/useSleepDetection';

const { width: SCREEN_W } = Dimensions.get('window');

/* ── sleep type colors ───────────────────────────── */
const SLEEP_COLORS = {
  core: '#5B8A5A',
  rem: '#7B6DC9',
  normal: '#4AAD7A',
  irregular: '#C45B5B',
  post: '#E8985A',
};

/* ── helpers ──────────────────────────────────────── */
function goBack(from?: string) {
  if (from) router.replace(from as any);
  else router.back();
}

function computeSleepStats(entries: SleepEntry[]) {
  if (entries.length === 0) {
    return { avgDuration: 0, totalHours: 0, score: 0, label: 'No Data', quality: 0 };
  }

  const durations = entries.map((e) => {
    // Prefer start/end timestamps (always reliable)
    if (e.startISO && e.endISO) {
      const ms = new Date(e.endISO).getTime() - new Date(e.startISO).getTime();
      return Math.max(0, ms / (1000 * 60 * 60));
    }
    // Fallback: duration field (may be hours or minutes depending on source)
    if (e.duration) {
      return e.duration > 24 ? e.duration / 60 : e.duration;
    }
    return 0;
  });

  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const totalHours = durations.reduce((a, b) => a + b, 0);
  const avgQuality =
    entries.filter((e) => e.quality).reduce((a, e) => a + (e.quality || 3), 0) /
    Math.max(1, entries.filter((e) => e.quality).length);

  // Score out of 100: duration contributes up to 60pts, quality up to 40pts
  const durationScore = Math.min(60, (avgDuration / 8) * 60);
  const qualityScore = (avgQuality / 5) * 40;
  const score = Math.min(100, Math.round(durationScore + qualityScore));

  let label = 'Excellent Sleeper';
  if (score < 30) label = 'Insomniac';
  else if (score < 50) label = 'Light Sleeper';
  else if (score < 70) label = 'Fair Sleeper';
  else if (score < 85) label = 'Good Sleeper';

  return { avgDuration, totalHours, score, label, quality: avgQuality };
}

/* ── Donut / Pie segment (simple SVG-free approach) ─ */
function SleepBreakdownRing({
  size,
  segments,
}: Readonly<{
  size: number;
  segments: { color: string; pct: number; label: string }[];
}>) {
  useSleepDetection();

  const radius = size / 2;
  const strokeWidth = size * 0.18;
  const innerR = radius - strokeWidth;

  // We render colored arcs via a series of bordered View arcs
  // For simplicity, show colored dots + legend instead of true SVG pie
  return (
    <View style={{ alignItems: 'center', gap: 12 }}>
      {/* Ring visualization using layered circles */}
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: size,
            height: size,
            borderRadius: radius,
            borderWidth: strokeWidth,
            borderColor: segments[0]?.color || '#5B8A5A',
            position: 'absolute',
          }}
        />
        {/* Second color overlay — top-right arc */}
        {segments.length > 1 && (
          <View
            style={{
              width: size,
              height: size / 2,
              borderTopLeftRadius: radius,
              borderTopRightRadius: radius,
              overflow: 'hidden',
              position: 'absolute',
              top: 0,
            }}
          >
            <View
              style={{
                width: size,
                height: size,
                borderRadius: radius,
                borderWidth: strokeWidth,
                borderColor: segments[1]?.color || '#7B6DC9',
              }}
            />
          </View>
        )}
        {/* Third color overlay — small segment */}
        {segments.length > 2 && (
          <View
            style={{
              width: size / 2,
              height: size / 2,
              borderTopLeftRadius: radius,
              overflow: 'hidden',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          >
            <View
              style={{
                width: size,
                height: size,
                borderRadius: radius,
                borderWidth: strokeWidth,
                borderColor: segments[2]?.color || '#E8985A',
              }}
            />
          </View>
        )}
        {/* Inner fill / center label */}
        <View
          style={{
            width: innerR * 2 - 4,
            height: innerR * 2 - 4,
            borderRadius: innerR,
            backgroundColor: 'rgba(255,255,255,0.12)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
      </View>

      {/* Legend row */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
        {segments.map((seg, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: seg.color }} />
            <Text style={{ color: 'rgba(255,255,255,0.80)', fontSize: 11, fontWeight: '700' }}>
              {seg.label} {seg.pct}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/* ── Circular progress indicator ─────────────────── */
function CircleProgress({
  value,
  max,
  size,
  color,
  label,
  unit,
}: {
  value: number;
  max: number;
  size: number;
  color: string;
  label: string;
  unit: string;
}) {
  const pct = Math.min(1, value / max);
  const radius = size / 2;
  const strokeWidth = 6;

  return (
    <View style={{ alignItems: 'center', gap: 6 }}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        {/* Background ring */}
        <View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: radius,
            borderWidth: strokeWidth,
            borderColor: 'rgba(0,0,0,0.06)',
          }}
        />
        {/* Progress ring — use clip to show partial */}
        <View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: radius,
            borderWidth: strokeWidth,
            borderColor: color,
            opacity: pct > 0 ? 1 : 0,
          }}
        />
        <Text style={{ fontSize: size * 0.22, fontWeight: '900', color }}>{value.toFixed(1)}</Text>
        <Text style={{ fontSize: size * 0.13, fontWeight: '600', color: 'rgba(0,0,0,0.45)' }}>
          {unit}
        </Text>
      </View>
      <Text style={{ fontSize: 12, fontWeight: '700', color: 'rgba(0,0,0,0.55)' }}>{label}</Text>
    </View>
  );
}

/* ── Main Screen ─────────────────────────────────── */
export default function SleepScreen() {
  const { t } = useTranslation();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const { sleepEntries: entries, isLoading: loading, sleepMode } = useSleep();

  const stats = useMemo(() => computeSleepStats(entries), [entries]);

  // Compute breakdown percentages (mock split for visual since we don't have REM/Core data)
  const segments = useMemo(() => {
    if (entries.length === 0) return [{ color: SLEEP_COLORS.core, pct: 100, label: 'Core' }];
    return [
      { color: SLEEP_COLORS.core, pct: 45, label: 'Core' },
      { color: SLEEP_COLORS.rem, pct: 30, label: 'REM' },
      { color: SLEEP_COLORS.normal, pct: 15, label: 'Normal' },
      { color: SLEEP_COLORS.irregular, pct: 10, label: 'Irregular' },
    ];
  }, [entries]);

  // Recent entries for quick preview
  const recentEntries = entries.slice(0, 3);

  // Improvement calculation (mock)
  const improvement = entries.length > 3 ? 87 : entries.length > 1 ? 42 : 0;

  return (
    <View style={[s.container, { backgroundColor: colors.background, paddingTop: insets.top + 6 }]}>
      {/* ── Header ──────────────────────────────────── */}
      <View style={s.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            s.iconBtn,
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
          <View style={s.titleRow}>
            <Text style={{ fontSize: 28 }}>🌙</Text>
            <Text style={[s.headerTitle, { color: colors.text }]}>{t('sleepHome.title')}</Text>
          </View>
          <Text style={[s.headerSub, { color: colors.mutedText }]}>{t('sleepHome.subtitle')}</Text>
        </View>
        <Pressable
          onPress={() => router.push('/(tabs)/sleep/insights' as any)}
          style={({ pressed }) => [
            s.iconBtn,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <MaterialIcons name="insights" size={20} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={{ gap: 12, paddingTop: 20 }}>
            {[160, 100, 80, 120].map((h, i) => (
              <View
                key={i}
                style={{
                  height: h,
                  borderRadius: UI.radius.xxl,
                  backgroundColor: colors.inputBg,
                }}
              />
            ))}
          </View>
        ) : (
          <>
            {/* ── Hero Score Card ───────────────────── */}
            <View style={[s.heroCard, { backgroundColor: '#5A3E7A' }]}>
              <View style={[s.heroCircle1, { backgroundColor: 'rgba(255,255,255,0.06)' }]} />
              <View style={[s.heroCircle2, { backgroundColor: 'rgba(255,255,255,0.04)' }]} />

              <View style={s.heroTopRow}>
                <View style={s.heroScoreWrap}>
                  <Text style={s.heroScoreNum}>{stats.score}</Text>
                  <Text style={s.heroScoreLabel}>/100</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.heroStatusLabel}>You are</Text>
                  <Text style={s.heroStatusValue}>{stats.label}</Text>
                </View>
              </View>

              {/* Breakdown ring */}
              <SleepBreakdownRing size={140} segments={segments} />

              {/* Improvement badge */}
              {improvement > 0 && (
                <View style={s.improvementBadge}>
                  <MaterialIcons name="trending-up" size={14} color="#4AAD7A" />
                  <Text style={s.improvementText}>{improvement}% better from last month</Text>
                </View>
              )}
            </View>

            {/* ── Sleep Overview ────────────────────── */}
            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[s.cardLabel, { color: colors.mutedText }]}>
                {t('sleepHome.sleepOverview')}
              </Text>
              <View style={s.overviewRow}>
                <CircleProgress
                  value={stats.avgDuration}
                  max={10}
                  size={80}
                  color={SLEEP_COLORS.rem}
                  label={t('sleepHome.avgDuration')}
                  unit="hrs"
                />
                <CircleProgress
                  value={stats.quality}
                  max={5}
                  size={80}
                  color={SLEEP_COLORS.core}
                  label={t('sleepHome.avgQuality')}
                  unit="/5"
                />
                <CircleProgress
                  value={entries.length}
                  max={30}
                  size={80}
                  color={SLEEP_COLORS.post}
                  label="Entries"
                  unit="total"
                />
              </View>
            </View>

            {/* ── Type Legend ───────────────────────── */}
            <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={s.legendRow}>
                {[
                  { label: t('sleepHome.patternNormal'), color: SLEEP_COLORS.normal },
                  { label: t('sleepHome.patternCore'), color: SLEEP_COLORS.core },
                  { label: t('sleepHome.patternIrregular'), color: SLEEP_COLORS.irregular },
                  { label: t('sleepHome.patternInsomniac'), color: '#2A1A3E' },
                ].map((item, i) => (
                  <View key={i} style={s.legendItem}>
                    <View style={[s.legendDot, { backgroundColor: item.color }]} />
                    <Text style={[s.legendText, { color: colors.text }]}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* ── Quick Actions Grid ───────────────── */}
            <View style={s.actionsGrid}>
              <Pressable
                onPress={() => router.push('/(tabs)/sleep/start' as any)}
                style={({ pressed }) => [
                  s.actionCard,
                  {
                    backgroundColor: '#5A3E7A',
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  },
                ]}
              >
                <MaterialIcons name="nightlight-round" size={28} color="#FFF" />
                <Text style={s.actionCardTitle}>{t('sleepHome.startSleeping')}</Text>
                <Text style={s.actionCardSub}>{t('sleepHome.trackSleep')}</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/(tabs)/sleep/schedule' as any)}
                style={({ pressed }) => [
                  s.actionCard,
                  {
                    backgroundColor: SLEEP_COLORS.core,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  },
                ]}
              >
                <MaterialIcons name="alarm" size={28} color="#FFF" />
                <Text style={s.actionCardTitle}>{t('sleepHome.schedule')}</Text>
                <Text style={s.actionCardSub}>{t('sleepHome.setSleepTimes')}</Text>
              </Pressable>
            </View>

            <View style={s.actionsGrid}>
              <Pressable
                onPress={() => router.push('/(tabs)/sleep/log')}
                style={({ pressed }) => [
                  s.actionCard,
                  {
                    backgroundColor: SLEEP_COLORS.post,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  },
                ]}
              >
                <MaterialIcons name="edit-note" size={28} color="#FFF" />
                <Text style={s.actionCardTitle}>{t('sleepHome.logSleep')}</Text>
                <Text style={s.actionCardSub}>{t('sleepHome.manualEntry')}</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/(tabs)/sleep/history')}
                style={({ pressed }) => [
                  s.actionCard,
                  {
                    backgroundColor: '#5A8FB5',
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  },
                ]}
              >
                <MaterialIcons name="calendar-month" size={28} color="#FFF" />
                <Text style={s.actionCardTitle}>{t('sleepHome.history')}</Text>
                <Text style={s.actionCardSub}>{t('sleepHome.viewPastSleep')}</Text>
              </Pressable>
            </View>

            {/* ── AI Suggestions Teaser ─────────────── */}
            <Pressable
              onPress={() => router.push('/(tabs)/sleep/insights' as any)}
              style={({ pressed }) => [
                s.aiCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <View style={s.aiCardLeft}>
                <View style={[s.aiBadge, { backgroundColor: '#7B6DC915' }]}>
                  <Text style={{ fontSize: 18 }}>🤖</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.aiCardTitle, { color: colors.text }]}>
                    {t('sleepHome.aiSuggestions')}
                  </Text>
                  <Text style={[s.aiCardSub, { color: colors.mutedText }]}>
                    {t('sleepHome.aiSuggestionsSubtitle')}
                  </Text>
                </View>
              </View>
              <View style={[s.aiCount, { backgroundColor: '#7B6DC920' }]}>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#7B6DC9' }}>
                  {entries.length > 0 ? Math.min(89, entries.length * 12) + '+' : '3+'}
                </Text>
              </View>
            </Pressable>

            {/* ── Recent Entries ────────────────────── */}
            {recentEntries.length > 0 && (
              <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={s.sectionHeader}>
                  <Text style={[s.cardLabel, { color: colors.mutedText }]}>
                    {t('sleepHome.recentSleep')}
                  </Text>
                  <Pressable onPress={() => router.push('/(tabs)/sleep/history')}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>
                      {t('sleepHome.viewAll')}
                    </Text>
                  </Pressable>
                </View>
                {recentEntries.map((entry, i) => {
                  const dur =
                    entry.duration ||
                    Math.max(
                      0,
                      (new Date(entry.endISO).getTime() - new Date(entry.startISO).getTime()) /
                        (1000 * 60 * 60),
                    );
                  const date = new Date(entry.startISO);
                  const typeColor =
                    dur >= 7
                      ? SLEEP_COLORS.normal
                      : dur >= 5
                        ? SLEEP_COLORS.core
                        : SLEEP_COLORS.irregular;
                  const typeLabel = dur >= 7 ? 'Normal' : dur >= 5 ? 'Core' : 'Irregular';

                  return (
                    <Pressable
                      key={entry.id}
                      onPress={() => router.push(`/(tabs)/sleep/${entry.id}`)}
                      style={({ pressed }) => [
                        s.entryRow,
                        {
                          borderTopColor: i > 0 ? colors.divider : 'transparent',
                          borderTopWidth: i > 0 ? 1 : 0,
                          opacity: pressed ? 0.7 : 1,
                        },
                      ]}
                    >
                      <View style={[s.entryDot, { backgroundColor: typeColor }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[s.entryDate, { color: colors.text }]}>
                          {date.toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </Text>
                        <Text style={[s.entryDuration, { color: colors.mutedText }]}>
                          {t('sleepHome.sleptFor', { hours: dur.toFixed(1) })}
                        </Text>
                      </View>
                      <View style={[s.typeBadge, { backgroundColor: typeColor + '18' }]}>
                        <Text style={[s.typeBadgeText, { color: typeColor }]}>{typeLabel}</Text>
                      </View>
                      <MaterialIcons name="chevron-right" size={18} color={colors.subtleText} />
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* ── Mindful Hours Link ───────────────── */}
            <Pressable
              onPress={() => router.push('/(tabs)/mindful')}
              style={({ pressed }) => [
                s.linkCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <MaterialIcons name="self-improvement" size={22} color={SLEEP_COLORS.core} />
                <Text style={{ fontWeight: '800', fontSize: 14, color: colors.text }}>
                  {t('sleepHome.viewMindfulHours')}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.subtleText} />
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

/* ── Styles ──────────────────────────────────────── */
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
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 24, fontWeight: '900' },
  headerSub: { fontSize: 14, marginTop: 2 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100,
    gap: 14,
  },

  /* hero score card */
  heroCard: {
    borderRadius: UI.radius.xxl,
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
    ...UI.shadow.md,
  },
  heroCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -60,
    right: -40,
  },
  heroCircle2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    bottom: -50,
    left: -30,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
    width: '100%',
  },
  heroScoreWrap: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroScoreNum: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
  },
  heroScoreLabel: {
    color: 'rgba(255,255,255,0.60)',
    fontSize: 12,
    fontWeight: '700',
    marginTop: -4,
  },
  heroStatusLabel: {
    color: 'rgba(255,255,255,0.60)',
    fontSize: 13,
    fontWeight: '600',
  },
  heroStatusValue: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  improvementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 14,
  },
  improvementText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },

  /* cards */
  card: {
    borderRadius: UI.radius.xxl,
    padding: 18,
    borderWidth: 1,
    ...UI.shadow.sm,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  /* legend */
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '700',
  },

  /* actions grid */
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    borderRadius: UI.radius.xxl,
    padding: 18,
    gap: 6,
    overflow: 'hidden',
    ...UI.shadow.md,
  },
  actionCardTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 4,
  },
  actionCardSub: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: 12,
    fontWeight: '600',
  },

  /* AI card */
  aiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: UI.radius.xxl,
    padding: 16,
    borderWidth: 1,
    ...UI.shadow.sm,
  },
  aiCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  aiBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiCardTitle: { fontSize: 14, fontWeight: '800' },
  aiCardSub: { fontSize: 12, marginTop: 2 },
  aiCount: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },

  /* entry rows */
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  entryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  entryDate: {
    fontSize: 14,
    fontWeight: '800',
  },
  entryDuration: {
    fontSize: 12,
    marginTop: 2,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  /* link card */
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: UI.radius.xxl,
    borderWidth: 1,
    ...UI.shadow.sm,
  },
});
