import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon } from '@/components/icons/Icon';
import { SegmentedControl } from '@/components/ui/controls';
import { DayDetailsSheet } from '@/components/mood/DayDetailsSheet';
import { SettingsScreen } from '@/components/settings/SettingsParts';
import { useMood } from '@/hooks/useMood';
import { moodScoreOf, moodStep } from '@/lib/mood-scale';
import { inPeriod, moodBuckets, moodSummary, type MoodPeriod } from '@/lib/mood-stats';
import { backTo } from '@/lib/navigation';
import type { MoodCheckIn } from '@/lib/types';

const BAR_H = 110;
const RECENT = 10;

function Stat({
  value,
  label,
  face,
}: {
  value: string;
  label: string;
  face?: ReturnType<typeof moodStep>['face'];
}) {
  return (
    <View accessible accessibilityLabel={`${value} ${label}`} style={{ flex: 1, gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {face && <Icon name={face} size={20} color={palette.plum} />}
        <Text
          numberOfLines={1}
          style={[
            Type.titleMd,
            { fontSize: 22, lineHeight: 28, color: palette.ink, flexShrink: 1 },
          ]}
        >
          {value}
        </Text>
      </View>
      <Text style={[Type.micro, { fontSize: 12, lineHeight: 15, color: palette.textMuted }]}>
        {label}
      </Text>
    </View>
  );
}

/**
 * Mood stats. There is no frame for this screen, so it uses the library shell, cards and segmented
 * control: a chart of the mood on the five-step scale for today, the week or the last four weeks; the
 * average, the most common mood, what came up most, and the older energy and stress where present;
 * then the latest check-ins, which open the Day details sheet like mood history.
 */
export default function MoodStats() {
  const { t, i18n } = useTranslation();
  const { moodCheckIns } = useMood();
  const [period, setPeriod] = useState<MoodPeriod>('week');
  const [open, setOpen] = useState<MoodCheckIn | null>(null);

  const logs = useMemo(() => inPeriod(moodCheckIns, period), [moodCheckIns, period]);
  const buckets = useMemo(() => moodBuckets(moodCheckIns, period), [moodCheckIns, period]);
  const summary = useMemo(() => moodSummary(logs), [logs]);
  const fmt = (o: Intl.DateTimeFormatOptions, d: Date) =>
    new Intl.DateTimeFormat(i18n.language, o).format(d);
  const label = (start: Date, i: number) =>
    period === 'day'
      ? fmt({ hour: 'numeric' }, start)
      : period === 'week'
        ? i === 6
          ? t('moodStats.today')
          : fmt({ weekday: 'short' }, start)
        : fmt({ day: 'numeric', month: 'short' }, start);
  const avgStep = summary ? moodStep(summary.avgMood) : null;
  const topStep = summary ? moodStep(moodScoreOf(summary.topMood as MoodCheckIn['mood'])) : null;

  return (
    <SettingsScreen
      title={t('moodStats.title')}
      backLabel={t('common.back')}
      onBack={() => backTo(undefined, '/(tabs)/mood')}
      glows={[
        { color: palette.mustard, opacity: 0.3, x: -50, y: -20, width: 280, blur: 80 },
        { color: palette.sky, opacity: 0.2, x: 180, y: 60, width: 220, blur: 80 },
      ]}
      contentStyle={{ gap: 16 }}
    >
      <SegmentedControl
        options={[
          { value: 'day', label: t('moodStats.oneDay') },
          { value: 'week', label: t('moodStats.oneWeek') },
          { value: 'month', label: t('moodStats.oneMonth') },
        ]}
        value={period}
        onChange={setPeriod}
      />

      <View style={{ backgroundColor: palette.white, borderRadius: 28, padding: 20, gap: 16 }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}
        >
          <Text
            accessibilityRole="header"
            style={[Type.bodyStrong, { letterSpacing: 0, color: palette.ink }]}
          >
            {t('moodStats.chart')}
          </Text>
          <Text style={[Type.captionM, { color: palette.textMuted }]}>
            {t('moodStats.checkInCount', { count: logs.length })}
          </Text>
        </View>
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}
        >
          {buckets.map((b, i) => {
            const step = b.avg ? moodStep(b.avg) : null;
            return (
              <View
                key={b.start.toISOString()}
                accessible
                accessibilityLabel={`${label(b.start, i)}, ${step ? t(`moodScale.${step.key}`) : t('moodStats.noCheckIns')}`}
                style={{ alignItems: 'center', gap: 6, flex: 1 }}
              >
                <View
                  style={{
                    width: 22,
                    height: BAR_H,
                    borderRadius: 11,
                    backgroundColor: palette.surfaceLilacSoft,
                    justifyContent: 'flex-end',
                    overflow: 'hidden',
                  }}
                >
                  {step && b.avg && (
                    <View
                      style={{
                        height: Math.max(10, (b.avg / 5) * BAR_H),
                        borderRadius: 11,
                        backgroundColor: step.color,
                      }}
                    />
                  )}
                </View>
                <Text numberOfLines={1} style={[Type.micro, { color: palette.textSubtle }]}>
                  {label(b.start, i)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {summary && avgStep && topStep ? (
        <View style={{ backgroundColor: palette.white, borderRadius: 28, padding: 20, gap: 18 }}>
          <View style={{ flexDirection: 'row' }}>
            <Stat
              value={t(`moodScale.${avgStep.key}`)}
              label={t('moodStats.avgMood')}
              face={avgStep.face}
            />
            <Stat
              value={t(`moodScale.${topStep.key}`)}
              label={t('moodStats.mostCommon', { count: summary.topMoodCount })}
              face={topStep.face}
            />
          </View>
          {(summary.avgEnergy != null || summary.avgStress != null) && (
            <View style={{ flexDirection: 'row' }}>
              {summary.avgEnergy != null && (
                <Stat
                  value={`${summary.avgEnergy.toFixed(1)}/5`}
                  label={t('moodStats.avgEnergy')}
                />
              )}
              {summary.avgStress != null && (
                <Stat
                  value={`${summary.avgStress.toFixed(1)}/10`}
                  label={t('moodStats.avgStress')}
                />
              )}
            </View>
          )}
          {summary.topFactors.length > 0 && (
            <View style={{ gap: 8 }}>
              <Text
                style={[Type.micro, { fontSize: 12, lineHeight: 15, color: palette.textMuted }]}
              >
                {t('moodStats.cameUp')}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {summary.topFactors.map((f) => (
                  <View
                    key={f}
                    style={{
                      backgroundColor: palette.selected,
                      borderRadius: 999,
                      paddingVertical: 4,
                      paddingHorizontal: 10,
                    }}
                  >
                    <Text style={[Type.tag, { lineHeight: 17, color: palette.plum }]}>
                      {t(`moodCheckIn2.factor.${f}`)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      ) : (
        <View style={{ backgroundColor: palette.white, borderRadius: 28, padding: 20 }}>
          <Text
            style={[
              Type.captionM,
              { lineHeight: 19, color: palette.textMuted, textAlign: 'center' },
            ]}
          >
            {t('moodStats.empty')}
          </Text>
        </View>
      )}

      {logs.length > 0 && (
        <View style={{ gap: 10 }}>
          <Text
            accessibilityRole="header"
            style={[Type.bodyStrong, { letterSpacing: 0, color: palette.ink, marginTop: 8 }]}
          >
            {t('moodStats.recent')}
          </Text>
          {logs.slice(0, RECENT).map((log) => {
            const step = moodStep(moodScoreOf(log.mood));
            const when = new Date(log.createdAt);
            return (
              <Pressable
                key={log.id}
                accessibilityRole="button"
                onPress={() => setOpen(log)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  minHeight: 72,
                  borderRadius: 24,
                  backgroundColor: palette.white,
                  paddingHorizontal: 14,
                  opacity: pressed ? 0.9 : 1,
                })}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: `${step.color}55`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name={step.face} size={22} color={palette.plum} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[Type.bodyMSemi, { lineHeight: 21, color: palette.ink }]}>
                    {t(`moodScale.${step.key}`)}
                  </Text>
                  <Text numberOfLines={1} style={[Type.captionS, { color: palette.textMuted }]}>
                    {[
                      fmt({ weekday: 'short', day: 'numeric', month: 'short' }, when),
                      fmt({ hour: '2-digit', minute: '2-digit' }, when),
                      log.note?.trim(),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </View>
                <Icon name="arrow/chevron-right" size={18} color={palette.plum} />
              </Pressable>
            );
          })}
        </View>
      )}
      <DayDetailsSheet log={open} onClose={() => setOpen(null)} />
    </SettingsScreen>
  );
}
