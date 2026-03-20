import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors, UI } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { NOTIF_META, type CommunityNotification } from '@/lib/community';
import { useCommunityNotifications, useMarkNotifRead } from '@/hooks/useCommunity';

const getTabs = (t: any) =>
  [
    { key: 'today', label: t('communityNotifs.tabToday') },
    { key: 'last-week', label: t('communityNotifs.tabLastWeek') },
  ] as const;

type TabKey = ReturnType<typeof getTabs>[number]['key'];

/* ── safe back navigation helper ────────────────── */
function goBack(from?: string) {
  if (from) {
    router.replace(from as any);
  } else {
    router.back();
  }
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

  const { data: allNotifs, isLoading } = useCommunityNotifications();
  const markRead = useMarkNotifRead();

  /* split notifs by recency */
  const { todayNotifs, weekNotifs } = useMemo(() => {
    if (!allNotifs) return { todayNotifs: [], weekNotifs: [] };
    const now = Date.now();
    const dayMs = 86400000;
    const today: CommunityNotification[] = [];
    const week: CommunityNotification[] = [];

    allNotifs.forEach((n) => {
      // "time" is a formatted string like "2h ago", "3d ago", etc.
      // Use the string content to determine bucket
      const t = n.time;
      const isToday = t.includes('just now') || t.includes('m ago') || t.includes('h ago');
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
      markRead.mutate(notif.id);
    }
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background, paddingTop: insets.top + 6 }]}>
      {/* ── Header ─────────────────────────────── */}
      <View style={[s.header, { marginTop: insets.top + 14 }]}>
        <Pressable
          onPress={() => goBack(from)}
          style={({ pressed }) => [
            s.backBtn,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <MaterialIcons
            name={Platform.OS === 'ios' ? 'arrow-back-ios-new' : 'arrow-back'}
            size={18}
            color={colors.text}
          />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, { color: colors.text }]}>{t('communityNotifs.title')}</Text>
          <Text style={[s.headerSub, { color: colors.mutedText }]}>
            {t('communityNotifs.subtitle')}
          </Text>
        </View>
      </View>

      {/* ── Tabs ───────────────────────────────── */}
      <View style={[s.tabBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[s.tab, activeTab === tab.key && [s.tabActive, { backgroundColor: '#8B6B47' }]]}
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
          <ActivityIndicator size="large" color="#8B6B47" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {filtered.map((notif) => (
            <Pressable key={notif.id} onPress={() => handleNotifPress(notif)}>
              <NotifItem notif={notif} colors={colors} />
            </Pressable>
          ))}

          {filtered.length === 0 && (
            <View
              style={[s.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={{ fontSize: 28 }}>🔕</Text>
              <Text style={[s.emptyTitle, { color: colors.text }]}>
                {t('communityNotifs.emptyTitle')}
              </Text>
              <Text style={[s.emptySub, { color: colors.mutedText }]}>
                {activeTab === 'today'
                  ? t('communityNotifs.emptyTodayMessage')
                  : t('communityNotifs.emptyWeekMessage')}
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
  const meta = NOTIF_META[notif.type];

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
          <Text style={{ fontSize: 16 }}>{meta.emoji}</Text>
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
        <MaterialIcons name="chevron-right" size={20} color={colors.subtleText} />
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 20,
    marginBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: '900' },
  headerSub: { fontSize: 14, marginTop: 2 },

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
    paddingVertical: 10,
    borderRadius: UI.radius.md,
    alignItems: 'center',
  },
  tabActive: {},
  tabText: { fontSize: 14, fontWeight: '800' },

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
  searchInput: { flex: 1, fontSize: 14 },

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
  notifDesc: { fontSize: 14, fontWeight: '700', lineHeight: 20 },
  notifUser: { fontSize: 12, fontWeight: '600', marginTop: 2 },
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
    borderRadius: UI.radius.xxl,
    padding: 36,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptySub: { fontSize: 14, textAlign: 'center' },
});
