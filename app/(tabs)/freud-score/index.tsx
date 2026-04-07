import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Dimensions,
  Modal,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import { useFreudScore } from '@/hooks/useFreudScore';
import { getFreudColor } from '@/lib/freudScore';
import type { FreudScoreRecord } from '@/lib/freudScore';
import ScreenHeader from '@/components/ScreenHeader';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Svg, { Circle, Defs, LinearGradient, Stop, Line, Polyline, Text as SvgText } from 'react-native-svg';

const { width: SCREEN_W } = Dimensions.get('window');

/* ── Design tokens ── */
const BROWN = '#8B6B47';
const SAGE = '#5AAF8B';

/* ── Metric config ── */
const BREAKDOWN_METRICS = [
  { key: 'mood', emoji: '😊', color: '#5AAF8B' },
  { key: 'sleep', emoji: '🌙', color: '#7E57C2' },
  { key: 'stress', emoji: '⚡', color: '#FF9800' },
  { key: 'mindfulness', emoji: '🧘', color: '#42A5F5' },
  { key: 'consistency', emoji: '🔥', color: '#EC407A' },
  { key: 'journal', emoji: '📝', color: '#8BC34A' },
] as const;

/* ------------------------------------------------------------------ */
/*  Big score ring — premium feel with glow                            */
/* ------------------------------------------------------------------ */

function BigScoreRing({
  score,
  color,
  label,
  colors,
}: {
  score: number;
  color: string;
  label: string;
  colors: (typeof Colors)['light'] | (typeof Colors)['dark'];
}) {
  const size = 200;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Decorative tick marks
  const tickCount = 40;
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const angle = (i / tickCount) * 360 - 90;
    const rad = (angle * Math.PI) / 180;
    const outerR = radius + strokeWidth / 2 + 6;
    const innerR = radius + strokeWidth / 2 + 2;
    return {
      x1: size / 2 + Math.cos(rad) * innerR,
      y1: size / 2 + Math.sin(rad) * innerR,
      x2: size / 2 + Math.cos(rad) * outerR,
      y2: size / 2 + Math.sin(rad) * outerR,
      active: (i / tickCount) * 100 <= progress,
    };
  });

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: size + 24, height: size + 24, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size + 24} height={size + 24}>
          <Defs>
            <LinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={color} stopOpacity="1" />
              <Stop offset="100%" stopColor={color} stopOpacity="0.6" />
            </LinearGradient>
          </Defs>

          {/* Decorative tick marks */}
          {ticks.map((tick, i) => (
            <Line
              key={i}
              x1={tick.x1 + 12}
              y1={tick.y1 + 12}
              x2={tick.x2 + 12}
              y2={tick.y2 + 12}
              stroke={tick.active ? color : colors.border}
              strokeWidth={1.5}
              strokeLinecap="round"
              opacity={tick.active ? 0.6 : 0.3}
            />
          ))}

          {/* Background circle */}
          <Circle
            cx={(size + 24) / 2}
            cy={(size + 24) / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            opacity={0.1}
          />
          {/* Progress arc */}
          <Circle
            cx={(size + 24) / 2}
            cy={(size + 24) / 2}
            r={radius}
            stroke="url(#ringGrad)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${(size + 24) / 2}, ${(size + 24) / 2}`}
          />
        </Svg>

        {/* Center content */}
        <View style={{ position: 'absolute', alignItems: 'center' }}>
          <Text style={{ fontSize: 52, fontWeight: '900', color, letterSpacing: -2 }}>{score}</Text>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: colors.mutedText,
              marginTop: -2,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
            }}
          >
            {label}
          </Text>
        </View>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Metric breakdown card — rich mini cards instead of bars             */
/* ------------------------------------------------------------------ */

function MetricCard({
  emoji,
  label,
  value,
  color,
  colors,
}: {
  emoji: string;
  label: string;
  value: number;
  color: string;
  colors: (typeof Colors)['light'] | (typeof Colors)['dark'];
}) {
  return (
    <View
      style={[
        metricStyles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={[metricStyles.iconWrap, { backgroundColor: color + '14' }]}>
        <Text style={{ fontSize: 18 }}>{emoji}</Text>
      </View>
      <Text style={[metricStyles.label, { color: colors.mutedText }]}>{label}</Text>
      <View style={metricStyles.valueRow}>
        <Text style={[metricStyles.value, { color }]}>{value}</Text>
        <View style={metricStyles.barOuter}>
          <View
            style={[
              metricStyles.barInner,
              { width: `${Math.min(100, value)}%`, backgroundColor: color },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const metricStyles = StyleSheet.create({
  card: {
    width: (SCREEN_W - 40 - 12) / 2,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    ...UI.shadow.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  value: { fontSize: 22, fontWeight: '900' },
  barOuter: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(128,128,128,0.1)',
    overflow: 'hidden',
  },
  barInner: { height: '100%', borderRadius: 3 },
});

/* ------------------------------------------------------------------ */
/*  Score Chart — polished with area fill                              */
/* ------------------------------------------------------------------ */

const CHART_H = 180;
const CHART_PAD_L = 38;
const CHART_PAD_R = 12;
const CHART_PAD_T = 12;
const CHART_PAD_B = 28;

function ScoreChart({
  records,
  textColor,
  mutedColor,
}: {
  records: FreudScoreRecord[];
  textColor: string;
  mutedColor: string;
}) {
  const chartW = SCREEN_W - 40 - 40;
  const plotW = chartW - CHART_PAD_L - CHART_PAD_R;
  const plotH = CHART_H - CHART_PAD_T - CHART_PAD_B;

  const sorted = useMemo(
    () => [...records].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(-14),
    [records],
  );

  if (sorted.length < 2) return null;

  const yTicks = [0, 25, 50, 75, 100];
  const lastColor = getFreudColor(sorted[sorted.length - 1].score);

  const points = sorted.map((r, i) => {
    const x = CHART_PAD_L + (i / (sorted.length - 1)) * plotW;
    const y = CHART_PAD_T + plotH - (r.score / 100) * plotH;
    return { x, y, score: r.score, date: r.createdAt };
  });

  const polylineStr = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaStr = `${points[0].x},${CHART_PAD_T + plotH} ${polylineStr} ${points[points.length - 1].x},${CHART_PAD_T + plotH}`;

  return (
    <Svg width={chartW} height={CHART_H}>
      <Defs>
        <LinearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={lastColor} stopOpacity="0.2" />
          <Stop offset="100%" stopColor={lastColor} stopOpacity="0.02" />
        </LinearGradient>
      </Defs>

      {yTicks.map((tick) => {
        const y = CHART_PAD_T + plotH - (tick / 100) * plotH;
        return (
          <React.Fragment key={tick}>
            <Line
              x1={CHART_PAD_L}
              y1={y}
              x2={CHART_PAD_L + plotW}
              y2={y}
              stroke={mutedColor}
              strokeWidth={0.5}
              opacity={0.2}
            />
            <SvgText x={CHART_PAD_L - 6} y={y + 4} fontSize={10} fill={mutedColor} textAnchor="end">
              {tick}
            </SvgText>
          </React.Fragment>
        );
      })}

      <Polyline points={areaStr} fill="url(#chartFill)" />
      <Polyline
        points={polylineStr}
        fill="none"
        stroke={lastColor}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {points.map((p, i) => (
        <React.Fragment key={i}>
          {/* Glow behind dot */}
          <Circle cx={p.x} cy={p.y} r={6} fill={getFreudColor(p.score)} opacity={0.15} />
          <Circle cx={p.x} cy={p.y} r={3.5} fill={getFreudColor(p.score)} />
        </React.Fragment>
      ))}

      <SvgText x={points[0].x} y={CHART_H - 4} fontSize={9} fill={mutedColor} textAnchor="start">
        {new Date(sorted[0].createdAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        })}
      </SvgText>
      <SvgText
        x={points[points.length - 1].x}
        y={CHART_H - 4}
        fontSize={9}
        fill={mutedColor}
        textAnchor="end"
      >
        {new Date(sorted[sorted.length - 1].createdAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        })}
      </SvgText>
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Filter Modal                                                       */
/* ------------------------------------------------------------------ */

function FilterModal({
  visible,
  onClose,
  onApply,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  colors: (typeof Colors)['light'] | (typeof Colors)['dark'];
}) {
  const { t } = useTranslation();
  const [range, setRange] = useState<[number, number]>([0, 100]);
  const [includeAI, setIncludeAI] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('month');

  const periods = [
    { key: 'week' as const, label: '7d' },
    { key: 'month' as const, label: '30d' },
    { key: 'all' as const, label: t('common.all') ?? 'All' },
  ];

  const scoreRanges = [
    { min: 0, max: 40, label: t('freudScore.negative') },
    { min: 0, max: 100, label: t('common.all') ?? 'All' },
    { min: 60, max: 100, label: t('freudScore.positive') },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={filterStyles.overlay}>
        <View style={[filterStyles.sheet, { backgroundColor: colors.card }]}>
          <View style={filterStyles.handle} />

          <Text style={[filterStyles.title, { color: colors.text }]}>
            {t('freudScore.filterScore')}
          </Text>

          <Text style={[filterStyles.label, { color: colors.mutedText }]}>
            {t('freudScore.moodHistory')}
          </Text>
          <View style={filterStyles.chipRow}>
            {periods.map((p) => (
              <Pressable
                key={p.key}
                onPress={() => setPeriod(p.key)}
                style={[
                  filterStyles.chip,
                  {
                    backgroundColor: period === p.key ? BROWN : 'transparent',
                    borderColor: period === p.key ? BROWN : colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: period === p.key ? '#fff' : colors.mutedText,
                    fontWeight: '700',
                    fontSize: 13,
                  }}
                >
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[filterStyles.label, { color: colors.mutedText, marginTop: 20 }]}>
            {t('freudScore.scoreRange')}
          </Text>
          <View style={filterStyles.chipRow}>
            {scoreRanges.map((sr, idx) => {
              const active = range[0] === sr.min && range[1] === sr.max;
              return (
                <Pressable
                  key={idx}
                  onPress={() => setRange([sr.min, sr.max])}
                  style={[
                    filterStyles.chip,
                    {
                      backgroundColor: active ? BROWN : 'transparent',
                      borderColor: active ? BROWN : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: active ? '#fff' : colors.mutedText,
                      fontWeight: '700',
                      fontSize: 13,
                    }}
                  >
                    {sr.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={[filterStyles.toggleRow, { borderColor: colors.border }]}>
            <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>
              {t('freudScore.includeAI')}
            </Text>
            <Switch value={includeAI} onValueChange={setIncludeAI} trackColor={{ true: SAGE }} />
          </View>

          <Pressable
            onPress={() => {
              onApply({ scoreMin: range[0], scoreMax: range[1], includeAI, period });
              onClose();
            }}
            style={({ pressed }) => [filterStyles.applyBtn, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={filterStyles.applyBtnText}>{t('freudScore.filterButton')}</Text>
          </Pressable>

          <Pressable onPress={onClose} style={{ alignSelf: 'center', marginTop: 14 }}>
            <Text style={{ color: colors.mutedText, fontSize: 14, fontWeight: '600' }}>
              {t('common.close')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

type FilterState = {
  scoreMin: number;
  scoreMax: number;
  includeAI: boolean;
  period: 'week' | 'month' | 'all';
};

/* ------------------------------------------------------------------ */
/*  Screen                                                             */
/* ------------------------------------------------------------------ */

export default function FreudScoreScreen() {
  const { t } = useTranslation();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { currentScore, scoreHistory, isLoadingHistory, isDataLoading, saveScore } = useFreudScore();
  const hasSavedRef = useRef(false);
  const [showFilter, setShowFilter] = useState(false);

  /* ── Invalidate all source data on screen focus so score recalculates ── */
  useFocusEffect(
    useCallback(() => {
      hasSavedRef.current = false;
      queryClient.invalidateQueries({ queryKey: queryKeys.mood.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.sleep.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.mindfulness.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stress.allHistory });
      queryClient.invalidateQueries({ queryKey: queryKeys.freudScore.all });
      queryClient.invalidateQueries({ queryKey: ['freudScoreTodayBest'] });
    }, [queryClient]),
  );

  /* ── Auto-save today's score snapshot once all data has settled ── */
  useEffect(() => {
    if (!isDataLoading && !isLoadingHistory && currentScore.score > 0 && !hasSavedRef.current) {
      hasSavedRef.current = true;
      saveScore({ result: currentScore, generateSuggestions: false }).catch(() => {});
    }
  }, [isDataLoading, isLoadingHistory, currentScore, saveScore]);
  const [filters, setFilters] = useState<FilterState>({
    scoreMin: 0,
    scoreMax: 100,
    includeAI: true,
    period: 'month',
  });
  const [chartView, setChartView] = useState<'chart' | 'list'>('chart');

  const scoreColor = getFreudColor(currentScore.score);

  const filteredHistory = useMemo(() => {
    let result = [...scoreHistory];
    if (filters.period !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      cutoff.setDate(now.getDate() - (filters.period === 'week' ? 7 : 30));
      result = result.filter((r) => new Date(r.createdAt) >= cutoff);
    }
    result = result.filter((r) => r.score >= filters.scoreMin && r.score <= filters.scoreMax);
    if (!filters.includeAI) {
      result = result.filter((r) => r.source !== 'ai');
    }
    return result;
  }, [scoreHistory, filters]);

  const labelKey = useMemo(() => {
    const map: Record<string, string> = {
      'Critically Low': 'criticallyLow',
      'Very Low': 'veryLow',
      Low: 'low',
      'Below Average': 'belowAverage',
      Average: 'average',
      'Above Average': 'aboveAverage',
      Good: 'good',
      'Very Good': 'veryGood',
      'Mentally Stable': 'mentallyStable',
      Excellent: 'excellent',
    };
    return map[currentScore.label] ?? 'average';
  }, [currentScore.label]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={t('freudScore.title')}
          subtitle={t('freudScore.subtitle')}
          rightElement={
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <Pressable
                onPress={() => setShowFilter(true)}
                style={({ pressed }) => [
                  styles.headerBtn,
                  { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <MaterialIcons name="tune" size={18} color={colors.mutedText} />
              </Pressable>
              <Pressable
                onPress={() => router.push('/(tabs)/freud-score/ai-suggestions' as any)}
                style={({ pressed }) => [
                  styles.headerBtn,
                  { backgroundColor: SAGE + '15', borderColor: SAGE + '30', opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <MaterialIcons name="auto-awesome" size={18} color={SAGE} />
              </Pressable>
            </View>
          }
        />

        {/* ── Main score card ── */}
        <View
          style={[
            styles.scoreCard,
            {
              backgroundColor: theme === 'light' ? '#F8F5F0' : colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          {isDataLoading ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ color: colors.mutedText, marginTop: 12, fontSize: 14 }}>
                {t('freudScore.calculatingScore') || 'Calculating your score...'}
              </Text>
            </View>
          ) : (
            <>
              <BigScoreRing
                score={currentScore.score}
                color={scoreColor}
                label={t(`freudScore.${labelKey}`)}
                colors={colors}
              />

              {/* AI Suggestions CTA */}
              <Pressable
                onPress={() => router.push('/(tabs)/freud-score/ai-suggestions' as any)}
                style={({ pressed }) => [
                  styles.suggestionCta,
                  {
                    backgroundColor: SAGE + '12',
                    borderColor: SAGE + '25',
                    opacity: pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
              >
                <MaterialIcons name="auto-awesome" size={16} color={SAGE} />
                <Text style={{ fontSize: 13, color: SAGE, fontWeight: '700', flex: 1 }}>
                  {t('freudScore.swipeForSuggestions')}
                </Text>
                <MaterialIcons name="chevron-right" size={18} color={SAGE} />
              </Pressable>
            </>
          )}
        </View>

        {/* ── Metric breakdown grid ── */}
        <View style={{ marginTop: 20 }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('freudScore.breakdown')}
          </Text>

          {isDataLoading ? (
            <View style={{ alignItems: 'center', paddingVertical: 16 }}>
              <ActivityIndicator size="small" color={colors.mutedText} />
            </View>
          ) : (
            <View style={styles.metricsGrid}>
              {BREAKDOWN_METRICS.map((m) => (
                <MetricCard
                  key={m.key}
                  emoji={m.emoji}
                  label={t(`freudScore.${m.key}`)}
                  value={currentScore.breakdown[m.key as keyof typeof currentScore.breakdown] ?? 0}
                  color={m.color}
                  colors={colors}
                />
              ))}
            </View>
          )}
        </View>

        {/* ── Score history ── */}
        <View
          style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { marginBottom: 0, color: colors.text }]}>
              {t('freudScore.scoreHistory')}
            </Text>
            <View style={[styles.toggleGroup, { backgroundColor: colors.background }]}>
              <Pressable
                onPress={() => setChartView('chart')}
                style={[
                  styles.viewToggle,
                  {
                    backgroundColor: chartView === 'chart' ? colors.card : 'transparent',
                  },
                  chartView === 'chart' && UI.shadow.sm,
                ]}
              >
                <MaterialIcons
                  name="show-chart"
                  size={16}
                  color={chartView === 'chart' ? colors.text : colors.mutedText}
                />
              </Pressable>
              <Pressable
                onPress={() => setChartView('list')}
                style={[
                  styles.viewToggle,
                  {
                    backgroundColor: chartView === 'list' ? colors.card : 'transparent',
                  },
                  chartView === 'list' && UI.shadow.sm,
                ]}
              >
                <MaterialIcons
                  name="format-list-bulleted"
                  size={16}
                  color={chartView === 'list' ? colors.text : colors.mutedText}
                />
              </Pressable>
            </View>
          </View>

          {filteredHistory.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={{ fontSize: 32 }}>📊</Text>
              <Text style={{ color: colors.mutedText, fontSize: 14, marginTop: 8, textAlign: 'center' }}>
                {t('freudScore.noHistory')}
              </Text>
            </View>
          ) : chartView === 'chart' ? (
            <ScoreChart
              records={filteredHistory}
              textColor={colors.text}
              mutedColor={colors.mutedText}
            />
          ) : (
            filteredHistory.slice(0, 10).map((record, idx) => {
              const recordColor = getFreudColor(record.score);
              const date = new Date(record.createdAt);
              return (
                <View
                  key={record.id}
                  style={[
                    styles.historyRow,
                    idx < Math.min(9, filteredHistory.length - 1) && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View style={[styles.historyScoreBadge, { backgroundColor: recordColor + '14' }]}>
                    <Text style={[styles.historyScoreNum, { color: recordColor }]}>
                      {record.score}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.historyLabel, { color: colors.text }]}>
                      {record.label}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.mutedText }}>
                      {date.toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View style={[styles.historyTrend, { backgroundColor: recordColor + '10' }]}>
                    <MaterialIcons
                      name={record.score >= 50 ? 'trending-up' : 'trending-down'}
                      size={16}
                      color={recordColor}
                    />
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <FilterModal
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        onApply={setFilters}
        colors={colors}
      />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  scroll: { paddingBottom: 120 },

  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  scoreCard: {
    borderRadius: 28,
    padding: 24,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 1,
    ...UI.shadow.md,
  },

  suggestionCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    width: '100%',
  },

  sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: 14 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  section: {
    borderRadius: 22,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    ...UI.shadow.sm,
  },

  toggleGroup: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  viewToggle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 30,
  },

  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 14,
  },
  historyScoreBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyScoreNum: { fontSize: 18, fontWeight: '900' },
  historyLabel: { fontSize: 15, fontWeight: '700' },
  historyTrend: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/* ------------------------------------------------------------------ */
/*  Filter modal styles                                                */
/* ------------------------------------------------------------------ */

const filterStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    ...UI.shadow.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.3)',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: '900', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
  chipRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 22,
    paddingTop: 18,
    borderTopWidth: 1,
  },
  applyBtn: {
    marginTop: 24,
    backgroundColor: BROWN,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  applyBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
