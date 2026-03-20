import React from 'react';
import { View, Text, Pressable, ScrollView, Platform, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { NOTIF_TYPE_META, type NotificationType } from '@/lib/notificationStore';

const { width: SCREEN_W } = Dimensions.get('window');

/* ── Per-type detail config (keyed by NotificationType) ─────── */
type NotifDetailConfig = {
  heroEmoji: string;
  heroColor: string;
  ctaLabel: string;
  ctaRoute: string;
  reactions?: string[];
};

const DETAIL_CONFIGS: Record<NotificationType, NotifDetailConfig> = {
  mood_logged: {
    heroEmoji: '😊',
    heroColor: '#5AAF8B',
    ctaLabel: 'View Mood History',
    ctaRoute: '/(tabs)/mood',
    reactions: ['😊', '🌟', '💚'],
  },
  sleep_logged: {
    heroEmoji: '😴',
    heroColor: '#7E57C2',
    ctaLabel: 'View Sleep Data',
    ctaRoute: '/(tabs)/sleep',
  },
  journal_entry: {
    heroEmoji: '📖',
    heroColor: '#E8985A',
    ctaLabel: 'Open Journal',
    ctaRoute: '/(tabs)/journal',
  },
  suggestion_completed: {
    heroEmoji: '🎉',
    heroColor: '#5AAF8B',
    ctaLabel: 'See Suggestions',
    ctaRoute: '/(tabs)/freud-score/ai-suggestions',
    reactions: ['🎉', '🌟', '💚'],
  },
  stress_exercise: {
    heroEmoji: '🌬️',
    heroColor: '#42A5F5',
    ctaLabel: 'Stress Toolkit',
    ctaRoute: '/(tabs)/stress',
  },
  mindfulness_session: {
    heroEmoji: '🧘',
    heroColor: '#5B8A5A',
    ctaLabel: 'Mindfulness Hub',
    ctaRoute: '/(tabs)/mindful',
    reactions: ['🧘', '✨', '💚'],
  },
  score_improved: {
    heroEmoji: '📈',
    heroColor: '#5AAF8B',
    ctaLabel: 'See Freud Score',
    ctaRoute: '/(tabs)/freud-score',
    reactions: ['🎉', '🌟', '💚'],
  },
  score_declined: {
    heroEmoji: '📉',
    heroColor: '#E8985A',
    ctaLabel: 'See Freud Score',
    ctaRoute: '/(tabs)/freud-score',
  },
  streak_milestone: {
    heroEmoji: '🔥',
    heroColor: '#FF9800',
    ctaLabel: 'Keep Going!',
    ctaRoute: '/(tabs)/freud-score',
    reactions: ['🔥', '🎉', '💪'],
  },
  weekly_summary: {
    heroEmoji: '📊',
    heroColor: '#8B6B47',
    ctaLabel: 'View Summary',
    ctaRoute: '/(tabs)/freud-score',
  },
  new_suggestions: {
    heroEmoji: '✨',
    heroColor: '#7E57C2',
    ctaLabel: 'View Suggestions',
    ctaRoute: '/(tabs)/freud-score/ai-suggestions',
    reactions: ['✨', '🧠', '💜'],
  },
  welcome: {
    heroEmoji: '👋',
    heroColor: '#5B8A5A',
    ctaLabel: 'Get Started',
    ctaRoute: '/(tabs)/home',
  },
};

const FALLBACK_CONFIG: NotifDetailConfig = {
  heroEmoji: '📩',
  heroColor: '#8B6B47',
  ctaLabel: 'Go Back',
  ctaRoute: '/(tabs)/notifications',
};

/* ── safe back navigation helper ────────────────── */
function goBackHelper(routerRef: any, from?: string) {
  if (from) {
    routerRef.replace(from as any);
  } else {
    routerRef.back();
  }
}

export default function NotificationDetail() {
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    type: string;
    title: string;
    body: string;
    time: string;
    from?: string;
  }>();

  const notifType = (params.type || '') as NotificationType;
  const config = DETAIL_CONFIGS[notifType] || FALLBACK_CONFIG;
  const meta = NOTIF_TYPE_META[notifType] || { emoji: '📩', color: '#8B6B47', label: 'Notification' };

  const displayTitle = params.title || 'Notification';
  const displayBody = params.body || 'You have a new notification.';
  const heroColor = config.heroColor;
  const accentColor = meta.color;

  return (
    <View style={[s.container, { backgroundColor: colors.background, paddingTop: insets.top + 6 }]}>
      {/* ── Header ────────────────────────────────── */}
      <View style={s.header}>
        <Pressable
          onPress={() => goBackHelper(router, params.from)}
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
            <Text style={[s.headerTitle, { color: colors.text }]}>Notification</Text>
            <View style={[s.typeBadge, { backgroundColor: accentColor + '18' }]}>
              <Text style={{ fontSize: 11 }}>{meta.emoji}</Text>
              <Text style={{ color: accentColor, fontSize: 11, fontWeight: '800' }}>
                {meta.label}
              </Text>
            </View>
          </View>
          <Text style={[s.headerSub, { color: colors.mutedText }]}>
            {params.time || 'Just now'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Hero illustration area ──────────────── */}
        <View style={[s.heroCard, { backgroundColor: heroColor }]}>
          {/* decorative circles */}
          <View style={[s.heroCircle1, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
          <View style={[s.heroCircle2, { backgroundColor: 'rgba(255,255,255,0.06)' }]} />
          <View style={[s.heroCircle3, { backgroundColor: 'rgba(255,255,255,0.04)' }]} />

          {/* main emoji */}
          <View style={s.heroEmojiWrap}>
            <Text style={s.heroEmoji}>{config.heroEmoji}</Text>
          </View>

          {/* subtle label */}
          <View style={s.heroLabelWrap}>
            <Text style={s.heroLabel} numberOfLines={1}>
              {displayTitle}
            </Text>
          </View>
        </View>

        {/* ── Main content card ───────────────────── */}
        <View style={[s.contentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Type icon + label header */}
          <View style={[s.contentTypePill, { backgroundColor: accentColor + '12' }]}>
            <Text style={{ fontSize: 14 }}>{meta.emoji}</Text>
            <Text style={{ color: accentColor, fontSize: 13, fontWeight: '800' }}>{meta.label}</Text>
          </View>

          {/* Title */}
          <Text style={[s.contentTitle, { color: colors.text }]}>{displayTitle}</Text>

          {/* description */}
          <Text style={[s.description, { color: colors.mutedText }]}>{displayBody}</Text>

          {/* reactions */}
          {config.reactions && (
            <View style={s.reactionsRow}>
              {config.reactions.map((emoji, i) => (
                <Pressable
                  key={i}
                  style={({ pressed }) => [
                    s.reactionBtn,
                    {
                      backgroundColor: colors.inputBg,
                      borderColor: colors.border,
                      transform: [{ scale: pressed ? 0.9 : 1 }],
                    },
                  ]}
                >
                  <Text style={s.reactionEmoji}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* divider */}
          <View style={[s.divider, { backgroundColor: colors.divider }]} />

          {/* CTA button */}
          <Pressable
            onPress={() => router.push(config.ctaRoute as any)}
            style={({ pressed }) => [
              s.ctaBtn,
              {
                backgroundColor: heroColor,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <Text style={s.ctaBtnText}>{config.ctaLabel}</Text>
            <MaterialIcons name="arrow-forward" size={18} color="#FFF" />
          </Pressable>
        </View>

        {/* ── Timestamp footer ────────────────────── */}
        <View style={s.timestampRow}>
          <MaterialIcons name="schedule" size={14} color={colors.mutedText} />
          <Text style={[s.timestampText, { color: colors.mutedText }]}>
            Received {params.time || 'recently'}
          </Text>
        </View>

        {/* ── Quick actions ───────────────────────── */}
        <View style={s.quickActions}>
          <Pressable
            onPress={() => goBackHelper(router, params.from)}
            style={({ pressed }) => [
              s.quickActionBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <MaterialIcons name="notifications-off" size={16} color={colors.mutedText} />
            <Text style={[s.quickActionText, { color: colors.mutedText }]}>Mute this type</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(tabs)/notifications')}
            style={({ pressed }) => [
              s.quickActionBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <MaterialIcons name="tune" size={16} color={colors.mutedText} />
            <Text style={[s.quickActionText, { color: colors.mutedText }]}>Settings</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

/* ── Styles ──────────────────────────────────────── */
const s = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: UI.spacing.xl,
  } as any,

  /* header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 6,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  headerTitle: { fontSize: 22, fontWeight: '900' },
  headerSub: { fontSize: 14, marginTop: 2 },

  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100,
    gap: 14,
  },

  /* hero */
  heroCard: {
    borderRadius: UI.radius.xxl,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...UI.shadow.md,
  },
  heroCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -60,
    right: -40,
  },
  heroCircle2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    bottom: -50,
    left: -30,
  },
  heroCircle3: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    top: 20,
    left: SCREEN_W * 0.5,
  },
  heroEmojiWrap: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    ...UI.shadow.sm,
  },
  heroEmoji: {
    fontSize: 44,
  },
  heroLabelWrap: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    maxWidth: '80%',
  },
  heroLabel: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },

  /* content card */
  contentCard: {
    borderRadius: UI.radius.xxl,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    ...UI.shadow.sm,
  },
  contentTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 14,
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 8,
  },

  /* reactions */
  reactionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  reactionBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  reactionEmoji: {
    fontSize: 22,
  },

  /* divider */
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 20,
  },

  /* CTA */
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 16,
    borderRadius: UI.radius.lg,
    ...UI.shadow.sm,
  },
  ctaBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },

  /* timestamp */
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  timestampText: {
    fontSize: 13,
    fontWeight: '600',
  },

  /* quick actions */
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: UI.radius.lg,
    borderWidth: 1,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
