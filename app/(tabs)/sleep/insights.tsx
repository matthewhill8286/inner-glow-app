import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Platform,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSleep } from '@/hooks/useSleep';
import { useSleepInsights } from '@/hooks/useSleepInsights';
import { SleepEntry } from '@/lib/types';
import CitationSection from '@/components/CitationSection';

const { width: SCREEN_W } = Dimensions.get('window');

/* ── colors ──────────────────────────────────────── */
const SLEEP_COLORS = {
  core: '#5B8A5A',
  rem: '#7B6DC9',
  post: '#E8985A',
  irregular: '#C45B5B',
};

/* ── helpers ──────────────────────────────────────── */
function goBack(from?: string) {
  if (from) router.replace(from as any);
  else router.back();
}

function getEntryDuration(entry: SleepEntry) {
  if (entry.duration) return entry.duration;
  return Math.max(
    0,
    (new Date(entry.endISO).getTime() - new Date(entry.startISO).getTime()) / (1000 * 60 * 60),
  );
}

const TIME_PERIODS = ['1 Day', '1 Week', '1 Month', '1 Year', 'All Time'] as const;

/* ── Bar Chart Component ─────────────────────────── */
function BarChart({
  data,
  maxVal,
  colors,
}: {
  data: { label: string; value: number; color: string }[];
  maxVal: number;
  colors: any;
}) {
  const barWidth = Math.max(12, (SCREEN_W - 120) / data.length - 8);

  return (
    <View style={barS.container}>
      <View style={barS.barsRow}>
        {data.map((d, i) => {
          const heightPct = maxVal > 0 ? (d.value / maxVal) * 100 : 0;
          return (
            <View key={i} style={barS.barCol}>
              <View style={[barS.barTrack, { backgroundColor: colors.inputBg }]}>
                <View
                  style={[
                    barS.barFill,
                    {
                      backgroundColor: d.color,
                      height: `${Math.max(4, heightPct)}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[barS.barLabel, { color: colors.subtleText }]}>{d.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const barS = StyleSheet.create({
  container: { paddingVertical: 8 },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 120,
  },
  barCol: { alignItems: 'center', gap: 6 },
  barTrack: {
    width: 16,
    height: 100,
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 8,
  },
  barLabel: { fontSize: 10, fontWeight: '600' },
});

/* ── AI Suggestion Item ──────────────────────────── */
function AISuggestionItem({
  icon,
  title,
  subtitle,
  color,
  colors,
  citations,
}: {
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  colors: any;
  citations?: Array<{ source: string; title: string; url: string }>;
}) {
  return (
    <View style={[sugS.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[sugS.iconWrap, { backgroundColor: color + '15' }]}>
        <MaterialIcons name={icon as any} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[sugS.title, { color: colors.text }]}>{title}</Text>
        <Text style={[sugS.subtitle, { color: colors.mutedText }]}>{subtitle}</Text>
        {citations && citations.length > 0 && (
          <CitationSection
            citations={citations}
            accentColor={color}
            colors={colors}
            compact
          />
        )}
      </View>
      <MaterialIcons name="chevron-right" size={18} color={colors.subtleText} />
    </View>
  );
}

const sugS = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: UI.radius.xxl,
    borderWidth: 1,
    ...UI.shadow.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 14, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 2 },
});

/* ── Main Screen ─────────────────────────────────── */
export default function SleepInsightsScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { sleepEntries: entries } = useSleep();
  const {
    suggestions: aiSuggestionData,
    summary: aiSummary,
    summaryCitations: aiSummaryCitations,
    isLoading: aiLoading,
    isFetching: aiFetching,
    isError: aiError,
    refetch: refetchAI,
    hasData: hasAIData,
  } = useSleepInsights();

  const [selectedPeriod, setSelectedPeriod] = useState<(typeof TIME_PERIODS)[number]>('1 Week');

  // Filter entries by period
  const filteredEntries = useMemo(() => {
    const now = Date.now();
    const msMap: Record<string, number> = {
      '1 Day': 86400000,
      '1 Week': 7 * 86400000,
      '1 Month': 30 * 86400000,
      '1 Year': 365 * 86400000,
      'All Time': Infinity,
    };
    const cutoff = now - (msMap[selectedPeriod] || Infinity);
    return entries.filter((e) => new Date(e.startISO).getTime() >= cutoff);
  }, [entries, selectedPeriod]);

  // Build chart data
  const chartData = useMemo(() => {
    if (filteredEntries.length === 0) return [];
    const last7 = filteredEntries.slice(0, 7).reverse();
    return last7.map((e) => {
      const dur = getEntryDuration(e);
      const d = new Date(e.startISO);
      return {
        label: d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 3),
        value: dur,
        color: dur >= 7 ? SLEEP_COLORS.core : dur >= 5 ? SLEEP_COLORS.rem : SLEEP_COLORS.irregular,
      };
    });
  }, [filteredEntries]);

  const maxChartVal = Math.max(10, ...chartData.map((d) => d.value));

  // Compute stats
  const avgDur =
    filteredEntries.length > 0
      ? filteredEntries.reduce((a, e) => a + getEntryDuration(e), 0) / filteredEntries.length
      : 0;
  const avgQual =
    filteredEntries.filter((e) => e.quality).length > 0
      ? filteredEntries.filter((e) => e.quality).reduce((a, e) => a + (e.quality || 0), 0) /
        filteredEntries.filter((e) => e.quality).length
      : 0;

  // Sleep irregularity (std dev of bedtimes)
  const bedtimeHours = filteredEntries.map((e) => {
    const d = new Date(e.startISO);
    let h = d.getHours() + d.getMinutes() / 60;
    if (h < 12) h += 24; // normalize late nights
    return h;
  });
  const avgBedtime =
    bedtimeHours.length > 0 ? bedtimeHours.reduce((a, b) => a + b, 0) / bedtimeHours.length : 0;
  const stdDev =
    bedtimeHours.length > 1
      ? Math.sqrt(bedtimeHours.reduce((a, b) => a + (b - avgBedtime) ** 2, 0) / bedtimeHours.length)
      : 0;
  const irregularity = Math.min(100, Math.round(stdDev * 20));

  // AI suggestions come from the hook now

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
          <Text style={[s.headerTitle, { color: colors.text }]}>{t('sleepInsights.title')}</Text>
          <Text style={[s.headerSub, { color: colors.mutedText }]}>
            {t('sleepInsights.subtitle')}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Period Tabs ───────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.periodTabs}
        >
          {TIME_PERIODS.map((p) => {
            const periodLabel =
              p === '1 Day'
                ? t('sleepInsights.oneDay')
                : p === '1 Week'
                  ? t('sleepInsights.oneWeek')
                  : p === '1 Month'
                    ? t('sleepInsights.oneMonth')
                    : p === '1 Year'
                      ? t('sleepInsights.oneYear')
                      : t('sleepInsights.allTime');
            return (
              <Pressable
                key={p}
                onPress={() => setSelectedPeriod(p)}
                style={[
                  s.periodTab,
                  {
                    backgroundColor: selectedPeriod === p ? '#8B6B47' : colors.inputBg,
                  },
                ]}
              >
                <Text
                  style={[s.periodTabText, { color: selectedPeriod === p ? '#FFF' : colors.text }]}
                >
                  {periodLabel}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Chart ─────────────────────────────── */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.cardLabel, { color: colors.mutedText }]}>
            {t('sleepInsights.sleepDuration')}
          </Text>
          {chartData.length > 0 ? (
            <BarChart data={chartData} maxVal={maxChartVal} colors={colors} />
          ) : (
            <View style={s.emptyChart}>
              <Text style={{ color: colors.subtleText, fontSize: 13 }}>
                {t('sleepInsights.noData')}
              </Text>
            </View>
          )}
        </View>

        {/* ── Sleep Irregularity ────────────────── */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.irregularRow}>
            <View style={{ flex: 1 }}>
              <Text style={[s.cardLabel, { color: colors.mutedText, marginBottom: 4 }]}>
                {t('sleepInsights.sleepIrregularity')}
              </Text>
              <Text style={[s.irregularValue, { color: colors.text }]}>{irregularity}%</Text>
            </View>
            <View
              style={[
                s.irregularBadge,
                {
                  backgroundColor:
                    irregularity < 30
                      ? SLEEP_COLORS.core + '18'
                      : irregularity < 60
                        ? SLEEP_COLORS.post + '18'
                        : SLEEP_COLORS.irregular + '18',
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color:
                    irregularity < 30
                      ? SLEEP_COLORS.core
                      : irregularity < 60
                        ? SLEEP_COLORS.post
                        : SLEEP_COLORS.irregular,
                }}
              >
                {irregularity < 30
                  ? t('sleepInsights.regular')
                  : irregularity < 60
                    ? t('sleepInsights.moderate')
                    : t('sleepInsights.irregular')}
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={[s.progressTrack, { backgroundColor: colors.inputBg }]}>
            <View
              style={[
                s.progressFill,
                {
                  width: `${irregularity}%`,
                  backgroundColor:
                    irregularity < 30
                      ? SLEEP_COLORS.core
                      : irregularity < 60
                        ? SLEEP_COLORS.post
                        : SLEEP_COLORS.irregular,
                },
              ]}
            />
          </View>
        </View>

        {/* ── Stats Breakdown ──────────────────── */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.cardLabel, { color: colors.mutedText }]}>
            {t('sleepInsights.breakdown')}
          </Text>
          <View style={s.statsGrid}>
            <View style={[s.statBlock, { backgroundColor: SLEEP_COLORS.core + '12' }]}>
              <Text style={{ fontSize: 20 }}>🌙</Text>
              <Text style={[s.statValue, { color: SLEEP_COLORS.core }]}>
                {(avgDur * 0.65).toFixed(1)}h
              </Text>
              <Text style={[s.statLabel, { color: colors.mutedText }]}>
                {t('sleepInsights.core')}
              </Text>
            </View>
            <View style={[s.statBlock, { backgroundColor: SLEEP_COLORS.rem + '12' }]}>
              <Text style={{ fontSize: 20 }}>💭</Text>
              <Text style={[s.statValue, { color: SLEEP_COLORS.rem }]}>
                {(avgDur * 0.25).toFixed(1)}h
              </Text>
              <Text style={[s.statLabel, { color: colors.mutedText }]}>
                {t('sleepInsights.rem')}
              </Text>
            </View>
            <View style={[s.statBlock, { backgroundColor: SLEEP_COLORS.post + '12' }]}>
              <Text style={{ fontSize: 20 }}>✨</Text>
              <Text style={[s.statValue, { color: SLEEP_COLORS.post }]}>
                {Math.round(avgDur * 0.1 * 60)}m
              </Text>
              <Text style={[s.statLabel, { color: colors.mutedText }]}>
                {t('sleepInsights.postRem')}
              </Text>
            </View>
          </View>
        </View>

        {/* ── AI Suggestions ───────────────────── */}
        <View style={s.sectionHeader}>
          <Text style={{ fontSize: 18 }}>🤖</Text>
          <Text style={[s.sectionTitle, { color: colors.text }]}>
            {t('sleepInsights.aiSuggestions')}
          </Text>
          {hasAIData && (
            <Pressable
              onPress={() => refetchAI()}
              disabled={aiFetching}
              style={({ pressed }) => ({
                marginLeft: 'auto',
                opacity: pressed ? 0.6 : 1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              })}
            >
              {aiFetching ? (
                <ActivityIndicator size="small" color="#8B6B47" />
              ) : (
                <>
                  <MaterialIcons name="refresh" size={16} color="#8B6B47" />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#8B6B47' }}>
                    {t('sleepInsights.refreshInsights')}
                  </Text>
                </>
              )}
            </Pressable>
          )}
        </View>

        {/* AI Summary */}
        {aiSummary ? (
          <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={{ fontSize: 14, color: colors.text, lineHeight: 20, fontWeight: '500' }}>
              {aiSummary}
            </Text>
            {aiSummaryCitations.length > 0 && (
              <CitationSection
                citations={aiSummaryCitations}
                accentColor="#5A8FB5"
                colors={colors as any}
                compact
              />
            )}
          </View>
        ) : null}

        {/* Loading state */}
        {aiLoading ? (
          <View style={{ alignItems: 'center', paddingVertical: 32, gap: 12 }}>
            <ActivityIndicator size="large" color="#8B6B47" />
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
              {t('sleepInsights.analyzing')}
            </Text>
            <Text style={{ fontSize: 12, color: colors.mutedText }}>
              {t('sleepInsights.analyzingSubtitle')}
            </Text>
          </View>
        ) : aiError ? (
          /* Error state */
          <View
            style={[
              s.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                alignItems: 'center',
                paddingVertical: 28,
                gap: 10,
              },
            ]}
          >
            <MaterialIcons name="cloud-off" size={32} color={SLEEP_COLORS.irregular} />
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>
              {t('sleepInsights.errorTitle')}
            </Text>
            <Text style={{ fontSize: 13, color: colors.mutedText, textAlign: 'center' }}>
              {t('sleepInsights.errorSubtitle')}
            </Text>
            <Pressable
              onPress={() => refetchAI()}
              style={({ pressed }) => ({
                marginTop: 8,
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: '#8B6B47',
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>
                {t('sleepInsights.retry')}
              </Text>
            </Pressable>
          </View>
        ) : !hasAIData ? (
          /* No data state */
          <View
            style={[
              s.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                alignItems: 'center',
                paddingVertical: 28,
                gap: 10,
              },
            ]}
          >
            <MaterialIcons name="bedtime" size={32} color={SLEEP_COLORS.rem} />
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>
              {t('sleepInsights.noDataTitle')}
            </Text>
            <Text style={{ fontSize: 13, color: colors.mutedText, textAlign: 'center' }}>
              {t('sleepInsights.noDataSubtitle')}
            </Text>
          </View>
        ) : (
          /* Suggestion cards */
          aiSuggestionData.map((sug) => (
            <AISuggestionItem
              key={sug.id}
              icon={sug.icon}
              title={sug.title}
              subtitle={sug.subtitle}
              color={sug.color}
              colors={colors}
              citations={sug.citations}
            />
          ))
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

  /* period tabs */
  periodTabs: {
    gap: 8,
    paddingVertical: 4,
  },
  periodTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  periodTabText: {
    fontSize: 13,
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
    marginBottom: 10,
  },
  emptyChart: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* irregularity */
  irregularRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  irregularValue: {
    fontSize: 28,
    fontWeight: '900',
  },
  irregularBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    marginTop: 14,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  /* stats */
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
    borderRadius: UI.radius.lg,
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
  },

  /* section */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
});
