import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSubscription } from '@/hooks/useSubscription';
import { Colors, UI } from '@/constants/theme';
import { getAffirmations } from '@/constants/affirmations';
import { useFreudScore } from '@/hooks/useFreudScore';
import { getFreudColor } from '@/lib/freudScore';
import { useMood } from '@/hooks/useMood';
import { useJournal } from '@/hooks/useJournal';
import { useProfile } from '@/hooks/useProfile';
import { useSleep } from '@/hooks/useSleep';
import { useMindfulness } from '@/hooks/useMindfulness';
import { useStress } from '@/hooks/useStress';
import { useNotificationStore } from '@/lib/notificationStore';
import type { MoodCheckIn } from '@/lib/types';

import Svg, { Circle, Defs, LinearGradient, Stop, Line } from 'react-native-svg';
import { SkeletonRect } from '@/components/Skeleton';
import { HorizontalActionList } from '@/components/HorizontalActionList';

/* ── Design tokens ── */
const BROWN = '#8B6B47';
const SAGE = '#5B7A53';
const CREAM = '#FAF8F5';

/* ── Mood helpers ── */
const MOOD_META: Record<string, { emoji: string; color: string; value: number }> = {
  Great: { emoji: '😄', color: '#5AAF8B', value: 5 },
  Good: { emoji: '😊', color: '#7EAD7E', value: 4 },
  Okay: { emoji: '😐', color: '#E8985A', value: 3 },
  Low: { emoji: '😔', color: '#C47A5A', value: 2 },
  Bad: { emoji: '😢', color: '#C45B5B', value: 1 },
};

function getGreeting(t: (k: string) => string): string {
  const hour = new Date().getHours();
  if (hour < 12) return t('home.goodMorning');
  if (hour < 17) return t('home.goodAfternoon');
  return t('home.goodEvening');
}

function getDateString(): string {
  const d = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function Home() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { isExpired, hasFullAccess, isTrialActive, trialDaysLeft } = useSubscription();
  const { profile } = useProfile({ lazy: true });
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []));

  const { moodCheckIns, isLoading: moodLoading } = useMood();
  const { journalEntries, isLoading: journalLoading } = useJournal();
  const { currentScore: freudScore, isDataLoading: freudDataLoading } = useFreudScore({ lazy: true });
  const { sleepEntries, isLoading: sleepLoading } = useSleep();
  const { mindfulnessHistory, isLoading: mindfulnessLoading } = useMindfulness();
  const { stressKit, isLoading: stressLoading } = useStress({ lazy: true });

  const moodCount = moodCheckIns?.length || 0;
  const journalCount = journalEntries?.length || 0;
  const score = freudDataLoading ? 0 : (freudScore?.score ?? 0);
  const scoreColor = getFreudColor(score);

  /* ── Computed tracker values ── */
  const todayStr = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  // Mindful Hours: total today + goal of 8h
  const mindfulTodaySec = useMemo(
    () =>
      (mindfulnessHistory ?? [])
        .filter((m) => m.dateISO.slice(0, 10) === todayStr)
        .reduce((sum, m) => sum + m.seconds, 0),
    [mindfulnessHistory, todayStr],
  );
  const mindfulTodayHrs = (mindfulTodaySec / 3600).toFixed(1);
  const mindfulGoalHrs = 8;
  const mindfulDots = Math.min(4, Math.round((mindfulTodaySec / (mindfulGoalHrs * 3600)) * 4));

  // Sleep Quality: latest entry quality + avg duration
  const latestSleep = sleepEntries?.[0];
  const sleepQuality = latestSleep?.quality ?? 0;
  const sleepAvgHrs = useMemo(() => {
    const recent = (sleepEntries ?? []).slice(0, 7);
    if (recent.length === 0) return 0;
    const totalHrs = recent.reduce((sum, e) => {
      if (e.startISO && e.endISO) {
        const diff = new Date(e.endISO).getTime() - new Date(e.startISO).getTime();
        return sum + diff / 3600000;
      }
      if (e.duration) {
        return sum + (e.duration > 24 ? e.duration / 60 : e.duration);
      }
      return sum;
    }, 0);
    return totalHrs / recent.length;
  }, [sleepEntries]);
  const sleepLabel = useMemo(() => {
    if (sleepAvgHrs === 0) return 'No data yet';
    if (sleepAvgHrs >= 7) return `Healthy (~${sleepAvgHrs.toFixed(0)}h Avg)`;
    if (sleepAvgHrs >= 5) return `Fair (~${sleepAvgHrs.toFixed(0)}h Avg)`;
    return `Insomniac (~${sleepAvgHrs.toFixed(0)}h Avg)`;
  }, [sleepAvgHrs]);
  const sleepDots = Math.min(4, Math.max(0, sleepQuality));

  // Journal: entries this week + streak
  const journalThisWeek = useMemo(
    () => (journalEntries ?? []).filter((j) => j.createdAt >= weekAgo).length,
    [journalEntries, weekAgo],
  );
  const journalStreak = useMemo(() => {
    const entries = journalEntries ?? [];
    if (entries.length === 0) return 0;
    let streak = 0;
    const today = new Date();
    for (let d = 0; d < 365; d++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - d);
      const dateStr = checkDate.toISOString().slice(0, 10);
      const hasEntry = entries.some((e) => e.createdAt.slice(0, 10) === dateStr);
      if (hasEntry) {
        streak++;
      } else if (d > 0) {
        break;
      }
    }
    return streak;
  }, [journalEntries]);
  const journalGoalDots = Math.min(5, journalThisWeek);

  // Stress Level: from latest mood check-in stress, or stressKit.level
  const latestStress = useMemo(() => {
    const latest = moodCheckIns?.[0];
    if (latest?.stress != null) return latest.stress;
    return stressKit?.level ?? 5;
  }, [moodCheckIns, stressKit]);
  const stressNorm = Math.round(latestStress / 2); // 0-10 → 0-5
  const stressLevelLabel = useMemo(() => {
    if (latestStress <= 2) return `Level ${latestStress} (Low)`;
    if (latestStress <= 5) return `Level ${latestStress} (Normal)`;
    if (latestStress <= 7) return `Level ${latestStress} (High)`;
    return `Level ${latestStress} (Very High)`;
  }, [latestStress]);

  // Mood Tracker: last 3 moods as flow
  const last3Moods = useMemo(() => {
    const moods = (moodCheckIns ?? []).slice(0, 3).reverse();
    return moods.map((m) => m.mood);
  }, [moodCheckIns]);

  const affirmation = useMemo(() => {
    const today = new Date().toDateString();
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
      hash = today.charCodeAt(i) + ((hash << 5) - hash);
    }
    const affirmations = getAffirmations(t);
    const index = Math.abs(hash) % affirmations.length;
    return affirmations[index];
  }, [t]);

  const greeting = useMemo(() => getGreeting(t), [t]);
  const dateStr = useMemo(() => getDateString(), []);
  const userName = profile?.name || '';

  // Load notification store & get unread count
  const loadNotifs = useNotificationStore((s) => s.load);
  const unreadCount = useNotificationStore((s) => s.notifications.filter((n) => !n.read).length);
  useEffect(() => {
    loadNotifs();
  }, []);

  const latestMood = moodCheckIns?.[0];
  const moodLabel = latestMood?.mood ?? '';

  return (
    <View style={[s.root, { backgroundColor: colors.background, paddingTop: insets.top + 6 }]}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top bar: date + notification bell ── */}
        <View style={s.topBar}>
          <View style={s.dateRow}>
            <View style={[s.greenDot, { backgroundColor: SAGE }]} />
            <Text style={[s.dateText, { color: colors.mutedText }]}>{dateStr}</Text>
          </View>
          <Pressable
            onPress={() => router.push('/(tabs)/notifications')}
            style={({ pressed }) => [
              s.bellBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <MaterialIcons
              name={unreadCount > 0 ? 'notifications' : 'notifications-none'}
              size={20}
              color={unreadCount > 0 ? '#E8985A' : colors.text}
            />
            {unreadCount > 0 && (
              <View style={s.bellBadge}>
                <Text style={s.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* ── Greeting with avatar + badges ── */}
        <View style={s.greetingRow}>
          <View style={[s.avatar, { backgroundColor: SAGE }]}>
            <Text style={s.avatarText}>{userName ? userName.charAt(0).toUpperCase() : '😊'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.greetingName, { color: colors.text }]}>
              Hi, {userName || t('tabs.home')}!
            </Text>
            <View style={s.badgeRow}>
              {hasFullAccess && (
                <View style={[s.badge, { backgroundColor: SAGE + '18' }]}>
                  <Text style={[s.badgeEmoji, { color: SAGE }]}>★</Text>
                  <Text style={[s.badgeLabel, { color: SAGE }]}>
                    {isTrialActive ? `Trial · ${trialDaysLeft}d left` : 'Pro'}
                  </Text>
                </View>
              )}
              {freudDataLoading ? (
                <SkeletonRect width={56} height={22} borderRadius={11} />
              ) : (
                <View style={[s.badge, { backgroundColor: scoreColor + '18' }]}>
                  <Text style={[s.badgeEmoji, { color: scoreColor }]}>⬆</Text>
                  <Text style={[s.badgeLabel, { color: scoreColor }]}>{score}%</Text>
                </View>
              )}
              {moodLabel ? (
                <View style={[s.badge, { backgroundColor: '#E8985A18' }]}>
                  <Text style={[s.badgeEmoji, { color: '#E8985A' }]}>●</Text>
                  <Text style={[s.badgeLabel, { color: '#E8985A' }]}>
                    {moodLabel.charAt(0).toUpperCase() + moodLabel.slice(1)}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* ── Search bar ── */}
        <Pressable
          onPress={() => router.push('/(tabs)/search')}
          style={[s.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[s.searchPlaceholder, { color: colors.placeholder }]}>
            Search anything...
          </Text>
          <MaterialIcons name="search" size={18} color={colors.icon} />
        </Pressable>

        <View style={s.content}>
            {/* ── Trial expired banner ── */}
            {isExpired && (
              <Pressable
                onPress={() => router.push('/(utils)/trial-upgrade')}
                style={[s.trialBanner, { backgroundColor: colors.primary }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={s.trialTitle}>{t('common.trialExpired')}</Text>
                  <Text style={s.trialSub}>{t('common.upgradeToLifetime')}</Text>
                </View>
                <Text style={s.trialArrow}>→</Text>
              </Pressable>
            )}

            {/* ── Mental Health Metrics card ── */}
            {freudDataLoading ? (
              <View style={[s.metricsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* Tab row skeleton */}
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                  <SkeletonRect width={90} height={28} borderRadius={14} />
                  <SkeletonRect width={56} height={28} borderRadius={14} />
                </View>
                {/* Score ring skeleton */}
                <View style={{ alignItems: 'center', marginVertical: 12 }}>
                  <SkeletonRect width={180} height={180} borderRadius={90} />
                </View>
                {/* CTA skeleton */}
                <SkeletonRect height={44} borderRadius={16} />
              </View>
            ) : (
              <MetricsCard
                colors={colors}
                score={score}
                scoreColor={scoreColor}
                freudScore={freudScore}
                freudDataLoading={freudDataLoading}
                moodCheckIns={moodCheckIns}
                t={t}
              />
            )}

            {/* ── Mindful Tracker ── */}
            <Text style={[s.sectionTitle, { color: colors.text }]}>Mindful Tracker</Text>

            <View
              style={[s.trackerCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              {/* Mindful Hours */}
              {mindfulnessLoading ? (
                <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
                  <SkeletonRect height={44} borderRadius={UI.radius.md} />
                </View>
              ) : (
                <TrackerItem
                  icon="schedule"
                  title="Mindful Hours"
                  subtitle={`${mindfulTodayHrs}h/${mindfulGoalHrs}h Today`}
                  colors={colors}
                  onPress={() => router.push('/(tabs)/mindful')}
                  indicator={<MiniDots count={4} active={mindfulDots} color={SAGE} />}
                />
              )}
              <Divider color={colors.divider} />

              {/* Sleep Quality */}
              {sleepLoading ? (
                <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
                  <SkeletonRect height={44} borderRadius={UI.radius.md} />
                </View>
              ) : (
                <TrackerItem
                  icon="bedtime"
                  title="Sleep Quality"
                  subtitle={sleepLabel}
                  colors={colors}
                  onPress={() => router.push('/(tabs)/sleep')}
                  indicator={
                    <MiniDots
                      count={4}
                      active={sleepDots}
                      color={sleepQuality >= 3 ? SAGE : '#E8985A'}
                    />
                  }
                />
              )}
              <Divider color={colors.divider} />

              {/* Journal */}
              {journalLoading ? (
                <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
                  <SkeletonRect height={44} borderRadius={UI.radius.md} />
                </View>
              ) : (
                <TrackerItem
                  icon="menu-book"
                  title="Mindful Journal"
                  subtitle={
                    journalStreak > 0
                      ? `${journalStreak} Day Streak`
                      : `${journalThisWeek} this week`
                  }
                  colors={colors}
                  onPress={() => router.push('/(tabs)/journal')}
                  indicator={<MiniDots count={5} active={journalGoalDots} color={SAGE} />}
                />
              )}
              <Divider color={colors.divider} />

              {/* Stress Level */}
              {stressLoading ? (
                <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
                  <SkeletonRect height={44} borderRadius={UI.radius.md} />
                </View>
              ) : (
                <TrackerItem
                  icon={latestStress <= 5 ? 'trending-down' : 'trending-up'}
                  title="Stress Level"
                  subtitle={stressLevelLabel}
                  colors={colors}
                  onPress={() => router.push('/(tabs)/stress')}
                  indicator={<StressBar level={stressNorm} />}
                />
              )}
              <Divider color={colors.divider} />

              {/* Mood Tracker */}
              {moodLoading ? (
                <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
                  <SkeletonRect height={44} borderRadius={UI.radius.md} />
                </View>
              ) : (
                <TrackerItem
                  icon="mood"
                  title="Mood Tracker"
                  subtitle={
                    moodCount > 0 ? `${moodCount} check-in${moodCount !== 1 ? 's' : ''}` : 'No data yet'
                  }
                  colors={colors}
                  onPress={() => router.push('/(tabs)/mood')}
                  indicator={<MoodFlow moods={last3Moods} />}
                />
              )}
            </View>

            {/* ── AI Therapy Chatbot ── */}
            <Pressable onPress={() => router.push('/(tabs)/chat')}>
              <Text style={[s.sectionTitle, { color: colors.text }]}>AI Therapy Chatbot</Text>
            </Pressable>

            {moodLoading && journalLoading ? (
              <SkeletonRect height={130} borderRadius={UI.radius.xxl} />
            ) : (
              <Pressable
                onPress={() => router.push('/(tabs)/chat')}
                style={({ pressed }) => [
                  s.chatCard,
                  { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <View style={s.chatDotsRow}>
                    <View style={[s.chatDot, { backgroundColor: SAGE }]} />
                    <View style={[s.chatDot, { backgroundColor: SAGE + '60' }]} />
                    <View style={[s.chatDot, { backgroundColor: SAGE + '30' }]} />
                  </View>
                  <Text style={[s.chatCount, { color: colors.text }]}>
                    {moodCount + journalCount > 0 ? moodCount + journalCount : 0}
                  </Text>
                  <Text style={[s.chatLabel, { color: colors.mutedText }]}>Conversations</Text>
                  {hasFullAccess ? (
                    <Text style={[s.chatPro, { color: SAGE, marginTop: 8 }]}>
                      {isTrialActive ? `★ Trial · ${trialDaysLeft}d left` : '★ Pro'}
                    </Text>
                  ) : (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        router.push('/(utils)/trial-upgrade');
                      }}
                      style={({ pressed }) => [
                        s.chatProBtn,
                        { backgroundColor: pressed ? SAGE + '25' : SAGE + '15' },
                      ]}
                    >
                      <Text style={[s.chatPro, { color: SAGE }]}>★ Go Pro Now!</Text>
                    </Pressable>
                  )}
                </View>
                <View style={[s.chatRobot, { backgroundColor: SAGE + '10' }]}>
                  <Text style={{ fontSize: 48 }}>🤖</Text>
                </View>
              </Pressable>
            )}

            {/* ── Quick actions ── */}
            <HorizontalActionList title={t('common.quickActions')} />

            {/* ── Quick reset CTA ── */}
            <View
              style={[s.resetCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[s.resetTitle, { color: colors.text }]}>
                {t('common.needQuickReset')}
              </Text>
              <Text style={[s.resetBody, { color: colors.mutedText }]}>
                {t('common.tapForBreathing')}
              </Text>
              <Pressable
                onPress={() => router.push('/(tabs)/stress')}
                style={({ pressed }) => [
                  s.resetBtn,
                  {
                    backgroundColor: pressed ? colors.primary + '15' : colors.primary + '08',
                    borderColor: colors.primary + '25',
                  },
                ]}
              >
                <Text style={[s.resetBtnLabel, { color: colors.primary }]}>
                  {t('common.openStressToolkit')}
                </Text>
              </Pressable>
            </View>
          </View>
      </ScrollView>
    </View>
  );
}

/* ═══════════ Sub-components ═══════════ */

/* ── Score Ring with tick marks (compact version for home card) ── */
function HomeScoreRing({
  score,
  color,
  label,
  colors,
}: {
  score: number;
  color: string;
  label: string;
  colors: any;
}) {
  const size = 160;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const tickCount = 36;
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const angle = (i / tickCount) * 360 - 90;
    const rad = (angle * Math.PI) / 180;
    const outerR = radius + strokeWidth / 2 + 5;
    const innerR = radius + strokeWidth / 2 + 1;
    return {
      x1: size / 2 + Math.cos(rad) * innerR,
      y1: size / 2 + Math.sin(rad) * innerR,
      x2: size / 2 + Math.cos(rad) * outerR,
      y2: size / 2 + Math.sin(rad) * outerR,
      active: (i / tickCount) * 100 <= progress,
    };
  });

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size + 20,
          height: size + 20,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Svg width={size + 20} height={size + 20}>
          <Defs>
            <LinearGradient id="homeRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={color} stopOpacity="1" />
              <Stop offset="100%" stopColor={color} stopOpacity="0.6" />
            </LinearGradient>
          </Defs>

          {/* Tick marks */}
          {ticks.map((tick, i) => (
            <Line
              key={i}
              x1={tick.x1 + 10}
              y1={tick.y1 + 10}
              x2={tick.x2 + 10}
              y2={tick.y2 + 10}
              stroke={tick.active ? color : colors.border}
              strokeWidth={1.5}
              strokeLinecap="round"
              opacity={tick.active ? 0.6 : 0.25}
            />
          ))}

          {/* Background circle */}
          <Circle
            cx={(size + 20) / 2}
            cy={(size + 20) / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            opacity={0.1}
          />
          {/* Progress arc */}
          <Circle
            cx={(size + 20) / 2}
            cy={(size + 20) / 2}
            r={radius}
            stroke="url(#homeRingGrad)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${(size + 20) / 2}, ${(size + 20) / 2}`}
          />
        </Svg>

        {/* Center content */}
        <View style={{ position: 'absolute', alignItems: 'center' }}>
          <Text style={{ fontSize: 42, fontWeight: '900', color, letterSpacing: -2 }}>
            {score || '–'}
          </Text>
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: colors.mutedText,
              marginTop: -2,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
            }}
          >
            {label}
          </Text>
        </View>
      </View>
    </View>
  );
}

/* ── Metrics Card with Freud Score / Mood toggle ── */
function MetricsCard({
  colors,
  score,
  scoreColor,
  freudScore,
  freudDataLoading,
  moodCheckIns,
  t,
}: {
  colors: any;
  score: number;
  scoreColor: string;
  freudScore: any;
  freudDataLoading: boolean;
  moodCheckIns: MoodCheckIn[] | undefined;
  t: (k: string, opts?: any) => string;
}) {
  const [activeTab, setActiveTab] = useState<'freud' | 'mood'>('freud');
  const router = useRouter();

  /* Build last-14-days mood history for the mood bar chart */
  const moodBars = useMemo(() => {
    const moods = moodCheckIns ?? [];
    const last14 = moods.slice(0, 14).reverse();
    if (last14.length === 0) return [];
    return last14.map((m) => {
      const meta = MOOD_META[m.mood] ?? { color: SAGE, value: 3 };
      return { height: Math.max(0.06, meta.value / 5), color: meta.color };
    });
  }, [moodCheckIns]);

  const latestMood = moodCheckIns?.[0];
  const latestMoodMeta = latestMood ? MOOD_META[latestMood.mood] : null;

  return (
    <View style={[s.metricsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Tabs */}
      <View style={s.metricsTabRow}>
        <Pressable
          onPress={() => setActiveTab('freud')}
          style={activeTab === 'freud' ? [s.metricsTabPill, { borderColor: colors.text }] : undefined}
        >
          <Text
            style={[
              activeTab === 'freud' ? s.metricsTabActiveText : s.metricsTabText,
              { color: activeTab === 'freud' ? colors.text : colors.mutedText },
            ]}
          >
            Freud Score
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('mood')}
          style={activeTab === 'mood' ? [s.metricsTabPill, { borderColor: colors.text }] : undefined}
        >
          <Text
            style={[
              activeTab === 'mood' ? s.metricsTabActiveText : s.metricsTabText,
              { color: activeTab === 'mood' ? colors.text : colors.mutedText },
            ]}
          >
            Mood
          </Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() =>
            router.push(activeTab === 'freud' ? '/(tabs)/freud-score' : '/(tabs)/mood')
          }
        >
          <Text style={{ color: colors.mutedText, fontSize: 18 }}>⋮</Text>
        </Pressable>
      </View>

      {activeTab === 'freud' ? (
        <>
          {/* Big score ring with tick marks */}
          <Pressable onPress={() => router.push('/(tabs)/freud-score')}>
            <HomeScoreRing
              score={freudDataLoading ? 0 : score}
              color={scoreColor}
              label={
                freudDataLoading
                  ? t('freudScore.calculatingScore', { defaultValue: 'Calculating…' })
                  : (freudScore?.label ?? '')
              }
              colors={colors}
            />
          </Pressable>

          {/* Swipe for AI suggestions CTA */}
          <Pressable
            onPress={() => router.push('/(tabs)/freud-score/ai-suggestions' as any)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginTop: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 16,
              borderWidth: 1,
              backgroundColor: SAGE + '12',
              borderColor: SAGE + '25',
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <MaterialIcons name="auto-awesome" size={16} color={SAGE} />
            <Text style={{ fontSize: 13, color: SAGE, fontWeight: '700', flex: 1 }}>
              {t('freudScore.swipeForSuggestions', { defaultValue: 'Swipe for AI suggestions' })}
            </Text>
            <MaterialIcons name="chevron-right" size={18} color={SAGE} />
          </Pressable>
        </>
      ) : (
        <>
          {/* Mood display row */}
          <Pressable onPress={() => router.push('/(tabs)/mood')} style={s.scoreRow}>
            {latestMoodMeta ? (
              <>
                <View
                  style={[
                    s.scoreCircle,
                    { borderColor: latestMoodMeta.color },
                  ]}
                >
                  <View
                    style={[
                      s.scoreInner,
                      { backgroundColor: latestMoodMeta.color + '15' },
                    ]}
                  >
                    <Text style={{ fontSize: 28 }}>{latestMoodMeta.emoji}</Text>
                  </View>
                </View>
                <View style={{ marginLeft: 16, flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: '900',
                      color: latestMoodMeta.color,
                      marginBottom: 2,
                    }}
                  >
                    {latestMood!.mood}
                  </Text>
                  <Text style={[s.scoreLabel, { color: colors.mutedText }]}>
                    {t('home.currentMood', { defaultValue: 'Current Mood' })}
                  </Text>
                </View>
              </>
            ) : (
              <View style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}>
                <Text style={{ fontSize: 28, marginBottom: 6 }}>😶</Text>
                <Text style={[s.scoreLabel, { color: colors.mutedText }]}>
                  {t('home.noMoodYet', { defaultValue: 'No mood logged yet' })}
                </Text>
              </View>
            )}
          </Pressable>

          {/* Mood history bars */}
          {moodBars.length > 0 ? (
            <View style={s.chartRow}>
              {moodBars.map((bar, i) => (
                <View key={i} style={s.chartColWrap}>
                  <View
                    style={[
                      s.chartCol,
                      {
                        height: bar.height * 50,
                        backgroundColor:
                          i === moodBars.length - 1 ? bar.color : bar.color + '70',
                      },
                    ]}
                  />
                </View>
              ))}
            </View>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 8 }}>
              <Text style={{ color: colors.mutedText, fontSize: 12 }}>
                {t('home.logMoodToSee', { defaultValue: 'Log your mood to see trends' })}
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

function TrackerItem({
  icon,
  title,
  subtitle,
  colors,
  indicator,
  onPress,
}: {
  icon: any;
  title: string;
  subtitle: string;
  colors: any;
  indicator?: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.trackerRow, { opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={[s.trackerIcon, { backgroundColor: CREAM }]}>
        <MaterialIcons name={icon} size={20} color={BROWN} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={[s.trackerTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[s.trackerSub, { color: colors.mutedText }]}>{subtitle}</Text>
      </View>
      {indicator}
    </Pressable>
  );
}

function Divider({ color }: { color: string }) {
  return <View style={{ height: 1, backgroundColor: color, marginHorizontal: 16 }} />;
}

function MiniDots({ count, active, color }: { count: number; active: number; color: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i < active ? color : color + '25',
          }}
        />
      ))}
    </View>
  );
}

function StressBar({ level }: { level: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {Array.from({ length: 5 }, (_, i) => {
        let color = '#4AAD7A';
        if (i >= 3) color = '#E8985A';
        if (i >= 4) color = '#E85A5A';
        return (
          <View
            key={i}
            style={{
              width: 14,
              height: 5,
              borderRadius: 2.5,
              backgroundColor: i < level ? color : 'rgba(0,0,0,0.08)',
            }}
          />
        );
      })}
    </View>
  );
}

function MoodFlow({ moods }: { moods: string[] }) {
  if (moods.length === 0) {
    return (
      <View style={{ flexDirection: 'row', gap: 2 }}>
        {['😢', '😟', '😐', '😊', '😄'].map((m, i) => (
          <Text key={i} style={{ fontSize: 12, opacity: 0.25 }}>
            {m}
          </Text>
        ))}
      </View>
    );
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {moods.map((mood, i) => {
        const meta = MOOD_META[mood];
        return (
          <React.Fragment key={i}>
            {i > 0 && (
              <Text style={{ fontSize: 10, color: '#C4B8AC', fontWeight: '600' }}>→</Text>
            )}
            <View
              style={{
                backgroundColor: (meta?.color ?? '#999') + '20',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: meta?.color ?? '#999' }}>
                {mood}
              </Text>
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
}

/* ═══════════ Styles ═══════════ */

const s = StyleSheet.create({
  root: { flex: 1 },

  /* ── Top bar ── */
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  greenDot: { width: 8, height: 8, borderRadius: 4 },
  dateText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.2 },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E8985A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FAF8F5',
  },
  bellBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },

  /* ── Greeting ── */
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 14,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  greetingName: {
    fontSize: Platform.OS === 'ios' ? 22 : 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  badgeEmoji: { fontSize: 10, fontWeight: '700' },
  badgeLabel: { fontSize: 11, fontWeight: '700' },

  /* ── Search ── */
  searchBar: {
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchPlaceholder: { fontSize: 14, fontWeight: '500' },

  /* ── Content ── */
  content: { paddingHorizontal: 20 },

  /* ── Metrics card ── */
  metricsCard: {
    borderRadius: UI.radius.xxl,
    borderWidth: 1,
    padding: 18,
    marginBottom: 4,
  },
  metricsTabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  metricsTabPill: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  metricsTabActiveText: { fontSize: 14, fontWeight: '800' },
  metricsTabText: { fontSize: 14, fontWeight: '600' },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNum: { fontSize: 26, fontWeight: '900' },
  scoreLabel: { fontSize: 13, fontWeight: '500' },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 54,
    marginTop: 4,
  },
  chartColWrap: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  chartCol: { width: '100%', borderRadius: 3, minHeight: 4 },

  /* ── Section title ── */
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 22,
    marginBottom: 12,
    paddingHorizontal: 4,
  },

  /* ── Tracker ── */
  trackerCard: {
    borderRadius: UI.radius.xxl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  trackerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  trackerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackerTitle: { fontSize: 14, fontWeight: '700' },
  trackerSub: { fontSize: 12, marginTop: 1 },

  /* ── Chatbot ── */
  chatCard: {
    borderRadius: UI.radius.xxl,
    borderWidth: 1,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  chatDotsRow: { flexDirection: 'row', gap: 4, marginBottom: 10 },
  chatDot: { width: 8, height: 8, borderRadius: 4 },
  chatCount: { fontSize: 36, fontWeight: '900', lineHeight: 40 },
  chatLabel: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  chatPro: { fontSize: 12, fontWeight: '700' },
  chatProBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  chatRobot: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  /* ── Trial banner ── */
  trialBanner: {
    borderRadius: UI.radius.xl,
    padding: 18,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...UI.shadow.md,
  },
  trialTitle: { color: 'white', fontWeight: '900', fontSize: 16 },
  trialSub: { color: 'rgba(255,255,255,0.8)', marginTop: 4, fontSize: 13 },
  trialArrow: { color: 'white', fontSize: 22, fontWeight: '700', marginLeft: 10 },

  /* ── Reset CTA ── */
  resetCard: {
    borderRadius: UI.radius.xxl,
    padding: 20,
    marginTop: 24,
    borderWidth: 1,
    ...UI.shadow.sm,
  },
  resetTitle: { fontWeight: '800', fontSize: 16 },
  resetBody: { marginTop: 6, fontSize: 14, lineHeight: 20 },
  resetBtn: {
    marginTop: 14,
    borderWidth: 1.5,
    padding: 14,
    borderRadius: UI.radius.lg,
    alignItems: 'center',
  },
  resetBtnLabel: { fontWeight: '800', fontSize: 15 },
});
