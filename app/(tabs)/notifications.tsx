import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, Switch, ScrollView, Platform, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors, UI } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { scheduleNotification } from '@/lib/notifications';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  useNotificationStore,
  NOTIF_TYPE_META,
  timeAgo,
  type AppNotification,
} from '@/lib/notificationStore';

/* ── notification settings config ────────────────── */
type NotifSetting = {
  key: string;
  title: string;
  subtitle: string;
  emoji: string;
  tint: string;
  enabled: boolean;
};

const DEFAULT_SETTINGS: NotifSetting[] = [
  {
    key: 'daily_checkin',
    title: 'Daily Check-in',
    subtitle: 'A gentle prompt to reflect once per day.',
    emoji: '🧘',
    tint: '#5B8A5A',
    enabled: true,
  },
  {
    key: 'journal_reminder',
    title: 'Journal Reminder',
    subtitle: 'Nudge to write when you haven\u2019t in a while.',
    emoji: '📖',
    tint: '#E8985A',
    enabled: true,
  },
  {
    key: 'sleep_winddown',
    title: 'Sleep Wind-down',
    subtitle: 'Relax reminder before your target bedtime.',
    emoji: '🌙',
    tint: '#7E57C2',
    enabled: false,
  },
  {
    key: 'mindful_breaks',
    title: 'Mindful Breaks',
    subtitle: 'Short reminders to pause and breathe.',
    emoji: '🌬️',
    tint: '#42A5F5',
    enabled: false,
  },
  {
    key: 'stress_alert',
    title: 'Stress Check',
    subtitle: 'Prompt when stress patterns are detected.',
    emoji: '🔥',
    tint: '#C45B5B',
    enabled: true,
  },
  {
    key: 'weekly_summary',
    title: 'Weekly Summary',
    subtitle: 'A snapshot of your week and trends.',
    emoji: '📊',
    tint: '#8B6B47',
    enabled: true,
  },
];

const BROWN = '#8B6B47';

/* ── Screen ──────────────────────────────────────── */

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();

  const [settings, setSettings] = useState<NotifSetting[]>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<'recent' | 'settings'>('recent');
  const [hasPermission, setHasPermission] = useState(false);

  // Notification store
  const notifications = useNotificationStore((s) => s.notifications);
  const loadNotifs = useNotificationStore((s) => s.load);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const clearAll = useNotificationStore((s) => s.clearAll);

  useEffect(() => {
    loadNotifs();
  }, [loadNotifs]);

  const enabledCount = useMemo(() => settings.filter((i) => i.enabled).length, [settings]);
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  useEffect(() => {
    (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const toggleNotification = async (key: string, value: boolean) => {
    if (value && !hasPermission) {
      const { status } = await Notifications.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status !== 'granted') return;
    }
    setSettings((prev) => prev.map((x) => (x.key === key ? { ...x, enabled: value } : x)));
  };

  const testNotification = async () => {
    await scheduleNotification(
      'Mind Matters',
      'This is a test notification to verify your settings!',
      { type: 'test', key: 'daily_checkin' },
    );
  };

  // Group notifications by time period
  const { today, yesterday, older } = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;

    const todayList: AppNotification[] = [];
    const yesterdayList: AppNotification[] = [];
    const olderList: AppNotification[] = [];

    for (const n of notifications) {
      const ts = new Date(n.createdAt).getTime();
      if (ts >= todayStart) todayList.push(n);
      else if (ts >= yesterdayStart) yesterdayList.push(n);
      else olderList.push(n);
    }

    return { today: todayList, yesterday: yesterdayList, older: olderList };
  }, [notifications]);

  return (
    <View style={[s.container, { backgroundColor: colors.background, paddingTop: insets.top + 8 }]}>
      {/* ── Header ── */}
      <View style={s.header}>
        <Pressable
          onPress={() => router.back()}
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
          <View style={s.titleRow}>
            <Text style={[s.headerTitle, { color: colors.text }]}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={s.unreadBadge}>
                <Text style={s.unreadText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <Text style={[s.headerSub, { color: colors.mutedText }]}>
            Stay mindful, on your terms.
          </Text>
        </View>
        {/* Mark all / clear */}
        {notifications.length > 0 && activeTab === 'recent' && (
          <Pressable
            onPress={unreadCount > 0 ? markAllRead : clearAll}
            style={({ pressed }) => [
              s.headerAction,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <MaterialIcons
              name={unreadCount > 0 ? 'done-all' : 'delete-outline'}
              size={16}
              color={colors.mutedText}
            />
          </Pressable>
        )}
      </View>

      {/* ── Tab switcher ── */}
      <View style={[s.tabBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {(['recent', 'settings'] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[s.tab, activeTab === tab && [s.tabActive, { backgroundColor: BROWN }]]}
          >
            <Text style={[s.tabText, { color: activeTab === tab ? '#FFF' : colors.mutedText }]}>
              {tab === 'recent' ? '🔔  Recent' : '⚙️  Settings'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'recent' ? (
          <>
            {notifications.length === 0 ? (
              /* ── Empty state ── */
              <View
                style={[s.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[s.emptyIconWrap, { backgroundColor: BROWN + '12' }]}>
                  <Text style={{ fontSize: 36 }}>🔕</Text>
                </View>
                <Text style={[s.emptyTitle, { color: colors.text }]}>All caught up!</Text>
                <Text style={[s.emptySub, { color: colors.mutedText }]}>
                  Notifications will appear here when you log mood, sleep, journal entries, or
                  complete activities.
                </Text>
              </View>
            ) : (
              <>
                {/* Today */}
                {today.length > 0 && (
                  <>
                    <Text style={[s.groupLabel, { color: colors.mutedText }]}>Today</Text>
                    <View style={{ gap: 8 }}>
                      {today.map((notif) => (
                        <NotifCard key={notif.id} notif={notif} colors={colors} onRead={markRead} />
                      ))}
                    </View>
                  </>
                )}

                {/* Yesterday */}
                {yesterday.length > 0 && (
                  <>
                    <Text style={[s.groupLabel, { color: colors.mutedText, marginTop: 20 }]}>
                      Yesterday
                    </Text>
                    <View style={{ gap: 8 }}>
                      {yesterday.map((notif) => (
                        <NotifCard key={notif.id} notif={notif} colors={colors} onRead={markRead} />
                      ))}
                    </View>
                  </>
                )}

                {/* Older */}
                {older.length > 0 && (
                  <>
                    <Text style={[s.groupLabel, { color: colors.mutedText, marginTop: 20 }]}>
                      Earlier
                    </Text>
                    <View style={{ gap: 8 }}>
                      {older.map((notif) => (
                        <NotifCard key={notif.id} notif={notif} colors={colors} onRead={markRead} />
                      ))}
                    </View>
                  </>
                )}
              </>
            )}
          </>
        ) : (
          /* ═══ SETTINGS TAB ═══════════════════════ */
          <>
            {/* summary card */}
            <View style={[s.summaryCard, { backgroundColor: BROWN }]}>
              <View style={s.summaryTop}>
                <View style={s.summaryIconWrap}>
                  <Text style={{ fontSize: 24 }}>🔔</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.summaryTitle}>
                    {enabledCount} of {settings.length} active
                  </Text>
                  <Text style={s.summarySub}>We only send what you opt in to.</Text>
                </View>
              </View>

              <View style={s.summaryDivider} />
              <View style={s.permRow}>
                <View
                  style={[s.permDot, { backgroundColor: hasPermission ? '#7EAD7E' : '#C45B5B' }]}
                />
                <Text style={s.permText}>
                  {hasPermission
                    ? 'Notifications permitted'
                    : 'Notifications not allowed — enable in Settings'}
                </Text>
              </View>
            </View>

            {/* notification toggles */}
            <View
              style={[s.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              {settings.map((item, idx) => (
                <View
                  key={item.key}
                  style={[
                    s.settingRow,
                    {
                      borderBottomWidth: idx < settings.length - 1 ? 1 : 0,
                      borderBottomColor: colors.divider,
                    },
                  ]}
                >
                  <View style={[s.settingIconWrap, { backgroundColor: item.tint + '15' }]}>
                    <Text style={{ fontSize: 18 }}>{item.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.settingTitle, { color: colors.text }]}>{item.title}</Text>
                    <Text style={[s.settingSub, { color: colors.mutedText }]}>{item.subtitle}</Text>
                  </View>
                  <Switch
                    value={item.enabled}
                    onValueChange={(v) => toggleNotification(item.key, v)}
                    trackColor={{
                      false: theme === 'light' ? '#E0DCD6' : '#3A3A3A',
                      true: item.tint,
                    }}
                    thumbColor="#FFF"
                  />
                </View>
              ))}
            </View>

            {/* test button */}
            <Pressable
              onPress={testNotification}
              style={({ pressed }) => [s.testBtn, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
            >
              <MaterialIcons name="notifications-active" size={18} color="#FFF" />
              <Text style={s.testBtnText}>Send Test Notification</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

/* ── Notification card component ─────────────────── */
function NotifCard({
  notif,
  colors,
  onRead,
}: {
  notif: AppNotification;
  colors: any;
  onRead: (id: string) => void;
}) {
  const meta = NOTIF_TYPE_META[notif.type] || { emoji: '📩', color: '#8B6B47', label: 'Other' };

  const handlePress = () => {
    if (!notif.read) onRead(notif.id);
    // Navigate to notification detail
    router.push({
      pathname: '/(tabs)/notification-detail',
      params: {
        type: notif.type,
        title: notif.title,
        body: notif.body,
        time: timeAgo(notif.createdAt),
        from: '/(tabs)/notifications',
      },
    });
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        s.notifCard,
        {
          backgroundColor: notif.read ? colors.card : meta.color + '08',
          borderColor: notif.read ? colors.border : meta.color + '20',
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      {/* Colored accent bar */}
      <View style={[s.notifAccent, { backgroundColor: meta.color }]} />

      <View style={s.notifRow}>
        <View style={[s.notifIconWrap, { backgroundColor: meta.color + '15' }]}>
          <Text style={{ fontSize: 18 }}>{notif.emoji}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <View style={s.notifTitleRow}>
            <Text
              style={[s.notifTitle, { color: colors.text }, !notif.read && { fontWeight: '900' }]}
              numberOfLines={1}
            >
              {notif.title}
            </Text>
            <Text style={[s.notifTime, { color: colors.subtleText }]}>
              {timeAgo(notif.createdAt)}
            </Text>
          </View>
          <Text style={[s.notifBody, { color: colors.mutedText }]} numberOfLines={2}>
            {notif.body}
          </Text>

          {/* Type label + unread indicator */}
          <View style={s.notifMeta}>
            <View style={[s.notifTypeTag, { backgroundColor: meta.color + '12' }]}>
              <Text style={{ color: meta.color, fontSize: 10, fontWeight: '700' }}>
                {meta.label}
              </Text>
            </View>
            {!notif.read && <View style={[s.unreadDot, { backgroundColor: meta.color }]} />}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

/* ── Styles ──────────────────────────────────────── */
const s = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: UI.spacing.xl,
  },

  /* header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
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
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 22, fontWeight: '900' },
  headerSub: { fontSize: 14, marginTop: 2 },
  headerAction: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  unreadBadge: {
    backgroundColor: '#E8985A',
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: { color: '#FFF', fontSize: 12, fontWeight: '800' },

  /* tab bar */
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

  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100,
  },

  /* group label */
  groupLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },

  /* notification card */
  notifCard: {
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    overflow: 'hidden',
    ...UI.shadow.sm,
  },
  notifRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  notifIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  notifTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  notifTitle: { fontSize: 14, fontWeight: '700', flex: 1 },
  notifTime: { fontSize: 11, fontWeight: '600' },
  notifBody: { fontSize: 13, lineHeight: 19, marginTop: 3 },
  notifMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  notifTypeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  notifAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },

  /* empty state */
  emptyCard: {
    borderRadius: UI.radius.xxl,
    padding: 36,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    ...UI.shadow.sm,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },

  /* summary card (settings hero) */
  summaryCard: {
    borderRadius: UI.radius.xxl,
    padding: 20,
    ...UI.shadow.md,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  summaryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: { color: '#FFF', fontSize: 17, fontWeight: '900' },
  summarySub: { color: 'rgba(255,255,255,0.70)', fontSize: 13, marginTop: 2 },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginVertical: 14,
  },
  permRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  permDot: { width: 8, height: 8, borderRadius: 4 },
  permText: { color: 'rgba(255,255,255,0.80)', fontSize: 13, fontWeight: '600' },

  /* settings card */
  settingsCard: {
    borderRadius: UI.radius.xxl,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 14,
    ...UI.shadow.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: { fontSize: 15, fontWeight: '700' },
  settingSub: { fontSize: 12, marginTop: 2 },

  /* test button */
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    backgroundColor: '#5B8A5A',
    paddingVertical: 15,
    borderRadius: UI.radius.lg,
    ...UI.shadow.sm,
  },
  testBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});
