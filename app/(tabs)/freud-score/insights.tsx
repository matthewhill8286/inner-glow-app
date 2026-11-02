import React, { useMemo, useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Polyline, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { AppButton } from '@/components/ui/AppButton';
import { LegalNote } from '@/components/ui/controls';
import { Icon, type IconName } from '@/components/icons/Icon';
import {
  DeltaPill,
  PeriodPills,
  ScoreCard,
  ScoreNav,
  ScoreScreen,
  usePeriodText,
} from '@/components/score/ScoreParts';
import { useScoreDays } from '@/hooks/useScoreDays';
import {
  daysInPeriod,
  factorImpacts,
  mixStops,
  moodMix,
  MOOD_BUCKETS,
  periodEnd,
  periodStart,
  periodSummary,
  signed,
  trendPoints,
  trendSeries,
  type MoodBucket,
  type ScorePeriod,
} from '@/lib/glow-score';
import { backTo } from '@/lib/navigation';

/** Icons for the Insights factors (03 §2.4). */
const FACTOR_ICON: Record<string, IconName> = {
  breathing: 'line/leaf',
  practice: 'line/meditate',
  sleep7: 'line/moon',
  shortSleep: 'line/moon',
  journal: 'line/journal',
  exercise: 'line/activity',
  people: 'line/users',
  work: 'line/note',
  alone_time: 'line/user',
  health: 'line/health',
  money: 'line/chart',
  weather: 'line/sparkle',
};

/** Mood mix colours (03 §4.4) and faces. */
const BUCKET_LOOK: Record<MoodBucket, { color: string; face: IconName }> = {
  good: { color: palette.sky, face: 'mood/happy' },
  okay: { color: palette.border, face: 'mood/neutral' },
  low: { color: palette.lavenderSoft, face: 'mood/sad' },
  tense: { color: palette.rose, face: 'mood/angry' },
};

const CHART_H = 104;

/**
 * Insights (03 §2.4): the period's score trend against its average, what helps and what pulls the
 * score down (average score on days with a factor against days without it), the mood mix and
 * Get AI suggestions. Late-night scrolling has no data source, so it never shows.
 */
export default function InsightsScreen() {
  const { t, i18n } = useTranslation();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { width: screenW } = useWindowDimensions();
  const chartW = screenW - 48 - 40;
  const { days, moodCheckIns } = useScoreDays();
  const [period, setPeriod] = useState<ScorePeriod>('1M');
  const now = useMemo(() => new Date(), []);
  const text = usePeriodText(period, now);

  const summary = useMemo(() => periodSummary(days, period, now), [days, period, now]);
  const series = useMemo(() => trendSeries(days, period, now), [days, period, now]);
  const impacts = useMemo(() => {
    const inPeriod = daysInPeriod(days, period, now);
    return factorImpacts(inPeriod, new Map(days.map((d) => [d.key, d.factors])));
  }, [days, period, now]);
  const mix = useMemo(() => {
    const start = periodStart(period, now).getTime();
    const end = periodEnd(period, periodStart(period, now)).getTime();
    return moodMix(
      moodCheckIns
        .filter((c) => {
          const at = Date.parse(c.createdAt);
          return at >= start && at < end;
        })
        .map((c) => c.mood),
    );
  }, [moodCheckIns, period, now]);

  const first = daysInPeriod(days, period, now).at(-1);

  return (
    <ScoreScreen
      glows={[
        { color: palette.sky, opacity: 0.2, x: 180, y: 30, width: 240, blur: 90 },
        { color: palette.mustard, opacity: 0.25, x: -50, y: 0, width: 260, blur: 90 },
      ]}
      nav={<ScoreNav label={t('glowScore.insights')} backLabel={t('common.back')} onBack={() => backTo(from, '/(tabs)/freud-score')} />}
    >
      <Text accessibilityRole="header" style={[Type.titleXl, { color: palette.plumDeep, marginTop: 21, letterSpacing: 0 }]}>
        {t('glowScore.insightsTitle')}
      </Text>
      <Text style={[Type.bodyS, { lineHeight: 20, color: palette.textMuted, marginTop: 6, maxWidth: 300 }]}>
        {t('glowScore.insightsSubtitle')}
      </Text>

      <PeriodPills value={period} onChange={setPeriod} labels={text.labels} style={{ marginTop: 16 }} />

      <ScoreCard style={{ marginTop: 17, paddingTop: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
          <View>
            <Text style={[Type.microBold, { color: palette.textSubtle }]}>{t('glowScore.eyebrow')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
              <Text style={[Type.display, { fontSize: 34, lineHeight: 41, color: palette.plumDeep }]}>{summary.average ?? '–'}</Text>
              <Text style={[Type.chip, { color: palette.textMuted }]}>{t('glowScore.averageLower')}</Text>
            </View>
          </View>
          {summary.delta !== null && <DeltaPill delta={summary.delta} label={text.versus} />}
        </View>
        {series.length >= 2 ? (
          <>
            <TrendChart values={series} average={summary.average!} width={chartW} label={t('glowScore.avg', { value: summary.average })} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
              <Text style={[Type.micro, { color: palette.textSubtle }]}>
                {first?.date.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' })}
              </Text>
              <Text style={[Type.microBold, { color: palette.plumDeep }]}>
                {t('glowScore.latest', { value: series.at(-1) })}
              </Text>
            </View>
          </>
        ) : (
          <Text style={[Type.captionM, { color: palette.textMuted, marginTop: 16 }]}>{t('glowScore.needMoreDays')}</Text>
        )}
      </ScoreCard>

      <FactorCard title={t('glowScore.helps')} items={impacts.helps} positive />
      {impacts.hurts.length > 0 && <FactorCard title={t('glowScore.pullsDown')} items={impacts.hurts} positive={false} />}

      <ScoreCard style={{ marginTop: 12, paddingTop: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[Type.bodyStrong, { color: palette.plumDeep }]}>{t('glowScore.moodMix')}</Text>
          <Text style={[Type.caption, { fontWeight: '500', color: palette.textSubtle }]}>
            {t('glowScore.checkIns', { count: mix.total })}
          </Text>
        </View>
        {mix.total > 0 ? (
          <>
            <MixBar shares={mix.shares} width={chartW} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 8, marginTop: 14 }}>
              {MOOD_BUCKETS.filter((b) => mix.shares[b] > 0).map((b) => (
                <View key={b} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Icon name={BUCKET_LOOK[b].face} size={16} />
                  <Text style={[Type.caption, { color: palette.ink }]}>
                    {`${t(`glowScore.mood.${b}`)} ${mix.shares[b]}%`}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <Text style={[Type.captionM, { color: palette.textMuted, marginTop: 12 }]}>{t('glowScore.noCheckInsPeriod')}</Text>
        )}
      </ScoreCard>

      <LegalNote text={t('glowScore.insightsLegal')} style={{ marginTop: 19 }} />
      <AppButton
        title={t('glowScore.getSuggestions')}
        icon="line/sparkle"
        iconPosition="left"
        onPress={() => router.push('/(tabs)/freud-score/ai-suggestions')}
        style={{ marginTop: 32 }}
      />
    </ScoreScreen>
  );
}

/** Line chart (03 §4.3): plum line, mustard area, dashed average and the end dot. */
function TrendChart({ values, average, width, label }: { values: number[]; average: number; width: number; label: string }) {
  // Inset by the end dot's radius so it is not clipped at the right edge.
  const pts = trendPoints(values, width - 14, CHART_H).map((p) => ({ x: p.x + 7, y: p.y }));
  const lo = Math.min(...values) - 2;
  const hi = Math.max(...values) + 2;
  const avgY = 77.6 - ((average - lo) / (hi - lo)) * 60;
  const last = pts.at(-1)!;
  const line = pts.map((p) => `${p.x},${p.y}`).join(' ');
  return (
    <Svg width={width} height={CHART_H} style={{ marginTop: 18 }} accessibilityLabel={label}>
      <Defs>
        <LinearGradient id="trendArea" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={palette.mustard} stopOpacity={0.45} />
          <Stop offset="1" stopColor={palette.mustard} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={`M${pts[0].x},102 ${pts.map((p) => `L${p.x},${p.y}`).join(' ')} L${last.x},102 Z`} fill="url(#trendArea)" />
      <Line x1={0} x2={width} y1={avgY} y2={avgY} stroke={palette.textSubtle} strokeWidth={1} strokeDasharray="4 4" />
      <SvgText x={width} y={avgY - 5} fill={palette.textSubtle} fontSize={11} fontFamily={Type.body.fontFamily} fontWeight="500" textAnchor="end">
        {label}
      </SvgText>
      <Polyline points={line} stroke={palette.plum} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={last.x} cy={last.y} r={5} fill={palette.white} stroke={palette.mustard} strokeWidth={3} />
    </Svg>
  );
}

/** Mood mix bar (03 §4.4): 18 high, radius 9, one colour block per bucket with soft joins. */
function MixBar({ shares, width }: { shares: Record<MoodBucket, number>; width: number }) {
  const stops = mixStops(shares);
  return (
    <Svg width={width} height={18} style={{ marginTop: 14 }} accessibilityElementsHidden>
      <Defs>
        <LinearGradient id="moodMix" x1="0" y1="0" x2="1" y2="0">
          {stops.map((s, i) => (
            <Stop key={i} offset={s.offset} stopColor={BUCKET_LOOK[s.bucket].color} stopOpacity={0.95} />
          ))}
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={18} rx={9} fill="url(#moodMix)" />
    </Svg>
  );
}

/** What helps / What pulls it down (03 §2.4, §4.5): icon bubble, label, impact bar and value. */
function FactorCard({ title, items, positive }: { title: string; items: { key: string; impact: number }[]; positive: boolean }) {
  const { t } = useTranslation();
  const tint = positive ? 'rgba(142,127,166,0.18)' : 'rgba(232,154,122,0.18)';
  const fill = positive ? palette.lavender : '#E89A7A';
  const value = positive ? palette.lavender : '#C9744F';
  return (
    <ScoreCard style={{ marginTop: 16, paddingTop: 18, gap: 12 }}>
      <Text style={[Type.bodyStrong, { color: palette.plumDeep }]}>{title}</Text>
      {items.length === 0 ? (
        <Text style={[Type.captionM, { color: palette.textMuted }]}>{t('glowScore.needMoreFactors')}</Text>
      ) : (
        items.map((f) => (
          <View
            key={f.key}
            accessible
            accessibilityLabel={`${t(`glowScore.factors.${f.key}`)}, ${signed(f.impact)}`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 30 }}
          >
            <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={FACTOR_ICON[f.key] ?? 'line/sparkle'} size={16} color={positive ? palette.plum : '#C9744F'} />
            </View>
            <Text numberOfLines={1} style={[Type.label, { flex: 1, color: palette.ink }]}>
              {t(`glowScore.factors.${f.key}`)}
            </Text>
            <View style={{ width: 80, height: 6, borderRadius: 3, backgroundColor: palette.surfaceSand, overflow: 'hidden' }}>
              <View style={{ width: Math.min(80, 10 * Math.abs(f.impact)), height: 6, borderRadius: 3, backgroundColor: fill }} />
            </View>
            <Text style={[Type.label, { fontWeight: '700', color: value, width: 30, textAlign: 'right' }]}>{signed(f.impact)}</Text>
          </View>
        ))
      )}
    </ScoreCard>
  );
}
