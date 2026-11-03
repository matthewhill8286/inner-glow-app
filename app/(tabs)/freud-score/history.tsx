import React, { useMemo, useState } from 'react';
import { Share, Text, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { AppButton } from '@/components/ui/AppButton';
import { Icon } from '@/components/icons/Icon';
import {
  DateTile,
  DeltaPill,
  MiniRing,
  PeriodPills,
  PillChip,
  ScoreCard,
  ScoreNav,
  ScoreScreen,
  usePeriodText,
} from '@/components/score/ScoreParts';
import { useScoreDays, type ScoreDay } from '@/hooks/useScoreDays';
import {
  daysInPeriod,
  historyGroup,
  periodSummary,
  rangeDomainMin,
  rangeX,
  scoreColor,
  type ScorePeriod,
} from '@/lib/glow-score';
import { moodScoreOf, moodStep } from '@/lib/mood-scale';
import { backTo } from '@/lib/navigation';
import { scoreRangeLabels } from '@/lib/score-range-labels';
import { toast } from '@/components/Toast';

/**
 * Score history (03 §2.3): period pills, the period summary with the range bar, Add note, Export and
 * Reminder, the days grouped by week, and Check in now. The filter button is left out: Figma does
 * not say what it filters.
 */
export default function ScoreHistoryScreen() {
  const { t, i18n } = useTranslation();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { width } = useWindowDimensions();
  const { days } = useScoreDays();
  const [period, setPeriod] = useState<ScorePeriod>('1M');
  const now = useMemo(() => new Date(), []);
  const summary = useMemo(() => periodSummary(days, period, now), [days, period, now]);
  const inPeriod = useMemo(() => daysInPeriod(days, period, now), [days, period, now]);
  const text = usePeriodText(period, now);

  const groups = useMemo(() => {
    const out: { label: string; items: ScoreDay[] }[] = [];
    for (const d of inPeriod as ScoreDay[]) {
      const g = historyGroup(d.date, now);
      const label =
        g === 'earlier'
          ? d.date.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })
          : t(`glowScore.groups.${g}`);
      if (out.at(-1)?.label !== label) out.push({ label, items: [] });
      out.at(-1)!.items.push(d);
    }
    return out;
  }, [inPeriod, now, i18n.language, t]);

  const exportPeriod = async () => {
    if (!inPeriod.length) {
      toast.info(t('glowScore.nothingToExport'));
      return;
    }
    const rows = (inPeriod as ScoreDay[])
      .slice()
      .reverse()
      .map((d) =>
        [
          d.date.toISOString().slice(0, 10),
          d.score,
          d.checkIn?.mood ?? '',
          JSON.stringify(d.checkIn?.note ?? ''),
        ].join(','),
      );
    await Share.share({
      title: t('glowScore.history'),
      message: ['date,score,mood,note', ...rows].join('\n'),
    }).catch(() => {});
  };

  const statLabels = [
    { label: t('glowScore.average'), value: summary.average },
    { label: t('glowScore.best'), value: summary.best },
    { label: t('glowScore.lowest'), value: summary.lowest },
  ];

  return (
    <ScoreScreen
      glows={[
        { color: palette.sky, opacity: 0.2, x: 180, y: 30, width: 240, blur: 90 },
        { color: palette.mustard, opacity: 0.25, x: -50, y: 0, width: 260, blur: 90 },
      ]}
      nav={
        <ScoreNav
          label={t('glowScore.title')}
          backLabel={t('common.back')}
          onBack={() => backTo(from, '/(tabs)/freud-score')}
        />
      }
    >
      <Text
        accessibilityRole="header"
        style={[Type.titleXl, { color: palette.plumDeep, marginTop: 21, letterSpacing: 0 }]}
      >
        {t('glowScore.history')}
      </Text>
      <Text
        style={[
          Type.bodyS,
          { lineHeight: 20, color: palette.textMuted, marginTop: 6, maxWidth: 300 },
        ]}
      >
        {t('glowScore.historySubtitle')}
      </Text>

      <PeriodPills
        value={period}
        onChange={setPeriod}
        labels={text.labels}
        style={{ marginTop: 16 }}
      />

      <ScoreCard style={{ marginTop: 17, paddingTop: 16, paddingBottom: 14 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <Text style={[Type.chip, { color: palette.textSubtle }]}>{text.title}</Text>
          {summary.delta !== null && <DeltaPill delta={summary.delta} label={text.versus} />}
        </View>
        <View style={{ flexDirection: 'row', marginTop: 10 }}>
          {statLabels.map((s, i) => (
            <View key={s.label} style={{ flex: 1, flexDirection: 'row' }}>
              {i > 0 && (
                <View
                  style={{
                    width: 1,
                    height: 40,
                    marginTop: 6,
                    backgroundColor: palette.border,
                    marginRight: 13,
                  }}
                />
              )}
              <View>
                <Text style={[Type.titleXl, { color: palette.plumDeep, letterSpacing: 0 }]}>
                  {s.value ?? '–'}
                </Text>
                <Text
                  style={[
                    Type.caption,
                    { fontWeight: '500', color: palette.textMuted, marginTop: 2 },
                  ]}
                >
                  {s.label}
                </Text>
              </View>
            </View>
          ))}
        </View>
        {summary.average !== null && (
          <RangeBar
            width={width - 48 - 40}
            lowest={summary.lowest!}
            best={summary.best!}
            average={summary.average}
          />
        )}
      </ScoreCard>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
        <PillChip
          icon="line/note"
          label={t('glowScore.addNote')}
          height={38}
          textSize={13}
          iconSize={18}
          onPress={() => router.push({ pathname: '/(tabs)/mood/check-in', params: { from } })}
        />
        <PillChip
          icon="line/share"
          label={t('glowScore.export')}
          height={38}
          textSize={13}
          iconSize={18}
          onPress={exportPeriod}
        />
        <PillChip
          icon="line/bell"
          label={t('glowScore.reminder')}
          height={38}
          textSize={13}
          iconSize={18}
          onPress={() => router.push('/(tabs)/profile/notifications')}
        />
      </View>

      {groups.length === 0 ? (
        <Text style={[Type.bodyS, { color: palette.textMuted, marginTop: 24 }]}>
          {t('glowScore.emptyPeriod')}
        </Text>
      ) : (
        groups.map((g) => (
          <View key={g.label} style={{ marginTop: 22, gap: 10 }}>
            <Text
              accessibilityRole="header"
              style={[Type.chip, { fontWeight: '700', color: palette.textSubtle }]}
            >
              {g.label.toUpperCase()}
            </Text>
            {g.items.map((d) => (
              <EntryCard key={d.key} day={d} locale={i18n.language} />
            ))}
          </View>
        ))
      )}

      <AppButton
        title={t('glowScore.checkInNow')}
        icon="line/plus"
        iconPosition="left"
        onPress={() => router.push({ pathname: '/(tabs)/mood/check-in', params: { from } })}
        style={{ marginTop: 24 }}
      />
    </ScoreScreen>
  );
}

/** Range bar (03 §4.2): gradient bar with lowest and best ticks and the average marker and knob. */
function RangeBar({
  width,
  lowest,
  best,
  average,
}: {
  width: number;
  lowest: number;
  best: number;
  average: number;
}) {
  const min = rangeDomainMin(lowest);
  const x = (v: number) => rangeX(v, width, min);
  const marks = [
    { v: lowest, avg: false },
    { v: best, avg: false },
    { v: average, avg: true },
  ];
  const labels = scoreRangeLabels(
    marks.map((mark) => x(mark.v)),
    width,
  );
  const height = Math.max(...labels.map((label) => label.y)) + 4;
  return (
    <Svg width={width} height={height} style={{ marginTop: 12 }} accessibilityElementsHidden>
      <Defs>
        <LinearGradient id="scoreRange" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={palette.rose} stopOpacity={0.95} />
          <Stop offset="0.35" stopColor={palette.lavenderSoft} stopOpacity={0.95} />
          <Stop offset="0.6" stopColor={palette.mustard} stopOpacity={0.95} />
          <Stop offset="1" stopColor={palette.sky} stopOpacity={0.95} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={8} width={width} height={14} rx={7} fill="url(#scoreRange)" />
      {marks.map((m, i) =>
        m.avg ? (
          <React.Fragment key={i}>
            <Rect
              x={x(m.v) - 1}
              y={0}
              width={2}
              height={30}
              fill={palette.plum}
              fillOpacity={0.9}
            />
            <Circle
              cx={x(m.v)}
              cy={15}
              r={5}
              fill={palette.white}
              stroke={palette.plum}
              strokeWidth={2}
            />
          </React.Fragment>
        ) : (
          <Rect
            key={i}
            x={Math.min(width - 1, Math.max(0, x(m.v) - 0.5))}
            y={5}
            width={1}
            height={20}
            fill={palette.plum}
            fillOpacity={0.5}
          />
        ),
      )}
      {marks.map((m, i) => (
        <SvgText
          key={`l${i}`}
          x={labels[i].x}
          y={labels[i].y}
          fill={m.avg ? palette.plumDeep : palette.textSubtle}
          fontSize={11}
          fontWeight={m.avg ? '700' : '500'}
          fontFamily={Type.body.fontFamily}
          textAnchor="middle"
        >
          {m.v}
        </SvgText>
      ))}
    </Svg>
  );
}

function EntryCard({ day, locale }: { day: ScoreDay; locale: string }) {
  const { t } = useTranslation();
  const step = day.checkIn ? moodStep(moodScoreOf(day.checkIn.mood)) : null;
  const tags: string[] = [];
  if (day.breathingMinutes)
    tags.push(t('glowScore.tags.breathing', { minutes: day.breathingMinutes }));
  else if (day.practiceMinutes)
    tags.push(t('glowScore.tags.practice', { minutes: day.practiceMinutes }));
  if (day.sleepHours !== null && day.sleepHours >= 0.5)
    tags.push(t('glowScore.tags.sleep', { hours: Math.round(day.sleepHours) }));
  for (const f of day.checkIn?.factors ?? [])
    if (f !== 'sleep') tags.push(t(`moodCheckIn2.factor.${f}`));
  const note = day.checkIn?.note?.trim();
  return (
    <View
      accessible
      accessibilityLabel={[
        day.date.toLocaleDateString(locale, { day: 'numeric', month: 'long' }),
        step ? t(`moodScale.${step.key}`) : t('glowScore.noCheckIn'),
        note,
        t('glowScore.ringLabel', { score: day.score }),
      ]
        .filter(Boolean)
        .join(', ')}
      style={{
        minHeight: 86,
        borderRadius: 24,
        backgroundColor: palette.white,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingLeft: 14,
        paddingRight: 14,
        gap: 12,
      }}
    >
      <DateTile date={day.date} locale={locale} tall />
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {step && <Icon name={step.face} size={18} />}
          <Text
            numberOfLines={1}
            style={[Type.bodyMSemi, { color: palette.plumDeep, flexShrink: 1 }]}
          >
            {step ? t(`moodScale.${step.key}`) : t('glowScore.noCheckIn')}
          </Text>
        </View>
        {note ? (
          <Text numberOfLines={1} style={[Type.captionS, { color: palette.textMuted }]}>
            {note}
          </Text>
        ) : null}
        {tags.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
            {tags.slice(0, 3).map((tag) => (
              <View
                key={tag}
                style={{
                  backgroundColor: palette.border,
                  borderRadius: 999,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}
              >
                <Text
                  style={[
                    Type.micro,
                    { fontSize: 10, lineHeight: 13, fontWeight: '600', color: palette.plumDeep },
                  ]}
                >
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <MiniRing value={day.score} color={scoreColor(day.score)} size={46} />
    </View>
  );
}
