import React, { useMemo } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon } from '@/components/icons/Icon';
import { Moon, StarField } from '@/components/sleep/NightSky';
import { Eyebrow, MomentShell, StatTile, closeMoment } from '@/components/moments/MomentShell';
import { useSleep } from '@/hooks/useSleep';
import { formatClock, formatDuration, isBestThisMonth, lastNight } from '@/lib/sleep-home';
import { hypnogram, stageMinutes } from '@/lib/sleep-flow';
import { NIGHT_SAMPLES, smoothPath } from '@/lib/moments';

const CHART_H = 150;

/**
 * Night sleep (03 §3.8): last night on the dark sky with the moon, how long it was, the best-night
 * badge, the stage chart (Health stages, or the decorative curve without them) and Deep, REM and
 * woke-up tiles. Without stages the tiles show bedtime, wake time and wake-ups.
 */
export default function NightMoment() {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const { sleepEntries } = useSleep();
  const night = useMemo(() => lastNight(sleepEntries), [sleepEntries]);

  if (!night) {
    return (
      <MomentShell dark cta={{ label: t('moments.night.cta'), onPress: () => router.replace('/(tabs)/sleep') }} link={{ label: t('moments.notNow'), onPress: closeMoment }}>
        <Text style={[Type.display, { color: palette.white, marginTop: 200 }]}>{t('moments.night.emptyTitle')}</Text>
      </MomentShell>
    );
  }

  const stages = night.entry.stages?.length ? night.entry.stages : null;
  const chartW = width;
  const chart = stages ? hypnogram(stages, chartW, CHART_H) : null;
  const curve = chart ? { line: chart.line, area: chart.area } : smoothPath(NIGHT_SAMPLES, chartW);
  const mins = stages ? stageMinutes(stages) : null;
  const best = isBestThisMonth(night, sleepEntries);

  return (
    <MomentShell
      dark
      background={
        <View pointerEvents="none" style={{ position: 'absolute', inset: 0 }}>
          <StarField width={width} height={height * 0.6} style={{ position: 'absolute' }} />
          <Moon size={72} style={{ position: 'absolute', right: 48, top: 110 }} />
        </View>
      }
      glows={[{ color: palette.lavenderSoft, opacity: 0.35, x: 150, y: 40, width: 260, blur: 80 }]}
      cta={{ label: t('moments.night.cta'), onPress: () => router.replace({ pathname: '/(tabs)/sleep/[id]', params: { id: night.entry.id } }) }}
      link={{ label: t('moments.notNow'), onPress: closeMoment }}
    >
      <Eyebrow dark text={t('moments.night.eyebrow', { from: formatClock(night.startMs), to: formatClock(night.endMs) })} style={{ marginTop: 100 }} />
      <Text accessibilityRole="header" style={[Type.display, { fontSize: 56, lineHeight: 66, color: palette.white, marginTop: 2 }]}>
        {formatDuration(night.asleepMinutes)}
      </Text>
      {best && (
        <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: palette.mustard, borderRadius: 999, paddingVertical: 5, paddingLeft: 10, paddingRight: 12, marginTop: 8 }}>
          <Icon name="line/star" size={14} color={palette.ink} />
          <Text style={[Type.labelM, { color: palette.ink }]}>{t('moments.night.best')}</Text>
        </View>
      )}

      <View style={{ marginHorizontal: -24, marginTop: 40 }} accessibilityLabel={t('sleepFlow.night.chartLabel')}>
        <Svg width={chartW} height={CHART_H}>
          <Defs>
            <LinearGradient id="nightArea" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={palette.lavenderSoft} stopOpacity={0.9} />
              <Stop offset="1" stopColor={palette.sky} stopOpacity={0.15} />
            </LinearGradient>
          </Defs>
          <Path d={curve.area} fill="url(#nightArea)" />
          {chart && <Path d={chart.line} stroke={palette.mustard} strokeOpacity={0.8} strokeWidth={1.5} fill="none" />}
        </Svg>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
        <Text style={[Type.micro, { color: 'rgba(255,255,255,0.50)' }]}>{formatClock(night.startMs)}</Text>
        <Text style={[Type.micro, { color: 'rgba(255,255,255,0.50)' }]}>{formatClock(night.endMs)}</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 20 }}>
        {mins ? (
          <>
            <StatTile dark value={formatDuration(mins.deep)} caption={t('sleepFlow.night.stage.deep')} />
            <StatTile dark value={formatDuration(mins.rem)} caption={t('sleepFlow.night.stage.rem')} />
          </>
        ) : (
          <>
            <StatTile dark value={formatClock(night.startMs)} caption={t('moments.night.bedtime')} />
            <StatTile dark value={formatClock(night.endMs)} caption={t('moments.night.woke')} />
          </>
        )}
        <StatTile dark value={night.awakenings != null ? `${night.awakenings}×` : '–'} caption={t('moments.night.wokeUp')} />
      </View>
    </MomentShell>
  );
}
