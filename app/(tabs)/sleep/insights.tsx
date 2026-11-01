import React, { useMemo, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Polyline,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { LegalNote, SegmentedControl } from '@/components/ui/controls';
import { SettingsScreen, SettingsSection } from '@/components/settings/SettingsParts';
import { useSleep } from '@/hooks/useSleep';
import { backTo } from '@/lib/navigation';
import {
  chartY,
  factorImpacts,
  formatHours,
  nightsInPeriod,
  periodAverage,
  periodSeries,
  startOfPeriod,
  type Period,
} from '@/lib/sleep-periods';

const CHART_H = 150;
const GOAL_Y = chartY(8);
const DESIGN_W = 327;

/** Week (06 §4.6): straight segments with a gradient line and soft area; missing nights break it. */
function WeekLine({ values, width }: { values: (number | null)[]; width: number }) {
  const sx = width / DESIGN_W;
  const pts = values.map((v, i) => (v === null ? null : { x: (12 + 50 * i) * sx, y: chartY(v) }));
  // A missing night ends one run of the line and the next night starts another.
  const segments: { x: number; y: number }[][] = [];
  let run: { x: number; y: number }[] = [];
  for (const p of pts) {
    if (p) run.push(p);
    else if (run.length) {
      segments.push(run);
      run = [];
    }
  }
  if (run.length) segments.push(run);
  const last = [...pts].reverse().find(Boolean);
  return (
    <>
      <Defs>
        <LinearGradient id="sleepLine" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={palette.lavender} />
          <Stop offset="1" stopColor={palette.mustard} />
        </LinearGradient>
        <LinearGradient id="sleepArea" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={palette.lavenderSoft} stopOpacity={0.45} />
          <Stop offset="1" stopColor={palette.lavenderSoft} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      {segments.map((run, i) => (
        <React.Fragment key={i}>
          {run.length > 1 && (
            <Path
              d={`M${run[0].x},${CHART_H} ${run.map((p) => `L${p.x},${p.y}`).join(' ')} L${run.at(-1)!.x},${CHART_H} Z`}
              fill="url(#sleepArea)"
            />
          )}
          <Polyline
            points={run.map((p) => `${p.x},${p.y}`).join(' ')}
            stroke="url(#sleepLine)"
            strokeWidth={2.5}
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </React.Fragment>
      ))}
      {pts.map((p, i) =>
        p ? (
          p === last ? (
            <Circle key={i} cx={p.x} cy={p.y} r={5} fill={palette.plum} />
          ) : (
            <Circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={3}
              fill={palette.white}
              stroke={palette.plum}
              strokeWidth={1.5}
            />
          )
        ) : null,
      )}
    </>
  );
}

/**
 * Bar geometry: Month bars are 6 wide from x 8.3, Year bars 14 wide from x 12.1, spread so the last
 * bar ends the same distance from the right edge. That is the design's 10.5 pitch for 30 nights and
 * 26.25 for 12 months, and keeps 31-night months inside the frame.
 */
function barLayout(period: 'month' | 'year', count: number, width: number) {
  const barW = period === 'year' ? 14 : 6;
  const first = ((period === 'year' ? 12.1 : 8.3) * width) / DESIGN_W;
  const pitch = (width - 2 * first - barW) / Math.max(1, count - 1);
  return { barW, first, pitch };
}

/** Month (09 §3.6) and Year (§3.7): one bar per night or month, the same scale as the week line. */
function Bars({
  values,
  period,
  width,
}: {
  values: (number | null)[];
  period: 'month' | 'year';
  width: number;
}) {
  const { barW, first, pitch } = barLayout(period, values.length, width);
  return (
    <>
      <Defs>
        <LinearGradient id="sleepBar" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={palette.mustard} />
          <Stop offset="1" stopColor={palette.lavender} stopOpacity={0.5} />
        </LinearGradient>
      </Defs>
      {values.map((v, i) => {
        if (v === null) return null;
        const top = Math.min(134, chartY(v));
        return (
          <Rect
            key={i}
            x={first + pitch * i}
            y={top}
            width={barW}
            height={140 - top}
            rx={barW / 2}
            fill="url(#sleepBar)"
          />
        );
      })}
    </>
  );
}

/**
 * Sleep insights (06 §S8 Week, 09 §3.6 Month, §3.7 Year): the period control, this period's average
 * against the previous one, the chart against the 8 h goal, what helps and what gets in the way
 * (from the factors logged with each night), the Ask Glow AI chip and the note. The old rolling
 * periods, the made-up stage split and the AI suggestion list are gone.
 */
export default function SleepInsights() {
  const { t, i18n } = useTranslation();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { width: screenW } = useWindowDimensions();
  const width = screenW - 48;
  const { sleepEntries } = useSleep();
  const [period, setPeriod] = useState<Period>('week');
  const now = useMemo(() => new Date(), []);

  const series = useMemo(
    () => periodSeries(sleepEntries, period, now),
    [sleepEntries, period, now],
  );
  const average = periodAverage(sleepEntries, period, now);
  const previous = periodAverage(sleepEntries, period, now, -1);
  const impacts = useMemo(
    () => factorImpacts(nightsInPeriod(sleepEntries, period, now)),
    [sleepEntries, period, now],
  );

  const delta = () => {
    if (average === null || previous === null) return null;
    const minutes = Math.round((average - previous) * 60);
    if (minutes === 0) return t('sleepPeriods.same');
    const sign = minutes > 0 ? '+' : '−';
    const abs = Math.abs(minutes);
    if (period === 'week') return t('sleepPeriods.vsLastWeek', { sign, minutes: abs });
    if (period === 'month')
      return t('sleepPeriods.vsMonth', {
        sign,
        minutes: abs,
        month: startOfPeriod('month', now, -1).toLocaleDateString(i18n.language, { month: 'long' }),
      });
    return t('sleepPeriods.vsYear', { sign, minutes: abs, year: now.getFullYear() - 1 });
  };

  const labels = (): { x: number; text: string }[] => {
    const sx = width / DESIGN_W;
    if (period === 'week')
      return t('sleepPeriods.weekdays')
        .split(',')
        .map((d, i) => ({ x: (12 + 50 * i) * sx, text: d }));
    const { barW, first, pitch } = barLayout(period, series.length, width);
    const centre = (i: number) => first + pitch * i + barW / 2;
    if (period === 'year')
      return t('sleepPeriods.months')
        .split(',')
        .map((m, i) => ({ x: centre(i), text: m }));
    const last = series.length;
    return [1, 8, 15, 22, last].map((d) => ({ x: centre(d - 1), text: String(d) }));
  };

  const factorCard = (items: { key: string; minutes: number }[], dot: string) => (
    <View style={{ backgroundColor: palette.white, borderRadius: 24, paddingHorizontal: 18 }}>
      {items.map((f, i) => (
        <View
          key={f.key}
          style={{
            minHeight: 56,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            borderTopWidth: i ? 1 : 0,
            borderTopColor: palette.surfaceLilac,
          }}
        >
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dot }} />
          <Text style={[Type.bodyMMedium, { flex: 1, color: palette.ink }]}>
            {t(`sleepPeriods.factors.${f.key}`, { defaultValue: f.key })}
          </Text>
          <Text
            style={[Type.captionM, { color: palette.textMuted }]}
          >{`${f.minutes > 0 ? '+' : '−'}${Math.abs(f.minutes)} min`}</Text>
        </View>
      ))}
    </View>
  );

  const ask = () => {
    const summary =
      average === null
        ? t('sleepPeriods.noData')
        : `${t('sleepPeriods.average')} ${formatHours(average)}`;
    router.push({
      pathname: '/(tabs)/chat/new-conversation',
      params: {
        initialMessage: t('sleepPeriods.askPrompt', { summary }),
        persona: 'sleep',
        from: '/(tabs)/sleep/insights',
      },
    });
  };

  const d = delta();
  return (
    <SettingsScreen
      title={t('sleepPeriods.title')}
      backLabel={t('common.back')}
      onBack={() => backTo(from, '/(tabs)/sleep')}
      glows={[
        { color: palette.lavenderSoft, opacity: 0.25, x: -60, y: -40, width: 280, blur: 90 },
        {
          color: palette.mustard,
          opacity: period === 'week' ? 0.15 : 0.28,
          x: 200,
          y: 40,
          width: 220,
          blur: 90,
        },
      ]}
      contentStyle={{ gap: 24 }}
    >
      <SegmentedControl
        variant="compact"
        value={period}
        onChange={setPeriod}
        options={[
          { value: 'week', label: t('sleepPeriods.week') },
          { value: 'month', label: t('sleepPeriods.month') },
          { value: 'year', label: t('sleepPeriods.year') },
        ]}
      />

      <View
        style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}
      >
        <View>
          <Text style={[Type.microBold, { fontSize: 12, lineHeight: 16, color: palette.lavender }]}>
            {t('sleepPeriods.average')}
          </Text>
          <Text
            style={[
              Type.body,
              {
                fontSize: average === null ? 22 : 40,
                lineHeight: average === null ? 30 : 48,
                color: palette.ink,
              },
            ]}
          >
            {average === null ? t('sleepPeriods.noData') : formatHours(average)}
          </Text>
        </View>
        {d && (
          <Text
            style={[
              Type.captionM,
              {
                fontFamily: Type.bodyMMedium.fontFamily,
                color: palette.plum,
                marginBottom: 10,
                flexShrink: 1,
                textAlign: 'right',
              },
            ]}
          >
            {d}
          </Text>
        )}
      </View>

      <View
        accessible
        accessibilityLabel={t('sleepPeriods.chartLabel', {
          period: t(`sleepPeriods.${period}`),
          average: average === null ? t('sleepPeriods.noData') : formatHours(average),
        })}
      >
        <Svg width={width} height={CHART_H + 22}>
          <Line
            x1={0}
            x2={width}
            y1={GOAL_Y}
            y2={GOAL_Y}
            stroke={palette.lavender}
            strokeOpacity={0.3}
            strokeDasharray="4 4"
            strokeWidth={1}
          />
          <SvgText
            x={width}
            y={GOAL_Y - 8}
            fill={palette.lavender}
            fontSize={11}
            fontFamily={Type.body.fontFamily}
            textAnchor="end"
          >
            {t('sleepPeriods.goal')}
          </SvgText>
          {period === 'week' ? (
            <WeekLine values={series} width={width} />
          ) : (
            <Bars values={series} period={period} width={width} />
          )}
          {labels().map((l, i) => (
            <SvgText
              key={i}
              x={l.x}
              y={CHART_H + 18}
              fill={palette.textMuted}
              fontSize={11}
              fontFamily={Type.body.fontFamily}
              textAnchor="middle"
            >
              {l.text}
            </SvgText>
          ))}
        </Svg>
      </View>

      <SettingsSection label={t('sleepPeriods.helps')}>
        {impacts.helps.length ? (
          factorCard(impacts.helps, palette.mustard)
        ) : (
          <Text style={[Type.captionM, { color: palette.textMuted }]}>
            {t('sleepPeriods.needMore')}
          </Text>
        )}
      </SettingsSection>
      {impacts.hurts.length > 0 && (
        <SettingsSection label={t('sleepPeriods.hurts')}>
          {factorCard(impacts.hurts, palette.lavender)}
        </SettingsSection>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={ask}
        style={({ pressed }) => ({
          minHeight: 55,
          borderRadius: 999,
          borderWidth: 1.5,
          borderColor: palette.plum,
          backgroundColor: pressed ? palette.surfaceLilac : palette.selected,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingLeft: 16,
          paddingRight: 20,
        })}
      >
        <Svg width={24} height={24}>
          <Defs>
            <RadialGradient id="askOrb" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={palette.cream} />
              <Stop offset="1" stopColor={palette.plum} />
            </RadialGradient>
          </Defs>
          <Circle cx={12} cy={12} r={12} fill="url(#askOrb)" />
        </Svg>
        <Text style={[Type.buttonS, { fontSize: 15, color: palette.plum, flex: 1 }]}>
          {t('sleepPeriods.ask')}
        </Text>
      </Pressable>
      <LegalNote text={t('sleepPeriods.legal')} />
    </SettingsScreen>
  );
}
