import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { greetingName } from '@/lib/profile-stats';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { queryKeys } from '@/lib/queryKeys';
import { CategoryCard } from '@/components/practices/CategoryCard';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { screenBottomPadding } from '@/lib/screen-layout';
import { Glow, GlowField } from '@/components/glow/Glow';
import { Icon } from '@/components/icons/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { AppButton } from '@/components/ui/AppButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { MoodSlider } from '@/components/mood/MoodSlider';
import AuraArt from '@/assets/svg/illustrations/home/aura.svg';
import { useFreudScore } from '@/hooks/useFreudScore';
import { toast } from '@/components/Toast';
import { useMood } from '@/hooks/useMood';
import { useProfile } from '@/hooks/useProfile';
import { useSleep } from '@/hooks/useSleep';
import { useSubscription } from '@/hooks/useSubscription';
import { useGlowAiUsage } from '@/hooks/useGlowAi';
import { moodScoreOf, moodStep, type MoodScore } from '@/lib/mood-scale';
import {
  formatSleep,
  greetingKey,
  isFirstDay,
  latestTwoCheckIns,
  latestTwoNights,
  previousDayScore,
  stressLevel,
  todaysCheckIn,
  trend,
  type Trend,
} from '@/lib/home';
import { KEYBOARD_DISMISS_MODE } from '@/lib/keyboard';

/** Home · Free `6709:4319` and Home · Pro `6710:4161` (03 §2.1), with the first-day state (09 §3.9). */
export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      // Refresh tracking data so the Glow score and legend are current.
      queryClient.invalidateQueries({ queryKey: queryKeys.mood.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.sleep.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.mindfulness.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stress.allHistory });
    }, [queryClient]),
  );

  const { profile } = useProfile({ lazy: true });
  const { hasFullAccess } = useSubscription();
  const { moodCheckIns, isLoading: moodLoading, updateMoodCheckIn, addMoodCheckIn } = useMood();
  const { sleepEntries } = useSleep();
  const { currentScore, scoreHistory, isLoadingHistory } = useFreudScore({
    lazy: true,
    withHistory: true,
  });

  const firstName = greetingName(profile);
  const greeting = t(`home.${greetingKey(new Date().getHours())}`);
  const loading = moodLoading || isLoadingHistory;

  if (!loading && isFirstDay(moodCheckIns.length, scoreHistory.length)) {
    return (
      <FirstDay
        greeting={greeting}
        name={firstName}
        bottom={screenBottomPadding(insets.bottom)}
        topInset={insets.top}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <GlowField
        glows={[
          { color: palette.mustard, opacity: 0.25, x: -50, y: 0, width: 260, blur: 90 },
          { color: palette.sky, opacity: 0.2, x: 180, y: 40, width: 240, blur: 90 },
        ]}
      />
      <ScrollView
        keyboardDismissMode={KEYBOARD_DISMISS_MODE}
        ref={scrollRef}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: screenBottomPadding(insets.bottom),
        }}
        showsVerticalScrollIndicator={false}
      >
        <Header greeting={greeting} name={firstName} isPro={hasFullAccess} />
        <MoodCard
          checkIns={moodCheckIns}
          locale={i18n.language}
          onSave={(id, score) =>
            id
              ? updateMoodCheckIn({ id, mood: moodStep(score).checkIn })
              : addMoodCheckIn({ mood: moodStep(score).checkIn })
          }
        />
        <GlowAiInput />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 28,
            marginBottom: 5,
            paddingHorizontal: 6,
          }}
        >
          <Text style={{ ...Type.bodyLg, lineHeight: 20, color: palette.ink }}>
            {t('homeGlow.innerGlowToday')}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('homeGlow.scoreOptions')}
            hitSlop={10}
            onPress={() => router.push('/(tabs)/freud-score')}
            style={{
              width: 24,
              height: 24,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3.8,
            }}
          >
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={{ width: 3.2, height: 3.2, borderRadius: 1.6, backgroundColor: palette.ink }}
              />
            ))}
          </Pressable>
        </View>
        <InnerGlowCard
          score={Math.round(currentScore.score)}
          scoreLabel={t(`freudScore.${labelKey(currentScore.label)}`, {
            defaultValue: currentScore.label,
          })}
          scoreTrend={trend(currentScore.score, previousDayScore(scoreHistory))}
          checkIns={moodCheckIns}
          sleepEntries={sleepEntries}
        />
        <ForYouToday />
        {!hasFullAccess && <FreePlanCard />}
      </ScrollView>
      <StatusBackdrop height={insets.top} />
    </View>
  );
}

/**
 * The canvas colour behind the status bar, fading out just below it, so the header and cards that
 * scroll up never sit under the clock and battery.
 */
function StatusBackdrop({ height }: { height: number }) {
  const fade = 16;
  return (
    <Svg
      pointerEvents="none"
      width="100%"
      height={height + fade}
      style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
    >
      <Defs>
        <LinearGradient id="statusBackdrop" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={palette.bg} stopOpacity={1} />
          <Stop
            offset={String(height / (height + fade))}
            stopColor={palette.bg}
            stopOpacity={0.96}
          />
          <Stop offset="1" stopColor={palette.bg} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width="100%" height={height + fade} fill="url(#statusBackdrop)" />
    </Svg>
  );
}

/** "Above Average" → "aboveAverage", the existing `freudScore.*` translation keys. */
function labelKey(label: string) {
  return label
    .toLowerCase()
    .split(' ')
    .map((w, i) => (i ? w[0].toUpperCase() + w.slice(1) : w))
    .join('');
}

/* ── Header ──────────────────────────────────────── */

function Header({ greeting, name, isPro }: { greeting: string; name: string; isPro: boolean }) {
  const { t } = useTranslation();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 }}>
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: palette.lavender,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        accessibilityElementsHidden
      >
        {/* No avatar field exists yet (t202), so the initial stands in for the photo. */}
        {name ? (
          <Text style={{ ...Type.headline, color: palette.white }}>{name[0].toUpperCase()}</Text>
        ) : (
          <Icon name="line/user" size={22} color={palette.white} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        {/* Profiles without a name get the greeting as the large line instead of a stand-in name. */}
        {name ? (
          <Text style={{ ...Type.captionM, color: palette.textMuted }}>{`${greeting},`}</Text>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text
            accessibilityRole="header"
            numberOfLines={1}
            style={{ ...Type.titleMd, lineHeight: 26, color: palette.ink, flexShrink: 1 }}
          >
            {name || greeting}
          </Text>
          {isPro && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 3,
                backgroundColor: palette.mustard,
                borderRadius: 999,
                paddingVertical: 2,
                paddingLeft: 6,
                paddingRight: 8,
              }}
            >
              <Icon name="line/crown" size={12} color={palette.ink} />
              <Text style={{ ...Type.microBold, fontSize: 10, color: palette.ink }}>PRO</Text>
            </View>
          )}
        </View>
      </View>
      <IconButton
        icon="line/search"
        size={44}
        iconSize={24}
        accessibilityLabel={t('homeGlow.search')}
        onPress={() => router.push('/(tabs)/search')}
      />
      <IconButton
        icon="line/bell"
        size={44}
        iconSize={24}
        accessibilityLabel={t('homeGlow.notifications')}
        onPress={() => router.push('/(tabs)/notifications')}
      />
    </View>
  );
}

/* ── Mood check-in card ──────────────────────────── */

function MoodCard({
  checkIns,
  locale,
  onSave,
}: {
  checkIns: ReturnType<typeof useMood>['moodCheckIns'];
  locale: string;
  onSave: (id: string | undefined, score: MoodScore) => Promise<unknown>;
}) {
  const { t } = useTranslation();
  const today = todaysCheckIn(checkIns);
  const saved: MoodScore = today ? moodScoreOf(today.mood) : 3;
  const [value, setValue] = useState<MoodScore>(saved);
  useEffect(() => setValue(saved), [saved]);
  const step = moodStep(value);

  const saving = useRef(false);
  const release = async (score: MoodScore) => {
    if (saving.current) {
      setValue(saved);
      return;
    }
    if (today && score === saved) return;
    saving.current = true;
    try {
      await onSave(today?.id, score);
    } catch {
      setValue(saved);
      toast.error(t('moodCheckIn2.saveFailed'));
    } finally {
      saving.current = false;
    }
  };

  return (
    <View
      style={{
        backgroundColor: palette.surface,
        borderRadius: 28,
        padding: 20,
        paddingTop: 18,
        paddingBottom: 13,
        marginTop: 20,
      }}
    >
      <View
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}
      >
        <Text style={{ ...Type.bodyStrong, color: palette.ink }}>{t('homeGlow.howAreYou')}</Text>
        <Text style={{ ...Type.caption, fontWeight: '500', color: palette.textSubtle }}>
          {new Intl.DateTimeFormat(locale, {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          }).format(new Date())}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 11 }}>
        <Icon name={step.face} size={26} />
        <Text style={{ ...Type.titleMd, color: palette.plum }}>{t(`moodScale.${step.key}`)}</Text>
        <Text style={{ ...Type.captionS, color: palette.textSubtle, marginTop: 4 }}>
          {t('homeGlow.slideToAdjust')}
        </Text>
      </View>
      <MoodSlider
        value={value}
        onChange={setValue}
        onRelease={release}
        startLabel={t('moodScale.tense')}
        endLabel={t('moodScale.great')}
        accessibilityLabel={t('homeGlow.howAreYou')}
        style={{ marginTop: 10 }}
      />
    </View>
  );
}

/* ── Glow AI input ───────────────────────────────── */

function GlowAiInput() {
  const { t } = useTranslation();
  const { left } = useGlowAiUsage();
  const open = () =>
    router.push({ pathname: '/(tabs)/chat/new-conversation', params: { from: '/(tabs)/home' } });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('homeGlow.askGlow')}
      onPress={open}
      style={({ pressed }) => ({
        marginTop: 13,
        height: 60,
        borderRadius: 30,
        backgroundColor: palette.surface,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        gap: 12,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: palette.lavender,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="line/sparkle" size={22} color={palette.white} accent={palette.gold} />
      </View>
      <Text style={{ ...Type.bodyM, color: palette.textSubtle, flex: 1 }}>
        {t('homeGlow.askGlow')}
      </Text>
      {left !== null && (
        <View
          style={{
            backgroundColor: palette.selected,
            borderRadius: 999,
            paddingVertical: 3,
            paddingHorizontal: 8,
          }}
        >
          <Text style={{ ...Type.micro, fontWeight: '600', color: palette.plum }}>
            {t('homeGlow.chatsLeft', { count: left })}
          </Text>
        </View>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('homeGlow.voice')}
        onPress={open}
        hitSlop={4}
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: palette.plum,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="line/mic" size={20} color={palette.white} />
      </Pressable>
    </Pressable>
  );
}

/* ── Inner glow card ─────────────────────────────── */

const LEGEND = {
  score: palette.mustard,
  mood: palette.sky,
  sleep: palette.lavenderSoft,
  stress: palette.rose,
};

function InnerGlowCard({
  score,
  scoreLabel,
  scoreTrend,
  checkIns,
  sleepEntries,
}: {
  score: number;
  scoreLabel: string;
  scoreTrend: Trend;
  checkIns: ReturnType<typeof useMood>['moodCheckIns'];
  sleepEntries: ReturnType<typeof useSleep>['sleepEntries'];
}) {
  const { t } = useTranslation();
  const mood = latestTwoCheckIns(checkIns);
  const nights = useMemo(() => latestTwoNights(sleepEntries), [sleepEntries]);
  const moodScore = mood.latest ? moodScoreOf(mood.latest.mood) : null;
  const prevMood = mood.previous ? moodScoreOf(mood.previous.mood) : null;

  const rows: { key: keyof typeof LEGEND; label: string; value: string; trend: Trend }[] = [
    { key: 'score', label: t('homeGlow.glowScore'), value: String(score), trend: scoreTrend },
    {
      key: 'mood',
      label: t('homeGlow.mood'),
      value: moodScore ? t(`moodScale.${moodStep(moodScore).key}`) : '–',
      trend: trend(moodScore, prevMood),
    },
    {
      key: 'sleep',
      label: t('homeGlow.sleep'),
      value: nights.latest != null ? formatSleep(nights.latest) : '–',
      trend: trend(nights.latest, nights.previous),
    },
    {
      key: 'stress',
      label: t('homeGlow.stress'),
      value:
        mood.latest?.stress != null
          ? t(`homeGlow.stressLevel.${stressLevel(mood.latest.stress)}`)
          : '–',
      trend: trend(mood.latest?.stress, mood.previous?.stress),
    },
  ];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t('homeGlow.glowScore')} ${score}, ${scoreLabel}`}
      onPress={() => router.push('/(tabs)/freud-score')}
      style={({ pressed }) => ({
        marginTop: 8,
        height: 212,
        borderRadius: 28,
        backgroundColor: palette.surface,
        overflow: 'hidden',
        flexDirection: 'row',
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View style={{ width: 188, height: 212 }}>
        <Glow
          color={palette.mustard}
          opacity={0.35}
          width={170}
          blur={40}
          style={{ position: 'absolute', left: 9, top: 21 }}
        />
        <Glow
          color={palette.lavenderSoft}
          opacity={0.35}
          width={110}
          blur={30}
          style={{ position: 'absolute', left: 79, top: 81 }}
        />
        <Glow
          color={palette.gold}
          opacity={0.85}
          width={64}
          blur={16}
          style={{ position: 'absolute', left: 62, top: 74 }}
        />
        <AuraArt width={343} height={212} style={{ position: 'absolute', left: 0, top: 0 }} />
        {/* The aura's rings and the gold glow centre on (94, 106), half the card's height, so the
            number and label centre on the same point. */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            width: 188,
            top: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ ...Type.display, fontSize: 32, lineHeight: 38, color: palette.plumDeep }}>
            {score}
          </Text>
          <Text style={{ ...Type.micro, color: palette.textMuted, marginTop: 2 }}>
            {scoreLabel}
          </Text>
        </View>
      </View>
      <View style={{ flex: 1, paddingTop: 26, paddingRight: 12, gap: 12 }}>
        {rows.map((row) => (
          <View
            key={row.key}
            style={{
              height: 31,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 8,
            }}
          >
            <View style={{ width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
              <Glow
                color={LEGEND[row.key]}
                opacity={0.6}
                width={16}
                blur={5}
                style={{ position: 'absolute' }}
              />
              <View
                style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: LEGEND[row.key] }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ ...Type.micro, color: palette.textSubtle }}>{row.label}</Text>
              <Text numberOfLines={1} style={{ ...Type.bodyMSemi, color: palette.ink }}>
                {row.value}
              </Text>
            </View>
            {row.trend && <Icon name={row.trend === 'up' ? 'arrow/up' : 'arrow/down'} size={16} />}
          </View>
        ))}
      </View>
    </Pressable>
  );
}

/* ── For you today ───────────────────────────────── */

function ForYouToday() {
  const { t } = useTranslation();
  return (
    <View style={{ marginTop: 28 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          paddingHorizontal: 8,
        }}
      >
        <Text style={{ ...Type.bodyStrong, lineHeight: 20, color: palette.ink }}>
          {t('homeGlow.forYouToday')}
        </Text>
        <Pressable
          accessibilityRole="link"
          hitSlop={8}
          onPress={() => router.push('/(tabs)/mindful')}
        >
          <Text style={{ ...Type.chipSelected, color: palette.lavender }}>
            {t('homeGlow.allPractices')}
          </Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', gap: 9, marginTop: 13 }}>
        <CategoryCard
          kind="breathing"
          title={t('homeGlow.breathing')}
          meta={t('homeGlow.breathingMeta')}
          onPress={() =>
            router.push({
              pathname: '/(tabs)/mindful/category/[category]',
              params: { category: 'breathing' },
            })
          }
        />
        <CategoryCard
          kind="sleep"
          title={t('homeGlow.windDown')}
          meta={t('homeGlow.windDownMeta')}
          onPress={() => router.push('/(tabs)/sleep')}
        />
      </View>
    </View>
  );
}

/* ── Free plan ───────────────────────────────────── */

function FreePlanCard() {
  const { t } = useTranslation();
  return (
    <View
      style={{
        marginTop: 16,
        minHeight: 76,
        borderRadius: 24,
        backgroundColor: palette.surface,
        overflow: 'hidden',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
      }}
    >
      <Glow
        color={palette.mustard}
        opacity={0.3}
        width={120}
        blur={30}
        style={{ position: 'absolute', left: -30, top: -20 }}
      />
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: 'rgba(226,204,64,0.30)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="line/crown" size={20} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ ...Type.bodyMSemi, color: palette.ink }}>{t('homeGlow.freePlan')}</Text>
        {/* "3 of 10 AI chats left this week" and its progress bar wait for the quota backend (t172). */}
        <Text style={{ ...Type.captionS, color: palette.textMuted }}>
          {t('homeGlow.freePlanDetail')}
        </Text>
      </View>
      <AppButton
        title={t('homeGlow.tryPro')}
        size="s"
        onPress={() =>
          router.push({ pathname: '/(utils)/trial-upgrade', params: { variant: 'home' } })
        }
      />
    </View>
  );
}

/* ── First day (09 §3.9) ─────────────────────────── */

function FirstDay({
  greeting,
  name,
  bottom,
  topInset,
}: {
  greeting: string;
  name: string;
  bottom: number;
  topInset: number;
}) {
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <GlowField
        glows={[
          { color: palette.mustard, opacity: 0.15, x: 200, y: 40, width: 220, blur: 90 },
          { color: palette.lavenderSoft, opacity: 0.25, x: -70, y: -50, width: 280, blur: 90 },
        ]}
      />
      <ScrollView
        keyboardDismissMode={KEYBOARD_DISMISS_MODE}
        contentContainerStyle={{
          paddingTop: topInset + 26,
          paddingHorizontal: 24,
          paddingBottom: bottom,
        }}
      >
        <Text accessibilityRole="header" style={{ ...Type.titleLg, color: palette.ink }}>
          {name ? `${greeting}, ${name}` : greeting}
        </Text>
        <EmptyState
          glowColor={palette.mustard}
          title={t('homeGlow.firstDayTitle')}
          body={t('homeGlow.firstDayBody')}
          style={{ marginTop: 14 }}
        />
        <AppButton
          title={t('homeGlow.firstCheckIn')}
          onPress={() => router.push('/(tabs)/mood/check-in')}
          style={{ marginTop: 32 }}
        />
      </ScrollView>
    </View>
  );
}
