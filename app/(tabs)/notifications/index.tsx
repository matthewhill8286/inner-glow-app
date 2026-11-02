import React, { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Glow, GlowField } from '@/components/glow/Glow';
import { Icon } from '@/components/icons/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Moon, StarField } from '@/components/sleep/NightSky';
import { useBottomSpace } from '@/components/navigation/TabBarContext';
import { useJournal } from '@/hooks/useJournal';
import { useSleep } from '@/hooks/useSleep';
import { useScoreDays } from '@/hooks/useScoreDays';
import { useNotificationStore, type AppNotification } from '@/lib/notificationStore';
import { feedLook, feedRoute, gridDot, groupFeed, journalMonth } from '@/lib/notification-feed';
import { clockFrom, formatDuration, isBestThisMonth, isRecent, lastNight } from '@/lib/sleep-home';
import { signed } from '@/lib/glow-score';
import { backTo } from '@/lib/navigation';

type Highlight = { key: string; value: string; caption: string; route: string; art: React.ReactNode; dark?: boolean };

/**
 * Notifications, "Your day, in light" (03 §3.1): highlight cards for the Glow score, journal days and
 * last night, then a timeline of updates grouped by day, with line icons, glow-coloured nodes and
 * action pills. Cards open the screen they are about. Opening the feed marks everything read. The
 * six full-screen moments (§3.3–3.8) are not built yet, so highlights open the matching screens.
 */
export default function NotificationsScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const bottom = useBottomSpace();
  const notifications = useNotificationStore((s) => s.notifications);
  const load = useNotificationStore((s) => s.load);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const clearAll = useNotificationStore((s) => s.clearAll);
  const { days } = useScoreDays();
  const { journalEntries } = useJournal();
  const { sleepEntries } = useSleep();
  const now = useMemo(() => new Date(), []);

  useEffect(() => {
    void load().then(() => markAllRead());
  }, [load, markAllRead]);

  const groups = useMemo(() => groupFeed(notifications, now), [notifications, now]);
  const todayCount = groups.find((g) => g.group === 'today')?.items.length ?? 0;

  const highlights = useMemo<Highlight[]>(() => {
    const out: Highlight[] = [];
    if (days[0]) {
      const delta = days[1] ? days[0].score - days[1].score : 0;
      out.push({
        key: 'score',
        value: delta ? t('notificationFeed.score', { delta: signed(delta) }) : t('notificationFeed.scoreValue', { score: days[0].score }),
        caption: t(delta > 0 ? 'notificationFeed.rising' : delta < 0 ? 'notificationFeed.dipping' : 'notificationFeed.steady'),
        route: '/(moments)/glow',
        art: <ScoreArt score={days[0].score} />,
      });
    }
    const journal = journalMonth(journalEntries, now);
    if (journal.written.size) {
      out.push({
        key: 'journal',
        value: `${journal.written.size}/${journal.days}`,
        caption: t('notificationFeed.journalDays'),
        route: '/(moments)/constellation',
        art: <JournalArt written={journal.written} days={journal.days} />,
      });
    }
    const night = lastNight(sleepEntries);
    if (night && isRecent(night)) {
      out.push({
        key: 'sleep',
        value: formatDuration(night.asleepMinutes),
        caption: t(isBestThisMonth(night, sleepEntries) ? 'notificationFeed.bestNight' : 'notificationFeed.lastNight'),
        route: '/(moments)/night',
        art: <SleepArt />,
        dark: true,
      });
    }
    return out;
  }, [days, journalEntries, sleepEntries, now, t]);

  const subtitle =
    highlights.length || todayCount
      ? t('notificationFeed.subtitle', {
          highlights: t('notificationFeed.highlights', { count: highlights.length }),
          updates: t('notificationFeed.updates', { count: todayCount }),
        })
      : t('notificationFeed.quiet');

  const time = (n: AppNotification, group: string) => {
    const d = new Date(n.createdAt);
    return group === 'earlier' ? d.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' }) : clockFrom(d.getHours(), d.getMinutes());
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <GlowField
        glows={[
          { color: palette.sky, opacity: 0.2, x: 180, y: 30, width: 240, blur: 90 },
          { color: palette.mustard, opacity: 0.25, x: -50, y: 0, width: 260, blur: 90 },
        ]}
      />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 7, paddingHorizontal: 24, paddingBottom: bottom }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <IconButton size={50} accessibilityLabel={t('common.back')} onPress={() => backTo(undefined, '/(tabs)/home')} />
          <IconButton
            size={50}
            variant="solid"
            icon="line/settings"
            iconSize={22}
            accessibilityLabel={t('notificationFeed.settings')}
            onPress={() => router.push('/(tabs)/profile/notifications')}
          />
        </View>
        <Text accessibilityRole="header" style={[Type.titleXl, { color: palette.plumDeep, marginTop: 21, letterSpacing: 0 }]}>
          {t('notificationFeed.title')}
        </Text>
        <Text style={[Type.bodyS, { color: palette.textMuted, marginTop: 4 }]}>{subtitle}</Text>

        {highlights.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -24, marginTop: 20 }} contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}>
            {highlights.map((h) => (
              <Pressable
                key={h.key}
                accessibilityRole="button"
                accessibilityLabel={`${h.value}, ${h.caption}`}
                onPress={() => router.push(h.route as never)}
                style={({ pressed }) => ({ width: 150, height: 180, borderRadius: 26, overflow: 'hidden', backgroundColor: h.dark ? palette.ink : palette.white, opacity: pressed ? 0.85 : 1 })}
              >
                {h.art}
                <View style={{ position: 'absolute', left: 16, top: 122, right: 12 }}>
                  <Text numberOfLines={1} style={[Type.headline, { color: h.dark ? palette.white : palette.plumDeep }]}>{h.value}</Text>
                  <Text numberOfLines={1} style={[Type.caption, { fontWeight: '500', color: h.dark ? 'rgba(255,255,255,0.60)' : palette.textMuted, marginTop: 4 }]}>
                    {h.caption}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {groups.length === 0 ? (
          <View style={{ marginTop: 28, backgroundColor: palette.white, borderRadius: 22, padding: 20, gap: 6 }}>
            <Text style={[Type.bodyMSemi, { color: palette.plumDeep }]}>{t('notificationFeed.emptyTitle')}</Text>
            <Text style={[Type.captionM, { lineHeight: 18, color: palette.textMuted }]}>{t('notificationFeed.emptyBody')}</Text>
          </View>
        ) : (
          groups.map((g) => (
            <View key={g.group} style={{ marginTop: 24 }}>
              <Text accessibilityRole="header" style={[Type.labelM, { letterSpacing: 0.72, color: palette.textSubtle }]}>
                {t(`notificationFeed.groups.${g.group}`).toUpperCase()}
              </Text>
              <View style={{ marginTop: 10 }}>
                {/* Timeline rail behind the nodes (03 §3.1). */}
                <View pointerEvents="none" style={{ position: 'absolute', left: 9, top: 8, bottom: 8, width: 2 }}>
                  <Svg width={2} height="100%">
                    <Defs>
                      <LinearGradient id={`rail-${g.group}`} x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={palette.mustard} stopOpacity={0.6} />
                        <Stop offset="1" stopColor={palette.border} stopOpacity={0.4} />
                      </LinearGradient>
                    </Defs>
                    <Rect x={0} y={0} width={2} height="100%" rx={1} fill={`url(#rail-${g.group})`} />
                  </Svg>
                </View>
                <View style={{ gap: 12 }}>
                  {g.items.map((n) => (
                    <UpdateRow key={n.id} item={n} time={time(n, g.group)} today={g.group === 'today'} />
                  ))}
                </View>
              </View>
            </View>
          ))
        )}

        {groups.length > 0 && (
          <Pressable accessibilityRole="button" onPress={clearAll} hitSlop={10} style={{ alignSelf: 'center', marginTop: 24, paddingVertical: 6 }}>
            <Text style={[Type.buttonS, { color: palette.lavender }]}>{t('notificationFeed.clearAll')}</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

function UpdateRow({ item, time, today }: { item: AppNotification; time: string; today: boolean }) {
  const { t } = useTranslation();
  const look = feedLook(item.type);
  const route = feedRoute(item);
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <View style={{ width: 20, alignItems: 'center', paddingTop: 14 }}>
        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: look.node, opacity: 0.35, position: 'absolute', top: 9 }} />
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: look.node }} />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${item.title}, ${time}, ${item.body}`}
        onPress={() => router.push(route as never)}
        style={({ pressed }) => ({
          flex: 1,
          borderRadius: 22,
          padding: 16,
          gap: 8,
          backgroundColor: today ? palette.white : 'transparent',
          borderWidth: today ? 0 : 1,
          borderColor: palette.border,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name={look.icon} size={18} color={palette.plum} />
          <Text numberOfLines={1} style={[Type.bodyMSemi, { flex: 1, color: palette.plumDeep }]}>{item.title}</Text>
          <Text style={[Type.micro, { color: palette.textSubtle }]}>{time}</Text>
        </View>
        <Text style={[Type.captionS, { lineHeight: 17, color: palette.textMuted }]}>{item.body}</Text>
        {look.action && (
          <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: palette.plum, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 }}>
            <Text style={[Type.labelM, { color: palette.white }]}>{t(`notificationFeed.actions.${look.action}`)}</Text>
            <Icon name="arrow/forward" size={14} color={palette.white} />
          </View>
        )}
      </Pressable>
    </View>
  );
}

/** Score highlight: a mustard glow, a light beam and the white core with the latest score. */
function ScoreArt({ score }: { score: number }) {
  return (
    <>
      <Glow color={palette.mustard} opacity={0.5} width={140} blur={30} style={{ position: 'absolute', left: 10, top: -20 }} />
      <Svg width={26} height={90} style={{ position: 'absolute', left: 62, top: 36 }}>
        <Defs>
          <LinearGradient id="scoreBeam" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.mustard} stopOpacity={0.9} />
            <Stop offset="1" stopColor={palette.mustard} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={26} height={90} rx={13} fill="url(#scoreBeam)" />
      </Svg>
      <View
        style={{
          position: 'absolute',
          left: 50,
          top: 22,
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: palette.white,
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0px 0px 16px 4px rgba(226,204,64,0.60)',
        }}
      >
        <Text style={[Type.titleSm, { color: palette.plumDeep }]}>{score}</Text>
      </View>
    </>
  );
}

/** Journal highlight: one dot per day of the month so far, written days glowing (03 §4.6). */
function JournalArt({ written, days }: { written: Set<number>; days: number }) {
  return (
    <>
      <Glow color={palette.sky} opacity={0.35} width={120} blur={30} style={{ position: 'absolute', left: 40, top: 10 }} />
      <Svg width={150} height={120} style={{ position: 'absolute' }}>
        {Array.from({ length: days }, (_, i) => {
          const p = gridDot(i + 1);
          return written.has(i + 1) ? (
            <React.Fragment key={i}>
              <Circle cx={p.x} cy={p.y} r={8} fill={palette.mustard} fillOpacity={0.3} />
              <Circle cx={p.x} cy={p.y} r={4} fill={palette.mustard} />
            </React.Fragment>
          ) : (
            <Circle key={i} cx={p.x} cy={p.y} r={3} stroke="#D6CCC0" strokeWidth={1} fill="none" />
          );
        })}
      </Svg>
    </>
  );
}

/** Sleep highlight: the night card with stars and the moon. */
function SleepArt() {
  return (
    <>
      <Glow color={palette.lavenderSoft} opacity={0.4} width={110} blur={30} style={{ position: 'absolute', left: 60, top: 0 }} />
      <StarField width={150} height={110} style={{ position: 'absolute' }} />
      <Moon size={44} style={{ position: 'absolute', left: 90, top: 22 }} />
    </>
  );
}
