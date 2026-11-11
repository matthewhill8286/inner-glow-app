import React, { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { EmptyScreen } from '@/components/EmptyScreen';
import { LegalNote } from '@/components/ui/controls';
import { IconButton } from '@/components/ui/IconButton';
import {
  DateTile,
  MiniRing,
  PillChip,
  ScoreNav,
  ScoreRing,
  ScoreScreen,
} from '@/components/score/ScoreParts';
import AuraArt from '@/assets/svg/illustrations/score/aura.svg';
import { useFreudScore } from '@/hooks/useFreudScore';
import { useScoreDays, type ScoreDay } from '@/hooks/useScoreDays';
import { useMood } from '@/hooks/useMood';
import { checkInDays, SCORE_HISTORY_MIN_DAYS } from '@/lib/home';
import { labelKey, scoreColor, scoreRange, dayKey } from '@/lib/glow-score';
import { moodScoreOf, moodStep } from '@/lib/mood-scale';
import { backTo } from '@/lib/navigation';
import { queryKeys } from '@/lib/queryKeys';
import type { AISuggestion } from '@/lib/freudScore';

/**
 * Glow score (03 §2.2): the 176 ring over the aura art, the score's label, the range chip and
 * "Ask Glow AI why", the last three days and the legal note. The chart and filters moved to
 * Insights and Score history.
 */
export default function GlowScoreScreen() {
  const { t, i18n } = useTranslation();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const { currentScore, isDataLoading, isLoadingHistory, saveScore, suggestions } = useFreudScore();
  const { moodCheckIns, isLoading: moodLoading } = useMood();
  const { days } = useScoreDays();
  const hasSavedRef = useRef(false);

  // Refresh the sources on focus so the live score recalculates.
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

  // Save today's snapshot once the data has settled; history and Insights read these.
  useEffect(() => {
    if (!isDataLoading && !isLoadingHistory && currentScore.score > 0 && !hasSavedRef.current) {
      hasSavedRef.current = true;
      saveScore({ result: currentScore, generateSuggestions: false }).catch(() => {});
    }
  }, [isDataLoading, isLoadingHistory, currentScore, saveScore]);

  // Glow score · History empty (09 §3.10): history appears after check-ins on three different days.
  if (!moodLoading && checkInDays(moodCheckIns) < SCORE_HISTORY_MIN_DAYS) {
    return (
      <EmptyScreen
        header={{
          kind: 'nav',
          title: t('emptyStates.score.title'),
          backLabel: t('common.back'),
          onBack: () => backTo(undefined, '/(tabs)/home'),
        }}
        glowColor={palette.mustard}
        title={t('emptyStates.score.emptyTitle')}
        body={t('emptyStates.score.body')}
        action={{
          label: t('emptyStates.score.action'),
          onPress: () =>
            router.push({
              pathname: '/(tabs)/mood/check-in',
              params: { from: from ?? '/(tabs)/home' },
            }),
        }}
      />
    );
  }

  const score = currentScore.score;
  const label = t(`freudScore.${labelKey(currentScore.label)}`, {
    defaultValue: currentScore.label,
  });
  const range = scoreRange(score);

  const askWhy = () =>
    router.push({
      pathname: '/(tabs)/chat/new-conversation',
      params: {
        initialMessage: t('glowScore.askWhyPrompt', { score, label }),
        from: '/(tabs)/freud-score',
      },
    });

  return (
    <ScoreScreen
      tabBar
      glows={[
        { color: palette.mustard, opacity: 0.4, x: 37.5, y: 62, width: 300, blur: 80 },
        { color: palette.lavenderSoft, opacity: 0.3, x: 167.5, y: 142, width: 200, blur: 70 },
      ]}
      art={<AuraArt width={width} height={(460 * width) / 375} />}
      nav={
        <ScoreNav
          label={t('glowScore.title')}
          backLabel={t('common.back')}
          onBack={() => backTo(undefined, '/(tabs)/home')}
          // Figma has no way into Insights; this button is the entry point.
          trailing={
            <IconButton
              size={44}
              variant="solid"
              icon="line/chart"
              iconSize={20}
              accessibilityLabel={t('glowScore.insights')}
              onPress={() => router.push('/(tabs)/freud-score/insights')}
            />
          }
        />
      }
    >
      <View style={{ alignItems: 'center', marginTop: 23 }}>
        <ScoreRing size={176} thickness={3} value={isDataLoading ? 0 : score} knob={!isDataLoading}>
          {isDataLoading ? (
            <ActivityIndicator
              color={palette.plum}
              accessibilityLabel={t('freudScore.calculatingScore')}
            />
          ) : (
            <View
              accessible
              accessibilityLabel={t('glowScore.ringLabel', { score })}
              style={{ alignItems: 'center' }}
            >
              <Text
                style={[Type.display, { fontSize: 64, lineHeight: 76, color: palette.plumDeep }]}
              >
                {score}
              </Text>
              <Text style={[Type.chip, { color: palette.textMuted }]}>{t('glowScore.outOf')}</Text>
            </View>
          )}
        </ScoreRing>
      </View>

      <Text
        accessibilityRole="header"
        style={[
          Type.titleLg,
          {
            fontSize: 24,
            lineHeight: 29,
            color: palette.plumDeep,
            textAlign: 'center',
            marginTop: 32,
          },
        ]}
      >
        {isDataLoading ? ' ' : label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: 8,
          marginTop: 9,
        }}
      >
        <PillChip icon={range.face} label={t(`glowScore.range.${range.key}`)} />
        <PillChip icon="line/sparkle" label={t('glowScore.askWhy')} outlined onPress={askWhy} />
        <PillChip
          icon="line/note"
          label={t('aboutScore.link')}
          outlined
          onPress={() => router.push('/(tabs)/freud-score/about')}
        />
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 8,
          minHeight: 44,
        }}
      >
        <Text accessibilityRole="header" style={[Type.titleSm, { color: palette.plumDeep }]}>
          {t('glowScore.history')}
        </Text>
        <Pressable
          accessibilityRole="link"
          hitSlop={12}
          onPress={() => router.push({ pathname: '/(tabs)/freud-score/history', params: { from } })}
        >
          <Text style={[Type.label, { fontWeight: '700', color: palette.lavender }]}>
            {t('glowScore.seeAll')}
          </Text>
        </Pressable>
      </View>

      <View style={{ gap: 10, marginTop: 2, marginHorizontal: -8 }}>
        {days.slice(0, 3).map((d) => (
          <HistoryRow
            key={d.key}
            day={d}
            suggestions={suggestions}
            locale={i18n.language}
            from={from}
          />
        ))}
      </View>

      <LegalNote text={t('glowScore.legal')} style={{ marginTop: 20 }} />
    </ScoreScreen>
  );
}

function HistoryRow({
  day,
  suggestions,
  locale,
  from,
}: {
  day: ScoreDay;
  suggestions: AISuggestion[];
  locale: string;
  from?: string;
}) {
  const { t } = useTranslation();
  const mood = day.checkIn
    ? t(`moodScale.${moodStep(moodScoreOf(day.checkIn.mood)).key}`)
    : t('glowScore.noCheckIn');
  // The day's recommendation is the first suggestion made that day (03 §2.2).
  const suggestion = suggestions.find((s) => dayKey(new Date(s.createdAt)) === day.key);
  const sub = suggestion?.title ?? t('glowScore.noRecommendation');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${day.date.toLocaleDateString(locale, { day: 'numeric', month: 'long' })}, ${mood}, ${sub}, ${day.score}`}
      onPress={() => router.push({ pathname: '/(tabs)/freud-score/history', params: { from } })}
      style={({ pressed }) => ({
        minHeight: 62,
        borderRadius: 999,
        backgroundColor: palette.white,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 8,
        paddingLeft: 8,
        paddingRight: 12,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <DateTile date={day.date} locale={locale} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text numberOfLines={1} style={[Type.bodyStrong, { color: palette.plumDeep }]}>
          {mood}
        </Text>
        <Text numberOfLines={1} style={[Type.captionS, { color: palette.textSubtle }]}>
          {sub}
        </Text>
      </View>
      <MiniRing value={day.score} color={scoreColor(day.score)} />
    </Pressable>
  );
}
