import { communityNotificationTarget, isCommunityNotificationToday } from '@/lib/community-state';
import { AppButton } from '@/components/ui/AppButton';
import { toast } from '@/components/Toast';
import { CommunityHeader } from '@/components/community/CommunityHeader';
import { screenBottomPadding } from '@/lib/screen-layout';
import { communityStyles } from '@/components/community/styles';
import { Typography } from '@/constants/typography';
import { backTo } from '@/lib/navigation';
import { WellnessIconText } from '@/components/WellnessIconText';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors, UI } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from '@/components/AppIcon';
import { NOTIF_META, type CommunityNotification } from '@/lib/community';
import { useCommunityNotifications, useMarkNotifRead } from '@/hooks/useCommunity';

const getTabs = (t: any) =>
  [
    { key: 'today', label: t('communityNotifs.tabToday') },
    { key: 'last-week', label: t('communityFixes.earlier') },
  ] as const;

type TabKey = ReturnType<typeof getTabs>[number]['key'];

/* ── safe back navigation helper ────────────────── */
function goBack(from?: string) {
  backTo(from, '/(tabs)/community');
}

export default function CommunityNotifsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { from } = useLocalSearchParams<{ from?: string }>();
  const [activeTab, setActiveTab] = useState<TabKey>('today');
  const [search, setSearch] = useState('');
  const tabs = getTabs(t);

  const { data: allNotifs, isLoading, isError, refetch } = useCommunityNotifications();
  const markRead = useMarkNotifRead();

  /* split notifs by recency */
  const { todayNotifs, weekNotifs } = useMemo(() => {
    if (!allNotifs) return { todayNotifs: [], weekNotifs: [] };
    const today: CommunityNotification[] = [];
    const week: CommunityNotification[] = [];

    allNotifs.forEach((n) => {
      const isToday = isCommunityNotificationToday(n);
      if (isToday) today.push(n);
      else week.push(n);
    });

    return { todayNotifs: today, weekNotifs: week };
  }, [allNotifs]);

  const notifs = activeTab === 'today' ? todayNotifs : weekNotifs;
  const filtered = search
    ? notifs.filter(
        (n) =>
          n.description.toLowerCase().includes(search.toLowerCase()) ||
          n.user.toLowerCase().includes(search.toLowerCase()),
      )
    : notifs;

  const handleNotifPress = (notif: CommunityNotification) => {
    if (!notif.read) {
      markRead.mutate(notif.id, { onError: () => toast.error(t('communityFixes.actionFailed')) });
    }
    const target = communityNotificationTarget(notif);
    if (target) router.push(target);
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background, paddingTop: insets.top + 6 }]}>
      {/* ── Header ─────────────────────────────── */}
      <CommunityHeader
        title={t('communityNotifs.title')}
        subtitle={t('communityNotifs.subtitle')}
        onBack={() => goBack(from)}
      />

      {/* ── Tabs ───────────────────────────────── */}
      <View style={[s.tabBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab.key }}
            onPress={() => setActiveTab(tab.key)}
            style={[
              s.tab,
              activeTab === tab.key && [s.tabActive, { backgroundColor: colors.tint }],
            ]}
          >
            <Text style={[s.tabText, { color: activeTab === tab.key ? '#FFF' : colors.mutedText }]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── Search bar ─────────────────────────── */}
      <View style={[s.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
        <MaterialIcons name="search" size={18} color={colors.placeholder} />
        <TextInput
          style={[s.searchInput, { color: colors.text }]}
          placeholder={t('communityNotifs.searchPlaceholder')}
          placeholderTextColor={colors.placeholder}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            s.scrollContent,
            { paddingBottom: screenBottomPadding(insets.bottom) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {isError && (
            <AppButton
              variant="secondary"
              title={t('community.tryAgainButton')}
              onPress={() => {
                void refetch();
              }}
            />
          )}
          {!isError &&
            filtered.map((notif) => (
              <Pressable key={notif.id} onPress={() => handleNotifPress(notif)}>
                <NotifItem notif={notif} colors={colors} />
              </Pressable>
            ))}

          {!isError && filtered.length === 0 && (
            <View
              style={[s.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <WellnessIconText style={{ fontFamily: Typography.family.body, fontSize: 28 }}>
                🔕
              </WellnessIconText>
              <Text style={[s.emptyTitle, { color: colors.text }]}>
                {t('communityNotifs.emptyTitle')}
              </Text>
              <Text style={[s.emptySub, { color: colors.mutedText }]}>
                {activeTab === 'today'
                  ? t('communityNotifs.emptyTodayMessage')
                  : t('communityFixes.emptyEarlier')}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

/* ── Notification item ───────────────────────────── */
function NotifItem({ notif, colors }: { notif: CommunityNotification; colors: any }) {
  const meta = NOTIF_META[notif.type] ?? NOTIF_META.mention;

  return (
    <View
      style={[
        s.notifItem,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      {!notif.read && <View style={[s.unreadDot, { backgroundColor: meta.color }]} />}

      <View style={s.notifRow}>
        <View style={[s.notifIcon, { backgroundColor: meta.color + '15' }]}>
          <WellnessIconText style={{ fontFamily: Typography.family.body, fontSize: 16 }}>
            {meta.emoji}
          </WellnessIconText>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.notifDesc, { color: colors.text }]} numberOfLines={2}>
            {notif.description}
          </Text>
          {notif.user ? (
            <Text style={[s.notifUser, { color: colors.subtleText }]}>
              {notif.user} • {notif.time}
            </Text>
          ) : (
            <Text style={[s.notifUser, { color: colors.subtleText }]}>{notif.time}</Text>
          )}
        </View>
        {communityNotificationTarget(notif) && (
          <MaterialIcons name="chevron-right" size={20} color={colors.subtleText} />
        )}
      </View>

      {/* accent bar */}
      <View style={[s.accentBar, { backgroundColor: meta.color }]} />
    </View>
  );
}

/* ── Styles ──────────────────────────────────────── */
const s = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: UI.spacing.xl,
    paddingTop: 0,
  },

  /* tabs */
  tabBar: {
    flexDirection: 'row',
    borderRadius: UI.radius.lg,
    padding: 4,
    marginTop: 12,
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: UI.radius.md,
    alignItems: 'center',
  },
  tabActive: {},
  tabText: {
    fontFamily: Typography.family.body,
    fontSize: 14,
    fontWeight: Typography.weight.medium,
  },

  /* search */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: UI.radius.lg,
    borderWidth: 1,
    marginTop: 12,
  },
  searchInput: { fontFamily: Typography.family.body, flex: 1, fontSize: 14 },

  scrollContent: { paddingTop: 14, paddingBottom: 100, gap: 8 },

  /* notif item */
  notifItem: {
    borderRadius: UI.radius.xl,
    padding: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notifIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDesc: {
    fontFamily: Typography.family.body,
    fontSize: 14,
    fontWeight: Typography.weight.semibold,
    lineHeight: 20,
  },
  notifUser: {
    fontFamily: Typography.family.body,
    fontSize: 12,
    fontWeight: Typography.weight.semibold,
    marginTop: 2,
  },
  unreadDot: {
    position: 'absolute',
    top: 16,
    left: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    zIndex: 1,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: UI.radius.xl,
    borderBottomLeftRadius: UI.radius.xl,
  },

  /* empty */
  emptyCard: {
    ...{
      borderRadius: UI.radius.xxl,
      padding: 36,
      borderWidth: 1,
      alignItems: 'center',
      gap: 6,
      marginTop: 12,
    },
    ...communityStyles.emptyCard,
  },
  emptyTitle: { ...{ ...Typography.cardHeading }, ...communityStyles.emptyTitle },
  emptySub: {
    ...{ fontFamily: Typography.family.body, fontSize: 14, textAlign: 'center' },
    ...communityStyles.emptySub,
  },
});
