import React, { useMemo } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenStatusBar } from '@/components/ui/ScreenStatusBar';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Glow, GlowField } from '@/components/glow/Glow';
import { AppButton } from '@/components/ui/AppButton';
import { IconButton, NavBar } from '@/components/ui/IconButton';
import { StarField } from '@/components/sleep/NightSky';
import { useSleep } from '@/hooks/useSleep';
import { backTo } from '@/lib/navigation';
import { showAlert } from '@/lib/state';
import { formatClock, formatDuration, isRecent, summariseNight } from '@/lib/sleep-home';
import { factorImpacts, nightsInPeriod } from '@/lib/sleep-periods';
import { goalPercent, hypnogram, minuteOfDay, nightAxis, stageMinutes, windowMinutes } from '@/lib/sleep-flow';
import { KEYBOARD_DISMISS_MODE } from '@/lib/keyboard';

const CHART_H = 112;
const STAGE_ROWS = [
  { key: 'deep', color: palette.plum },
  { key: 'rem', color: palette.lavender },
  { key: 'light', color: palette.lavenderSoft },
] as const;

/**
 * Last night (06 §S7): the night block with the time in bed, the share of the sleep goal (the
 * schedule's window) and the stage chart, then the stage list, the note, a Glow AI note drawn from
 * what has helped this month, See sleep insights, and How did you sleep? until the night has a
 * quality. Nights without stages show the time in bed as one bar. Delete sits in the header.
 */
export default function LastNightScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const { sleepEntries, deleteSleepEntry, schedule } = useSleep();
  const entry = sleepEntries.find((e) => e.id === id);
  const night = useMemo(() => (entry ? summariseNight(entry) : null), [entry]);
  const chartW = width - 48;
  const blockH = insets.top - 44 + 372;

  const aiNote = useMemo(() => {
    const { helps } = factorImpacts(nightsInPeriod(sleepEntries, 'month'));
    if (helps[0]) return t('sleepFlow.night.noteHelps', { factor: t(`sleepPeriods.factors.${helps[0].key}`), minutes: helps[0].minutes });
    return t('sleepFlow.night.noteGeneric');
  }, [sleepEntries, t]);

  const remove = () =>
    showAlert(t('sleepFlow.night.deleteTitle'), t('sleepFlow.night.deleteBody'), [
      { text: t('sleepFlow.cancel'), style: 'cancel' },
      {
        text: t('sleepFlow.night.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteSleepEntry(id);
          backTo(from, '/(tabs)/sleep');
        },
      },
    ]);

  if (!entry || !night) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top + 10, paddingHorizontal: 24 }}>
        <NavBar title={t('sleepFlow.night.lastNight')} backLabel={t('common.back')} onBack={() => backTo(from, '/(tabs)/sleep')} />
        <Text style={[Type.bodyS, { color: palette.textMuted, marginTop: 32, textAlign: 'center' }]}>{t('sleepFlow.night.missing')}</Text>
      </View>
    );
  }

  const date = new Date(night.endMs);
  const title = isRecent(night)
    ? t('sleepFlow.night.lastNight')
    : date.toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'short' });
  const dateLine = `${new Date(night.startMs).toLocaleDateString(i18n.language, { weekday: 'short', day: 'numeric', month: 'short' })} · ${formatClock(night.startMs)} – ${formatClock(night.endMs)}`;
  const goal = windowMinutes(minuteOfDay(schedule.sleepHour, schedule.sleepMin), minuteOfDay(schedule.wakeHour, schedule.wakeMin));
  const pct = goalPercent(night.asleepMinutes, goal);
  const quality = entry.quality ? t(`sleepNight.quality.${entry.quality}`) : null;
  const stages = entry.stages?.length ? entry.stages : null;
  const chart = stages ? hypnogram(stages, chartW, CHART_H) : null;
  const axis = nightAxis(chart?.startMs ?? night.startMs, chart?.endMs ?? night.endMs, chartW);
  const minutes = stages ? stageMinutes(stages) : null;

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScreenStatusBar style="light" />
      <ScrollView keyboardDismissMode={KEYBOARD_DISMISS_MODE} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} bounces={false}>
        <View style={{ height: blockH, backgroundColor: palette.ink, overflow: 'hidden' }}>
          <StarField width={width} height={blockH} style={{ position: 'absolute', top: 0 }} />
          <GlowField glows={[{ color: palette.lavenderSoft, opacity: 0.18, x: 88, y: 20, width: 200, blur: 70 }]} />
          <NavBar
            title={title}
            backLabel={t('common.back')}
            onBack={() => backTo(from, '/(tabs)/sleep')}
            tone="dark"
            trailing={<IconButton size={44} variant="onDark" icon="line/trash" iconSize={20} accessibilityLabel={t('sleepFlow.night.delete')} onPress={remove} />}
            style={{ marginTop: insets.top + 10, marginHorizontal: 24 }}
          />
          <View style={{ alignItems: 'center', marginTop: 14 }}>
            <Text style={[Type.captionM, { color: 'rgba(255,255,255,0.60)' }]}>{dateLine}</Text>
            <Text style={[Type.display, { fontSize: 56, lineHeight: 68, fontWeight: '400', color: palette.white }]}>
              {formatDuration(night.asleepMinutes)}
            </Text>
            <Text style={[Type.bodyS, { color: palette.mustard }]}>
              {[quality, t('sleepFlow.night.goal', { pct })].filter(Boolean).join(' · ')}
            </Text>
          </View>
          <View style={{ position: 'absolute', left: 24, bottom: 24 }}>
            <Svg width={chartW} height={CHART_H + 20} accessibilityLabel={t('sleepFlow.night.chartLabel')}>
              <Defs>
                <LinearGradient id="stageArea" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={palette.lavenderSoft} stopOpacity={0.55} />
                  <Stop offset="1" stopColor={palette.sky} stopOpacity={0.05} />
                </LinearGradient>
              </Defs>
              {chart ? (
                <>
                  <Path d={chart.area} fill="url(#stageArea)" />
                  <Path d={chart.line} stroke={palette.mustard} strokeOpacity={0.8} strokeWidth={1.5} fill="none" />
                </>
              ) : (
                // No stages from Health: the time in bed as one bar (06 §6 item 6).
                <>
                  <Rect x={0} y={CHART_H / 2 - 10} width={chartW} height={20} rx={10} fill="url(#stageArea)" />
                  <Circle cx={10} cy={CHART_H / 2} r={4} fill={palette.mustard} />
                  <Circle cx={chartW - 10} cy={CHART_H / 2} r={4} fill={palette.mustard} />
                </>
              )}
              {axis.map((a, i) => (
                <SvgText
                  key={i}
                  x={Math.min(chartW - 2, Math.max(2, a.x))}
                  y={CHART_H + 16}
                  fill={palette.white}
                  fillOpacity={0.5}
                  fontSize={11}
                  fontFamily={Type.body.fontFamily}
                  textAnchor={i === 0 ? 'start' : i === axis.length - 1 ? 'end' : 'middle'}
                >
                  {formatClock(a.ms)}
                </SvgText>
              ))}
            </Svg>
          </View>
        </View>

        <View style={{ paddingHorizontal: 24, paddingTop: 24, gap: 16 }}>
          {minutes && (
            <>
              <Text style={[Type.labelM, { color: palette.lavender }]}>{t('sleepFlow.night.stages')}</Text>
              {STAGE_ROWS.map((s) => (
                <View key={s.key} accessible accessibilityLabel={`${t(`sleepFlow.night.stage.${s.key}`)}, ${formatDuration(minutes[s.key])}`} style={{ gap: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: s.color }} />
                    <Text style={[Type.bodyMMedium, { flex: 1, color: palette.ink }]}>{t(`sleepFlow.night.stage.${s.key}`)}</Text>
                    <Text style={[Type.bodyMSemi, { color: palette.plumDeep }]}>{formatDuration(minutes[s.key])}</Text>
                  </View>
                  <View style={{ marginLeft: 20, height: 4, borderRadius: 2, backgroundColor: palette.borderLilac, overflow: 'hidden' }}>
                    <View style={{ height: 4, width: `${minutes.asleep ? (minutes[s.key] / minutes.asleep) * 100 : 0}%`, backgroundColor: s.color }} />
                  </View>
                </View>
              ))}
            </>
          )}

          {entry.notes ? (
            <View style={{ gap: 6 }}>
              <Text style={[Type.labelM, { color: palette.lavender }]}>{t('sleepFlow.night.note')}</Text>
              <Text style={[Type.bodyS, { color: palette.plumDeep }]}>{entry.notes}</Text>
            </View>
          ) : null}

          <View style={{ backgroundColor: palette.white, borderRadius: 24, padding: 16, overflow: 'hidden', gap: 10 }}>
            <Glow color={palette.lavenderSoft} opacity={0.3} width={120} blur={40} style={{ position: 'absolute', left: -30, top: -30 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Svg width={28} height={28}>
                <Defs>
                  <LinearGradient id="noteOrb" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor={palette.cream} />
                    <Stop offset="1" stopColor={palette.plum} />
                  </LinearGradient>
                </Defs>
                <Circle cx={14} cy={14} r={14} fill="url(#noteOrb)" />
              </Svg>
              <Text style={[Type.labelM, { color: palette.plum }]}>{t('sleepFlow.night.glowAi')}</Text>
            </View>
            <Text style={[Type.bodyS, { lineHeight: 20, color: palette.plumDeep }]}>{aiNote}</Text>
          </View>

          <AppButton title={t('sleepFlow.night.insights')} onPress={() => router.push('/(tabs)/sleep/insights')} style={{ marginTop: 6 }} />
          {!entry.quality && (
            <AppButton
              variant="outline"
              title={t('sleepFlow.night.howDidYouSleep')}
              onPress={() => router.push({ pathname: '/(tabs)/sleep/log', params: { id: entry.id, from: `/(tabs)/sleep/${entry.id}` } })}
              style={{ backgroundColor: 'transparent', borderColor: 'rgba(107,82,121,0.50)' }}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
