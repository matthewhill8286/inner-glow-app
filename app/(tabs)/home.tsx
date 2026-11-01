import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import Svg, { Circle, Defs, LinearGradient, Line, Rect, Stop } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { queryKeys } from '@/lib/queryKeys';
import { screenBottomPadding } from '@/lib/screen-layout';
import { Glow, GlowField } from '@/components/glow/Glow';
import { Icon } from '@/components/icons/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { AppButton } from '@/components/ui/AppButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { MoodSlider } from '@/components/mood/MoodSlider';
import AuraArt from '@/assets/svg/illustrations/home/aura.svg';
import { useFreudScore } from '@/hooks/useFreudScore';
import { useMood } from '@/hooks/useMood';
import { useProfile } from '@/hooks/useProfile';
import { useSleep } from '@/hooks/useSleep';
import { useSubscription } from '@/hooks/useSubscription';
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
  const { moodCheckIns, isLoading: moodLoading, updateMoodCheckIn } = useMood();
  const { sleepEntries } = useSleep();
  const { currentScore, scoreHistory, isLoadingHistory } = useFreudScore({ lazy: true, withHistory: true });

  const firstName = (profile?.name ?? '').trim().split(/\s+/)[0] ?? '';
  const greeting = t(`home.${greetingKey(new Date().getHours())}`);
  const loading = moodLoading || isLoadingHistory;

  if (!loading && isFirstDay(moodCheckIns.length, scoreHistory.length)) {
    return <FirstDay greeting={greeting} name={firstName} bottom={screenBottomPadding(insets.bottom)} topInset={insets.top} />;
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
        ref={scrollRef}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: screenBottomPadding(insets.bottom) }}
        showsVerticalScrollIndicator={false}
      >
        <Header greeting={greeting} name={firstName} isPro={hasFullAccess} />
        <MoodCard
          checkIns={moodCheckIns}
          locale={i18n.language}
          onEditToday={(id, score) => updateMoodCheckIn({ id, mood: moodStep(score).checkIn })}
        />
        <GlowAiInput />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, paddingHorizontal: 6 }}>
          <Text style={{ ...Type.headline, fontWeight: '500', color: palette.ink }}>{t('homeGlow.innerGlowToday')}</Text>
          <IconButton
            icon="line/more"
            variant="glass"
            size={40}
            accessibilityLabel={t('homeGlow.scoreOptions')}
            onPress={() => router.push('/(tabs)/freud-score')}
          />
        </View>
        <InnerGlowCard
          score={Math.round(currentScore.score)}
          scoreLabel={t(`freudScore.${labelKey(currentScore.label)}`, { defaultValue: currentScore.label })}
          scoreTrend={trend(currentScore.score, previousDayScore(scoreHistory))}
          checkIns={moodCheckIns}
          sleepEntries={sleepEntries}
        />
        <ForYouToday />
        {!hasFullAccess && <FreePlanCard />}
      </ScrollView>
    </View>
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
        style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: palette.lavender, alignItems: 'center', justifyContent: 'center' }}
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
        {name ? <Text style={{ ...Type.captionM, color: palette.textMuted }}>{`${greeting},`}</Text> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text accessibilityRole="header" numberOfLines={1} style={{ ...Type.titleMd, lineHeight: 26, color: palette.ink, flexShrink: 1 }}>
            {name || greeting}
          </Text>
          {isPro && (
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: palette.mustard, borderRadius: 999, paddingVertical: 2, paddingLeft: 6, paddingRight: 8 }}
            >
              <Icon name="line/crown" size={12} color={palette.ink} />
              <Text style={{ ...Type.microBold, fontSize: 10, color: palette.ink }}>PRO</Text>
            </View>
          )}
        </View>
      </View>
      <IconButton icon="line/search" variant="nav" accessibilityLabel={t('homeGlow.search')} onPress={() => router.push('/(tabs)/search')} />
      <IconButton icon="line/bell" variant="nav" accessibilityLabel={t('homeGlow.notifications')} onPress={() => router.push('/(tabs)/notifications')} />
    </View>
  );
}

/* ── Mood check-in card ──────────────────────────── */

function MoodCard({
  checkIns,
  locale,
  onEditToday,
}: {
  checkIns: ReturnType<typeof useMood>['moodCheckIns'];
  locale: string;
  onEditToday: (id: string, score: MoodScore) => void;
}) {
  const { t } = useTranslation();
  const today = todaysCheckIn(checkIns);
  const saved: MoodScore = today ? moodScoreOf(today.mood) : 3;
  const [value, setValue] = useState<MoodScore>(saved);
  useEffect(() => setValue(saved), [saved]);
  const step = moodStep(value);

  // Today's entry is edited in place. Without one, the full check-in collects energy and stress too.
  const release = (score: MoodScore) => {
    if (today) {
      if (score !== saved) onEditToday(today.id, score);
    } else {
      router.push({ pathname: '/(tabs)/mood/check-in', params: { mood: String(score) } });
    }
  };

  return (
    <View style={{ backgroundColor: palette.surface, borderRadius: 28, padding: 20, paddingTop: 18, marginTop: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text style={{ ...Type.bodyStrong, color: palette.ink }}>{t('homeGlow.howAreYou')}</Text>
        <Text style={{ ...Type.caption, fontWeight: '500', color: palette.textSubtle }}>
          {new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date())}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
        <Icon name={step.face} size={26} />
        <Text style={{ ...Type.titleMd, color: palette.plum }}>{t(`moodScale.${step.key}`)}</Text>
        <Text style={{ ...Type.captionS, color: palette.textSubtle, marginLeft: 4, marginTop: 4 }}>{t('homeGlow.slideToAdjust')}</Text>
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
  const open = () => router.push('/(tabs)/chat/new-conversation');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('homeGlow.askGlow')}
      onPress={open}
      style={({ pressed }) => ({
        marginTop: 16,
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
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: palette.lavender, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="line/sparkle" size={22} color={palette.white} accent={palette.gold} />
      </View>
      <Text style={{ ...Type.bodyM, color: palette.textSubtle, flex: 1 }}>{t('homeGlow.askGlow')}</Text>
      {/* The weekly free-chat count ("3 left") needs the quota backend (t172), so it is not shown yet. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('homeGlow.voice')}
        onPress={open}
        hitSlop={4}
        style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: palette.plum, alignItems: 'center', justifyContent: 'center' }}
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
      value: mood.latest?.stress != null ? t(`homeGlow.stressLevel.${stressLevel(mood.latest.stress)}`) : '–',
      trend: trend(mood.latest?.stress, mood.previous?.stress),
    },
  ];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t('homeGlow.glowScore')} ${score}, ${scoreLabel}`}
      onPress={() => router.push('/(tabs)/freud-score')}
      style={({ pressed }) => ({ marginTop: 8, height: 212, borderRadius: 28, backgroundColor: palette.surface, overflow: 'hidden', flexDirection: 'row', opacity: pressed ? 0.9 : 1 })}
    >
      <View style={{ width: 188, height: 212 }}>
        <Glow color={palette.mustard} opacity={0.35} width={170} blur={40} style={{ position: 'absolute', left: 9, top: 21 }} />
        <Glow color={palette.lavenderSoft} opacity={0.35} width={110} blur={30} style={{ position: 'absolute', left: 79, top: 81 }} />
        <Glow color={palette.gold} opacity={0.85} width={64} blur={16} style={{ position: 'absolute', left: 62, top: 74 }} />
        <AuraArt width={343} height={212} style={{ position: 'absolute', left: 0, top: 0 }} />
        <View style={{ position: 'absolute', left: 0, width: 188, top: 62, alignItems: 'center' }}>
          <Text style={{ ...Type.display, fontSize: 32, lineHeight: 38, color: palette.plumDeep }}>{score}</Text>
          <Text style={{ ...Type.micro, color: palette.textMuted, marginTop: 2 }}>{scoreLabel}</Text>
        </View>
      </View>
      <View style={{ flex: 1, paddingTop: 26, paddingRight: 12, gap: 12 }}>
        {rows.map((row) => (
          <View key={row.key} style={{ height: 31, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8 }}>
            <View style={{ width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
              <Glow color={LEGEND[row.key]} opacity={0.6} width={16} blur={5} style={{ position: 'absolute' }} />
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: LEGEND[row.key] }} />
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
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 8 }}>
        <Text style={{ ...Type.bodyStrong, color: palette.ink }}>{t('homeGlow.forYouToday')}</Text>
        <Pressable accessibilityRole="link" hitSlop={8} onPress={() => router.push('/(tabs)/mindful')}>
          <Text style={{ ...Type.label, fontSize: 13, color: palette.lavender }}>{t('homeGlow.allPractices')}</Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', gap: 9, marginTop: 14 }}>
        <PracticeCard
          title={t('homeGlow.breathing')}
          meta={t('homeGlow.breathingMeta')}
          cover="breathing"
          onPress={() => router.push('/(tabs)/stress/breathing')}
        />
        <PracticeCard
          title={t('homeGlow.windDown')}
          meta={t('homeGlow.windDownMeta')}
          cover="sleep"
          onPress={() => router.push('/(tabs)/sleep')}
        />
      </View>
    </View>
  );
}

function PracticeCard({ title, meta, cover, onPress }: { title: string; meta: string; cover: 'breathing' | 'sleep'; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${meta}`}
      onPress={onPress}
      style={({ pressed }) => ({ flex: 1, height: 112, borderRadius: 24, backgroundColor: palette.surface, padding: 6, opacity: pressed ? 0.85 : 1 })}
    >
      <View style={{ height: 58, borderRadius: 18, overflow: 'hidden', backgroundColor: '#FBF8F5', alignItems: 'center', justifyContent: 'center' }}>
        {cover === 'breathing' ? <BreathingCover /> : <SleepCover />}
        <View
          style={{ position: 'absolute', right: 6, top: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: palette.plum, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="line/play" size={14} color={palette.white} />
        </View>
      </View>
      <Text numberOfLines={1} style={{ ...Type.bodyMSemi, color: palette.ink, marginTop: 6, marginHorizontal: 8 }}>
        {title}
      </Text>
      <Text numberOfLines={1} style={{ ...Type.micro, fontWeight: '400', color: palette.textSubtle, marginTop: 4, marginHorizontal: 8 }}>
        {meta}
      </Text>
    </Pressable>
  );
}

/** Breathing cover: sky glow, four rings fading outward, gold centre (03 §2.1). */
function BreathingCover() {
  return (
    <>
      <Glow color={palette.sky} opacity={0.55} width={120} height={58} blur={24} style={{ position: 'absolute' }} />
      <Svg width={80} height={58} style={{ position: 'absolute' }}>
        {[
          [14, 0.5],
          [22, 0.35],
          [30, 0.25],
          [38, 0.15],
        ].map(([r, o]) => (
          <Circle key={r} cx={40} cy={29} r={r} stroke={palette.plum} strokeOpacity={o} strokeWidth={1} fill="none" />
        ))}
      </Svg>
      <Glow color={palette.gold} opacity={0.9} width={16} blur={4} />
    </>
  );
}

/** Sleep cover: lilac dusk gradient, glow, moon and a thin horizon. */
function SleepCover() {
  return (
    <>
      <Svg width="100%" height={58} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="sleepCover" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#E6DDEE" />
            <Stop offset="1" stopColor="#F3E6EE" />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height={58} fill="url(#sleepCover)" />
        <Line x1={0} y1={46.4} x2="100%" y2={46.4} stroke={palette.plum} strokeOpacity={0.3} strokeWidth={1} />
      </Svg>
      <Glow color={palette.lavenderSoft} opacity={0.7} width={110} height={58} blur={20} style={{ position: 'absolute' }} />
      <Icon name="line/moon" size={22} color="rgba(107,82,121,0.75)" />
    </>
  );
}

/* ── Free plan ───────────────────────────────────── */

function FreePlanCard() {
  const { t } = useTranslation();
  return (
    <View style={{ marginTop: 16, minHeight: 76, borderRadius: 24, backgroundColor: palette.surface, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
      <Glow color={palette.mustard} opacity={0.3} width={120} blur={30} style={{ position: 'absolute', left: -30, top: -20 }} />
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(226,204,64,0.30)', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="line/crown" size={20} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ ...Type.bodyMSemi, color: palette.ink }}>{t('homeGlow.freePlan')}</Text>
        {/* "3 of 10 AI chats left this week" and its progress bar wait for the quota backend (t172). */}
        <Text style={{ ...Type.captionS, color: palette.textMuted }}>{t('homeGlow.freePlanDetail')}</Text>
      </View>
      <AppButton title={t('homeGlow.tryPro')} size="s" onPress={() => router.push('/(utils)/trial-upgrade')} />
    </View>
  );
}

/* ── First day (09 §3.9) ─────────────────────────── */

function FirstDay({ greeting, name, bottom, topInset }: { greeting: string; name: string; bottom: number; topInset: number }) {
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <GlowField
        glows={[
          { color: palette.mustard, opacity: 0.15, x: 200, y: 40, width: 220, blur: 90 },
          { color: palette.lavenderSoft, opacity: 0.25, x: -70, y: -50, width: 280, blur: 90 },
        ]}
      />
      <ScrollView contentContainerStyle={{ paddingTop: topInset + 26, paddingHorizontal: 24, paddingBottom: bottom }}>
        <Text accessibilityRole="header" style={{ ...Type.titleLg, color: palette.ink }}>
          {name ? `${greeting}, ${name}` : greeting}
        </Text>
        <EmptyState glowColor={palette.mustard} title={t('homeGlow.firstDayTitle')} body={t('homeGlow.firstDayBody')} style={{ marginTop: 14 }} />
        <AppButton
          title={t('homeGlow.firstCheckIn')}
          onPress={() => router.push('/(tabs)/mood/check-in')}
          style={{ marginTop: 32 }}
        />
      </ScrollView>
    </View>
  );
}
