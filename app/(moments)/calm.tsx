import React, { useMemo } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Svg, { Circle, Defs, LinearGradient, Polyline, Stop } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Eyebrow, MomentShell, StatTile, closeMoment } from '@/components/moments/MomentShell';
import { useMood } from '@/hooks/useMood';
import { useMindfulness } from '@/hooks/useMindfulness';
import { moodScoreOf, moodStep } from '@/lib/mood-scale';
import { clockFrom } from '@/lib/sleep-home';
import { signed } from '@/lib/glow-score';
import { calmWave } from '@/lib/moments';

/**
 * Calm wave (03 §3.6). The app does not record stress through the day, so the wave follows today's
 * mood check-ins: unsettled up to the latest check-in in proportion to how tense the first one was,
 * then calm. The tiles show the mood change, today's practices and how long it took.
 */
export default function CalmMoment() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const { moodCheckIns } = useMood();
  const { mindfulnessHistory } = useMindfulness();
  const now = useMemo(() => new Date(), []);

  const day = useMemo(() => {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const today = moodCheckIns
      .filter((c) => Date.parse(c.createdAt) >= start)
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
    if (!today.length) return null;
    const first = today[0];
    const last = today[today.length - 1];
    const firstAt = Date.parse(first.createdAt);
    const lastAt = Date.parse(last.createdAt);
    const practices = mindfulnessHistory.filter((m) => Date.parse(m.dateISO) >= start);
    const between = practices.filter((m) => Date.parse(m.dateISO) >= firstAt && Date.parse(m.dateISO) <= lastAt);
    return { first, last, firstAt, lastAt, practices, helped: between[between.length - 1] ?? null, count: today.length };
  }, [moodCheckIns, mindfulnessHistory, now]);

  if (!day) {
    return (
      <MomentShell cta={{ label: t('moments.calm.checkIn'), onPress: () => router.replace('/(tabs)/mood/check-in') }} link={{ label: t('moments.notNow'), onPress: closeMoment }}>
        <Text style={[Type.display, { color: palette.plumDeep, marginTop: 160 }]}>{t('moments.calm.emptyTitle')}</Text>
        <Text style={[Type.body, { fontWeight: '400', lineHeight: 22, color: palette.textMuted, marginTop: 10 }]}>{t('moments.calm.emptyBody')}</Text>
      </MomentShell>
    );
  }

  const fromStep = moodStep(moodScoreOf(day.first.mood));
  const toStep = moodStep(moodScoreOf(day.last.mood));
  const change = toStep.score - fromStep.score;
  const settled = change > 0 || toStep.score >= 4;
  const wave = calmWave(day.first.createdAt.slice(0, 10), fromStep.score, width);
  const clock = (ms: number) => clockFrom(new Date(ms).getHours(), new Date(ms).getMinutes());
  const hours = Math.max(0, (day.lastAt - day.firstAt) / 3_600_000);
  const fromWord = t(`moodScale.${fromStep.key}`);
  const toWord = t(`moodScale.${toStep.key}`);
  const helpedTitle = day.helped?.practiceId ? t(`practices.items.${day.helped.practiceId}.title`, { defaultValue: '' }) : '';

  const body = day.count === 1
    ? t('moments.calm.bodyOne')
    : !settled
      ? t('moments.calm.bodyStill')
      : helpedTitle
        ? t('moments.calm.bodyHelped', { practice: helpedTitle, time: clock(Date.parse(day.helped!.dateISO)) })
        : t('moments.calm.bodySettling');

  return (
    <MomentShell
      glows={[
        { color: palette.rose, opacity: 0.35, x: -60, y: 180, width: 260, blur: 90 },
        { color: palette.sky, opacity: 0.35, x: 190, y: 200, width: 240, blur: 90 },
      ]}
      cta={{ label: t('moments.calm.cta'), onPress: () => router.replace('/(tabs)/mood') }}
      link={{ label: t('moments.notNow'), onPress: closeMoment }}
    >
      <Eyebrow text={day.count > 1 ? t('moments.calm.eyebrow', { from: clock(day.firstAt), to: clock(day.lastAt) }) : t('moments.calm.eyebrowOne', { time: clock(day.firstAt) })} />
      <Text accessibilityRole="header" style={[Type.display, { lineHeight: 42, color: palette.plumDeep, marginTop: 6 }]}>
        {day.count > 1 ? t('moments.calm.title', { from: fromWord.toLowerCase(), to: toWord.toLowerCase() }) : t('moments.calm.titleOne', { mood: fromWord.toLowerCase() })}
      </Text>

      <View style={{ marginHorizontal: -24, marginTop: 12, height: 160 }} accessibilityElementsHidden>
        <Svg width={width} height={160}>
          <Defs>
            <LinearGradient id="calmStroke" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#E8828F" />
              <Stop offset="0.55" stopColor="#C9A0C9" />
              <Stop offset="1" stopColor="#5FAFE0" />
            </LinearGradient>
          </Defs>
          <Polyline points={wave.points.map((p) => `${p.x},${p.y}`).join(' ')} stroke="url(#calmStroke)" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <Circle cx={wave.peak.x} cy={wave.peak.y} r={13} fill={palette.rose} fillOpacity={0.7} />
          <Circle cx={wave.peak.x} cy={wave.peak.y} r={6} fill="#E8828F" />
          <Circle cx={wave.calm.x} cy={wave.calm.y} r={15} fill={palette.sky} fillOpacity={0.8} />
          <Circle cx={wave.calm.x} cy={wave.calm.y} r={7} fill="#5FAFE0" />
        </Svg>
        <Text style={[Type.labelM, { position: 'absolute', left: 24, top: 0, color: '#C9744F' }]}>{`${fromWord} · ${clock(day.firstAt)}`}</Text>
        {day.count > 1 && (
          <Text style={[Type.labelM, { position: 'absolute', right: 24, bottom: 0, color: '#3E8FC4' }]}>{`${toWord} · ${clock(day.lastAt)}`}</Text>
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 24 }}>
        {day.count > 1 && <StatTile value={change ? signed(change) : '0'} caption={t('moments.calm.moodChange')} />}
        <StatTile value={String(day.practices.length)} caption={t('moments.calm.breaks', { count: day.practices.length })} />
        {day.count > 1 ? (
          <StatTile value={hours >= 1 ? `${Math.round(hours)}h` : `${Math.round(hours * 60)}m`} caption={t('moments.calm.toSettle')} />
        ) : (
          <StatTile value="1" caption={t('moments.calm.checkIns', { count: 1 })} />
        )}
      </View>

      <Text style={[Type.body, { fontWeight: '400', lineHeight: 22, color: palette.textMuted, marginTop: 24 }]}>{body}</Text>
    </MomentShell>
  );
}
