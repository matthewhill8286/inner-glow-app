import { WellbeingScoreCard } from '@/components/WellbeingScoreCard';
import { screenBottomPadding } from '@/lib/screen-layout';
import { openConversations } from '@/lib/navigation';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import { Typography } from '@/constants/typography';
import { WellnessIconText } from '@/components/WellnessIconText';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import MaterialIcons from '@/components/AppIcon';
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
  const { profile, isLoading: profileLoading } = useProfile({ lazy: true });
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const queryClient = useQueryClient();

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      // Refresh all tracking data so Freud Score and stats are up to date
      queryClient.invalidateQueries({ queryKey: queryKeys.mood.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.sleep.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.mindfulness.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stress.allHistory });
    }, [queryClient]),
  );

  const { moodCheckIns, isLoading: moodLoading } = useMood();
  const { journalEntries, isLoading: journalLoading } = useJournal();
  const { currentScore: freudScore, isDataLoading: freudDataLoading } = useFreudScore({
    lazy: true,
  });
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
    if (sleepAvgHrs === 0) return t('home.sleepNoData');
    const hours = sleepAvgHrs.toFixed(0);
    if (sleepAvgHrs >= 7) return t('home.sleepHealthy', { hours });
    if (sleepAvgHrs >= 5) return t('home.sleepFair', { hours });
    return t('home.sleepInsomniac', { hours });
  }, [sleepAvgHrs, t]);
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
    if (latestStress <= 2) return t('home.stressLow', { level: latestStress });
    if (latestStress <= 5) return t('home.stressNormal', { level: latestStress });
    if (latestStress <= 7) return t('home.stressHigh', { level: latestStress });
    return t('home.stressVeryHigh', { level: latestStress });
  }, [latestStress, t]);

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
        contentContainerStyle={{ paddingBottom: screenBottomPadding(insets.bottom) }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top bar: date + notification bell ── */}
        <View style={s.topBar}>
          <View style={s.dateRow}>
            <View style={[s.greenDot, { backgroundColor: SAGE }]} />
            <Text style={[s.dateText, { color: colors.mutedText }]}>{dateStr}</Text>
          </View>
          <Pressable
            onPress={() =>
              router.navigate({
                pathname: '/(tabs)/notifications',
                params: { from: '/(tabs)/home' },
              })
            }
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
            <WellnessIconText style={s.avatarText}>
              {userName ? userName.charAt(0).toUpperCase() : '😊'}
            </WellnessIconText>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.greetingName, { color: colors.text }]}>
              Hi, {userName || t('tabs.home')}!
            </Text>
            <View style={s.badgeRow}>
              {hasFullAccess && (
                <View style={[s.badge, { backgroundColor: SAGE + '18' }]}>
                  <WellnessIconText style={[s.badgeEmoji, { color: SAGE }]}>★</WellnessIconText>
                  <Text style={[s.badgeLabel, { color: SAGE }]}>
                    {isTrialActive ? `Trial · ${trialDaysLeft}d left` : 'Pro'}
                  </Text>
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
            {t('home.searchPlaceholder')}
          </Text>
          <MaterialIcons name="search" size={18} color={colors.icon} />
        </Pressable>

        <View style={s.content}>
          <WellbeingScoreCard
            score={score}
            label={freudScore?.label ?? ''}
            loading={
              freudDataLoading || moodLoading || sleepLoading || journalLoading || profileLoading
            }
            hasRecords={
              !!(
                moodCheckIns?.length ||
                sleepEntries?.length ||
                journalEntries?.length ||
                mindfulnessHistory?.length
              )
            }
          />
          {/* ── Quick actions ── */}
          <HorizontalActionList title={t('common.quickActions')} />

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

          <AppCard style={{ marginTop: 20 }}>
            <Text accessibilityRole="header" style={[Typography.section, { color: colors.text }]}>
              For today
            </Text>
            <Text style={[Typography.body, { color: colors.mutedText }]}>
              Start with a small check-in, or pick up where you left off.
            </Text>
            <AppButton
              title="Check in with your mood"
              onPress={() => router.push('/(tabs)/mood/check-in')}
            />
            <AppButton
              title="Continue a conversation"
              variant="secondary"
              onPress={openConversations}
            />
            <AppButton
              title="Explore suggested activities"
              variant="secondary"
              onPress={() => router.push('/(tabs)/freud-score/ai-suggestions')}
            />
          </AppCard>
          {/* ── Mindful Tracker ── */}
          <Text style={[s.sectionTitle, { color: colors.text }]}>{t('home.mindfulTracker')}</Text>

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
                title={t('home.mindfulHours')}
                subtitle={t('home.mindfulHoursSubtitle', {
                  current: mindfulTodayHrs,
                  goal: mindfulGoalHrs,
                })}
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
                title={t('home.sleepQuality')}
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
                title={t('home.mindfulJournal')}
                subtitle={
                  journalStreak > 0
                    ? t('home.journalDayStreak', { count: journalStreak })
                    : t('home.journalThisWeek', { count: journalThisWeek })
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
                title={t('home.stressLevel')}
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
                title={t('home.moodTracker')}
                subtitle={
                  moodCount > 0
                    ? t('home.moodCheckIns', { count: moodCount })
                    : t('home.moodNoData')
                }
                colors={colors}
                onPress={() => router.push('/(tabs)/mood')}
                indicator={<MoodFlow moods={last3Moods} />}
              />
            )}
          </View>

          <AppCard style={{ marginTop: 20 }}>
            <Text style={[Typography.section, { color: colors.text }]}>
              {t('community.headerTitle')}
            </Text>
            <Text style={[Typography.body, { color: colors.mutedText }]}>
              {t('community.entryDescription')}
            </Text>
            <AppButton
              title={t('community.entryButton')}
              variant="secondary"
              onPress={() => router.navigate('/(tabs)/community')}
            />
          </AppCard>
        </View>
      </ScrollView>
    </View>
  );
}

/* ═══════════ Sub-components ═══════════ */

/* ── Score Ring with tick marks (compact version for home card) ── */
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
          <WellnessIconText
            key={i}
            style={{ fontFamily: Typography.family.body, fontSize: 12, opacity: 0.25 }}
          >
            {m}
          </WellnessIconText>
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
              <Text
                style={{
                  fontFamily: Typography.family.body,
                  fontSize: 10,
                  color: '#C4B8AC',
                  fontWeight: Typography.weight.semibold,
                }}
              >
                →
              </Text>
            )}
            <View
              style={{
                backgroundColor: (meta?.color ?? '#999') + '20',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  fontFamily: Typography.family.body,
                  fontSize: 11,
                  fontWeight: Typography.weight.semibold,
                  color: meta?.color ?? '#999',
                }}
              >
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
  dateText: {
    fontFamily: Typography.family.body,
    fontSize: 12,
    fontWeight: Typography.weight.semibold,
    letterSpacing: 0.2,
  },
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
    fontFamily: Typography.family.body,
    color: '#fff',
    fontSize: 10,
    fontWeight: Typography.weight.medium,
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
  avatarText: {
    fontFamily: Typography.family.body,
    color: '#FFF',
    fontSize: 20,
    fontWeight: Typography.weight.semibold,
  },
  greetingName: { ...Typography.heading, fontSize: 20, marginBottom: 4 },
  badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  badgeEmoji: {
    fontFamily: Typography.family.body,
    fontSize: 10,
    fontWeight: Typography.weight.medium,
  },
  badgeLabel: {
    fontFamily: Typography.family.body,
    fontSize: 11,
    fontWeight: Typography.weight.medium,
  },

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
  searchPlaceholder: {
    fontFamily: Typography.family.body,
    fontSize: 14,
    fontWeight: Typography.weight.medium,
  },

  /* ── Content ── */
  content: { paddingHorizontal: 20 },

  /* ── Section title ── */
  sectionTitle: {
    ...Typography.section,
    fontSize: 20,
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
  trackerTitle: {
    fontFamily: Typography.family.body,
    fontSize: 14,
    fontWeight: Typography.weight.semibold,
  },
  trackerSub: { fontFamily: Typography.family.body, fontSize: 12, marginTop: 1 },

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
  trialTitle: {
    ...Typography.section,
    color: 'white',
    fontWeight: Typography.weight.regular,
    fontSize: 20,
  },
  trialSub: {
    fontFamily: Typography.family.body,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    fontSize: 13,
  },
  trialArrow: {
    fontFamily: Typography.family.body,
    color: 'white',
    fontSize: 22,
    fontWeight: Typography.weight.semibold,
    marginLeft: 10,
  },
});
