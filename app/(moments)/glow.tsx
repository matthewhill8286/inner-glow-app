import React, { useMemo } from 'react';
import { Share, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Glow } from '@/components/glow/Glow';
import { Icon } from '@/components/icons/Icon';
import { MomentShell } from '@/components/moments/MomentShell';
import { useScoreDays } from '@/hooks/useScoreDays';
import { daysInPeriod, factorImpacts, periodStart, signed } from '@/lib/glow-score';
import { riseScale } from '@/lib/moments';

const SCALE_H = 300;

/**
 * Glow rising (03 §3.3): this month's average Glow score as a light core on a scale, a beam down to
 * last month's, the change, and what helped most. Without last month, the month's first score is
 * the starting point.
 */
export default function GlowRisingMoment() {
  const { t, i18n } = useTranslation();
  const { width } = useWindowDimensions();
  const { days } = useScoreDays();
  const now = useMemo(() => new Date(), []);

  const data = useMemo(() => {
    const thisMonth = daysInPeriod(days, '1M', now);
    if (!thisMonth.length) return null;
    const avg = (xs: { score: number }[]) => Math.round(xs.reduce((a, d) => a + d.score, 0) / xs.length);
    const lastMonth = daysInPeriod(days, '1M', now, -1);
    const current = avg(thisMonth);
    const previous = lastMonth.length ? avg(lastMonth) : thisMonth[thisMonth.length - 1].score;
    const fromLabel = lastMonth.length
      ? periodStart('1M', now, -1).toLocaleDateString(i18n.language, { month: 'long' })
      : t('moments.glow.startOfMonth');
    const help = factorImpacts(thisMonth, new Map(days.map((d) => [d.key, d.factors]))).helps[0];
    return { current, previous, fromLabel, help };
  }, [days, now, i18n.language, t]);

  if (!data) {
    return (
      <MomentShell cta={{ label: t('moments.glow.checkIn'), onPress: () => router.replace('/(tabs)/mood/check-in') }}>
        <Text style={[Type.titleLg, { fontSize: 28, lineHeight: 34, color: palette.plumDeep, marginTop: 200 }]}>{t('moments.glow.emptyTitle')}</Text>
        <Text style={[Type.body, { fontWeight: '400', lineHeight: 22, color: palette.textMuted, marginTop: 10 }]}>{t('moments.glow.emptyBody')}</Text>
      </MomentShell>
    );
  }

  const { current, previous, fromLabel, help } = data;
  const delta = current - previous;
  const scale = riseScale(previous, current, SCALE_H);
  const cx = width / 2 - 24;
  const top = Math.min(scale.y(current), scale.y(previous));
  const beamH = Math.max(40, Math.abs(scale.y(previous) - scale.y(current)) + 60);
  const titleKey = delta > 0 ? 'rising' : delta < 0 ? 'dipping' : 'steady';
  const factor = help ? t(`glowScore.factors.${help.key}`) : null;

  return (
    <MomentShell
      glows={[
        { color: palette.mustard, opacity: 0.4, x: 37, y: 40, width: 300, blur: 90 },
        { color: palette.sky, opacity: 0.18, x: 200, y: 260, width: 220, blur: 90 },
      ]}
      cta={{ label: t('moments.glow.cta'), onPress: () => router.replace('/(tabs)/freud-score/insights') }}
      link={{ label: t('moments.glow.share'), onPress: () => void Share.share({ message: t('moments.glow.shareMessage', { from: previous, to: current }) }).catch(() => {}) }}
    >
      <View style={{ height: SCALE_H + 60, marginTop: 8 }}>
        {scale.ticks.map((tick) => (
          <View key={tick.value} style={{ position: 'absolute', left: 0, top: tick.y + 20, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: tick.major ? 18 : 10, height: 2, backgroundColor: palette.plum, opacity: tick.major ? 0.5 : 0.25 }} />
            {tick.major && <Text style={[Type.microBold, { color: palette.textSubtle }]}>{tick.value}</Text>}
          </View>
        ))}
        <Svg width={72} height={beamH} style={{ position: 'absolute', left: cx - 36, top: top + 20 }}>
          <Defs>
            <LinearGradient id="riseBeam" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={palette.mustard} stopOpacity={0.9} />
              <Stop offset="1" stopColor={palette.mustard} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={72} height={beamH} rx={36} fill="url(#riseBeam)" />
        </Svg>
        <Glow color={palette.mustard} opacity={0.6} width={150} blur={40} style={{ position: 'absolute', left: cx - 75, top: scale.y(current) + 20 - 75 }} />
        <View
          accessible
          accessibilityLabel={t('moments.glow.coreLabel', { score: current })}
          style={{
            position: 'absolute',
            left: cx - 55,
            top: scale.y(current) + 20 - 55,
            width: 110,
            height: 110,
            borderRadius: 55,
            backgroundColor: palette.white,
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0px 0px 40px 10px rgba(226,204,64,0.60)',
          }}
        >
          <Text style={[Type.display, { fontSize: 48, lineHeight: 58, color: palette.plumDeep }]}>{current}</Text>
        </View>
        {delta !== 0 && (
          <View style={{ position: 'absolute', right: 0, top: scale.y(current), flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: palette.lavender, borderRadius: 999, paddingVertical: 5, paddingLeft: 10, paddingRight: 12 }}>
            <Icon name={delta > 0 ? 'arrow/up' : 'arrow/down'} size={14} color={palette.white} />
            <Text style={[Type.labelM, { color: palette.white }]}>{t('moments.glow.delta', { delta: signed(delta) })}</Text>
          </View>
        )}
        <View style={{ position: 'absolute', left: cx - 60, width: 120, top: scale.y(previous) + 20 + (delta ? 50 : 70), alignItems: 'center' }}>
          {delta !== 0 && <Text style={[Type.titleXl, { color: 'rgba(78,58,94,0.30)', letterSpacing: 0 }]}>{previous}</Text>}
          <Text style={[Type.micro, { color: palette.textSubtle }]}>{fromLabel}</Text>
        </View>
      </View>

      <Text accessibilityRole="header" style={[Type.titleLg, { fontSize: 28, lineHeight: 34, color: palette.plumDeep, marginTop: 24 }]}>
        {t(`moments.glow.title.${titleKey}`)}
      </Text>
      <Text style={[Type.body, { fontWeight: '400', lineHeight: 22, color: palette.textMuted, marginTop: 10 }]}>
        {t('moments.glow.body', { from: previous, to: current })}
        {factor ? ` ${t('moments.glow.helped', { factor: factor.toLowerCase() })}` : ''}
      </Text>
    </MomentShell>
  );
}
