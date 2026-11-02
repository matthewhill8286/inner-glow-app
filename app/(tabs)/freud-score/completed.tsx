import React, { useMemo } from 'react';
import { Pressable, Share, Text, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { AppButton } from '@/components/ui/AppButton';
import { IconButton } from '@/components/ui/IconButton';
import { Icon } from '@/components/icons/Icon';
import { DeltaPill, PillChip, ScoreRing, ScoreScreen } from '@/components/score/ScoreParts';
import AuraArt from '@/assets/svg/illustrations/score/completed-aura.svg';
import { useFreudScore } from '@/hooks/useFreudScore';
import { useProfile } from '@/hooks/useProfile';
import { practiceById } from '@/data/practices';
import { openPractice } from '@/lib/practice-routes';
import { greetingName } from '@/lib/profile-stats';
import { formatMinutes } from '@/lib/glow-score';

const num = (v: string | undefined, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * You did it (03 §2.7): the two-tone ring with the gain drawn in, the points gained, the plan's
 * stats, what is up next and Go to Score history ("Score Tracker" is Score history).
 */
export default function CompletedScreen() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ from?: string; to?: string; done?: string; total?: string; minutes?: string }>();
  const { activityStats } = useFreudScore({ lazy: true });
  const { profile } = useProfile({ lazy: true });
  const to = num(params.to);
  const from = Math.min(to, num(params.from, to));
  const gain = to - from;
  const done = num(params.done);
  const total = num(params.total, done);
  const minutes = num(params.minutes);
  const streak = activityStats?.streak ?? 0;
  const name = greetingName(profile);

  // Up next: a sleep practice in the evening, a short listen during the day.
  const evening = new Date().getHours() >= 17;
  const next = useMemo(() => practiceById(evening ? 'quiet-mind' : 'soothing-melodies'), [evening]);

  const close = () => router.replace('/(tabs)/freud-score');
  const share = () =>
    Share.share({ message: t('glowScore.shareMessage', { from, to }) }).catch(() => {});

  return (
    <ScoreScreen
      glows={[
        { color: palette.sky, opacity: 0.22, x: -20, y: 16, width: 280, blur: 90 },
        { color: palette.mustard, opacity: 0.45, x: 60, y: 66, width: 300, blur: 80 },
      ]}
      art={<AuraArt width={width} height={(476 * width) / 375} />}
      nav={
        <View style={{ height: 50, alignItems: 'flex-end', justifyContent: 'center' }}>
          <IconButton size={40} variant="solid" icon="arrow/close" accessibilityLabel={t('common.close')} onPress={close} />
        </View>
      }
    >
      <View style={{ alignItems: 'center', marginTop: 13 }}>
        <ScoreRing size={184} thickness={3.7} value={from} gain={gain} knob animateGain>
          <View accessible accessibilityLabel={t('glowScore.ringLabel', { score: to })} style={{ alignItems: 'center', gap: 6 }}>
            <Text style={[Type.display, { fontSize: 64, lineHeight: 76, color: palette.plumDeep }]}>{to}</Text>
            {gain > 0 && <DeltaPill solid withValue={false} delta={gain} label={t('glowScore.points', { count: gain })} />}
          </View>
        </ScoreRing>
      </View>

      <Text accessibilityRole="header" style={[Type.titleXl, { color: palette.plumDeep, textAlign: 'center', marginTop: 86, letterSpacing: 0 }]}>
        {name ? t('glowScore.didItName', { name }) : t('glowScore.didIt')}
      </Text>
      <Text style={[Type.body, { fontWeight: '400', lineHeight: 21.75, color: palette.textMuted, textAlign: 'center', marginTop: 8, marginHorizontal: 16 }]}>
        {gain > 0 ? t('glowScore.wentFrom', { from, to }) : t('glowScore.tinySteps')}
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 24 }}>
        <PillChip icon="line/check" label={t('glowScore.doneCount', { done, total })} height={36} textSize={13} />
        {minutes > 0 && <PillChip icon="line/meditate" label={formatMinutes(minutes)} height={36} textSize={13} />}
        {streak > 0 && <PillChip icon="line/flame" label={t('glowScore.streak', { count: streak })} height={36} textSize={13} />}
      </View>

      {next && (
        <Pressable
          accessibilityRole="button"
          onPress={() => openPractice(next)}
          style={({ pressed }) => ({ marginTop: 30, minHeight: 76, borderRadius: 24, backgroundColor: palette.white, flexDirection: 'row', alignItems: 'center', gap: 14, paddingLeft: 16, paddingRight: 16, opacity: pressed ? 0.85 : 1 })}
        >
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(216,180,216,0.45)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={next.kind === 'sleep' ? 'line/moon' : 'line/music'} size={22} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[Type.caption, { fontWeight: '500', color: palette.textSubtle }]}>
              {t(evening ? 'glowScore.upNextTonight' : 'glowScore.upNext')}
            </Text>
            <Text style={[Type.bodyMSemi, { color: palette.plumDeep }]}>
              {`${t(`practices.items.${next.id}.title`)} · ${next.listMinutes} min`}
            </Text>
          </View>
          <Icon name="arrow/chevron-right" size={20} />
        </Pressable>
      )}

      <AppButton
        title={t('glowScore.goToHistory')}
        icon="arrow/forward"
        onPress={() => router.replace('/(tabs)/freud-score/history')}
        style={{ marginTop: 26 }}
      />
      <Pressable accessibilityRole="button" onPress={share} hitSlop={10} style={{ alignSelf: 'center', marginTop: 16 }}>
        <Text style={[Type.label, { fontWeight: '700', color: palette.lavender }]}>{t('glowScore.share')}</Text>
      </Pressable>
    </ScoreScreen>
  );
}
