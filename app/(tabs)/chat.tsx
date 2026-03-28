import React, { useCallback, useRef } from 'react';
import { View, Text, Pressable, ScrollView, Platform, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSubscription } from '@/hooks/useSubscription';
import { showAlert } from '@/lib/state';
import { Colors, UI } from '@/constants/theme';
import { useTopics } from '@/hooks/useTopics';
import { useChat } from '@/hooks/useChat';
import { PERSONAS } from '@/lib/chat';
import { buildChatKey, buildNewChatKey, countMessagesForTopic } from '@/lib/chatKeys';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/* ── quick suggestion chips ─────────────────────── */
const QUICK_SUGGESTIONS = [
  { emoji: '😟', label: "I'm feeling anxious" },
  { emoji: '😞', label: "I can't sleep well" },
  { emoji: '💭', label: 'Help me reflect' },
  { emoji: '🧘', label: 'Guide me to relax' },
];

export default function Chatbot() {
  const theme = useColorScheme() ?? 'light';
  const { hasFullAccess } = useSubscription();
  const colors = Colors[theme];
  const { topics } = useTopics();
  const { history, stats, isLoading: chatLoading } = useChat();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []));

  /** Gate action behind premium access — returns true if blocked. */
  const requirePremium = useCallback((): boolean => {
    if (hasFullAccess) return false;
    showAlert('Premium Feature', 'Upgrade to lifetime access to chat with the AI companion.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Upgrade', onPress: () => router.push('/(utils)/trial-upgrade') },
    ]);
    return true;
  }, [hasFullAccess]);

  function handleTopicPress(topicId: string, personaId: string = 'freud') {
    if (requirePremium()) return;
    if (chatLoading) return; // Wait for history to load
    router.push({
      pathname: '/(tabs)/chat/[issueKey]',
      params: {
        issueKey: buildChatKey(personaId, topicId),
        from: '/(tabs)/chat',
        persona: personaId,
      },
    });
  }

  function handleNewConversation() {
    if (requirePremium()) return;
    if (chatLoading) return; // Wait for history to load
    router.push({
      pathname: '/(tabs)/chat/new-conversation' as any,
      params: { from: '/(tabs)/chat' },
    });
  }

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* ── Header ────────────────────────────────── */}
      <View style={[s.header, { paddingTop: insets.top }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            s.headerBtn,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <MaterialIcons name="arrow-back-ios-new" size={16} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, { color: colors.text }]}>AI Therapy</Text>
          <Text style={[s.headerSub, { color: colors.mutedText }]}>
            Your personal AI wellness team
          </Text>
        </View>
        <View style={s.headerActions}>
          <Pressable
            onPress={() => router.push('/(tabs)/chat/history')}
            style={({ pressed }) => [
              s.headerBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <MaterialIcons name="history" size={18} color={colors.text} />
          </Pressable>
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/(tabs)/chat/customize' as any,
                params: { from: '/(tabs)/chat' },
              })
            }
            style={({ pressed }) => [
              s.headerBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <MaterialIcons name="tune" size={18} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Stats Hero Card ────────────────────── */}
        <View style={[s.heroCard, { backgroundColor: '#8B6B47' }]}>
          <View style={[s.heroCircle1, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
          <View style={[s.heroCircle2, { backgroundColor: 'rgba(255,255,255,0.06)' }]} />
          <View style={[s.heroCircle3, { backgroundColor: 'rgba(255,255,255,0.04)' }]} />

          <View style={s.heroEmojiWrap}>
            <Text style={{ fontSize: 44 }}>🧠</Text>
          </View>

          <Text style={s.heroBigValue}>{chatLoading ? '—' : stats.totalMessages || 0}</Text>
          <Text style={s.heroLabel}>Messages Exchanged</Text>

          <View style={s.heroStatsRow}>
            <View style={s.heroStatItem}>
              <Text style={s.heroStatValue}>{chatLoading ? '—' : stats.totalConversations}</Text>
              <Text style={s.heroStatLabel}>Conversations</Text>
            </View>
            <View style={[s.heroStatDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
            <View style={s.heroStatItem}>
              <Text style={s.heroStatValue}>{topics.length}</Text>
              <Text style={s.heroStatLabel}>Topics</Text>
            </View>
            <View style={[s.heroStatDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
            <View style={s.heroStatItem}>
              <Text style={s.heroStatValue}>{PERSONAS.length}</Text>
              <Text style={s.heroStatLabel}>AI Coaches</Text>
            </View>
          </View>
        </View>

        {/* ── New Conversation CTA ───────────────── */}
        <Pressable
          onPress={handleNewConversation}
          style={({ pressed }) => [
            s.newConvoBtn,
            {
              backgroundColor: '#5B8A5A',
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}
        >
          <MaterialIcons name="add-circle-outline" size={22} color="#FFF" />
          <Text style={s.newConvoBtnText}>New Conversation</Text>
          <MaterialIcons name="arrow-forward" size={18} color="#FFF" />
        </Pressable>

        {/* ── Quick Suggestions ──────────────────── */}
        <Text style={[s.sectionLabel, { color: colors.mutedText }]}>Quick Start</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.suggestionsRow}
        >
          {QUICK_SUGGESTIONS.map((sug, i) => (
            <Pressable
              key={i}
              onPress={() => {
                if (requirePremium()) return;
                if (chatLoading) return;
                router.push({
                  pathname: '/(tabs)/chat/[issueKey]',
                  params: {
                    issueKey: buildNewChatKey('freud'),
                    from: '/(tabs)/chat',
                    initialMessage: sug.label,
                    persona: 'freud',
                  },
                });
              }}
              style={({ pressed }) => [
                s.suggestionChip,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                },
              ]}
            >
              <Text style={{ fontSize: 20 }}>{sug.emoji}</Text>
              <Text style={[s.suggestionText, { color: colors.text }]}>{sug.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* ── My AI Team ────────────────────────── */}
        <Text style={[s.sectionLabel, { color: colors.mutedText }]}>My AI Team</Text>
        <View style={s.teamGrid}>
          {PERSONAS.map((member) => (
            <Pressable
              key={member.id}
              onPress={() => {
                if (requirePremium()) return;
                if (chatLoading) return;
                router.push({
                  pathname: '/(tabs)/chat/new-conversation' as any,
                  params: { from: '/(tabs)/chat', persona: member.id },
                });
              }}
              style={({ pressed }) => [
                s.teamCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
              ]}
            >
              <View style={[s.teamAvatarWrap, { backgroundColor: member.color + '18' }]}>
                <Text style={{ fontSize: 28 }}>{member.emoji}</Text>
              </View>
              <Text style={[s.teamName, { color: colors.text }]} numberOfLines={1}>
                {member.name}
              </Text>
              <Text style={[s.teamRole, { color: colors.mutedText }]} numberOfLines={1}>
                {member.role}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Topics ────────────────────────────── */}
        <Text style={[s.sectionLabel, { color: colors.mutedText }]}>Explore Topics</Text>
        <View style={{ gap: 10 }}>
          {topics.map((topic: any) => {
            const conversationCount = countMessagesForTopic(history, topic.id);
            return (
              <Pressable
                key={topic.id}
                onPress={() => handleTopicPress(topic.id)}
                style={({ pressed }) => [
                  s.topicCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: hasFullAccess ? 1 : 0.7,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
              >
                <View style={s.topicContent}>
                  <Text style={[s.topicTitle, { color: colors.text }]}>{topic.name}</Text>
                  <Text style={[s.topicDesc, { color: colors.mutedText }]} numberOfLines={2}>
                    {topic.description}
                  </Text>
                  {conversationCount > 0 && (
                    <View style={s.topicBadgeRow}>
                      <View style={[s.topicBadge, { backgroundColor: '#5B8A5A15' }]}>
                        <Text style={[s.topicBadgeText, { color: '#5B8A5A' }]}>
                          {conversationCount} messages
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
                <MaterialIcons name="arrow-forward-ios" size={14} color={colors.subtleText} />
              </Pressable>
            );
          })}
        </View>

        {/* ── Understanding Card ─────────────────── */}
        <View style={[s.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.infoHeader}>
            <Text style={{ fontSize: 20 }}>🔒</Text>
            <Text style={[s.infoTitle, { color: colors.text }]}>Private & Secure</Text>
          </View>
          <Text style={[s.infoText, { color: colors.mutedText }]}>
            Your conversations are private and encrypted. Our AI is designed to support your mental
            wellness journey, not replace professional help.
          </Text>
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
    paddingTop: 0,
    marginTop: 0,
  },

  /* header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitle: { fontSize: 22, fontWeight: '900' },
  headerSub: { fontSize: 14, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100,
    gap: 14,
  },

  /* hero card */
  heroCard: {
    borderRadius: UI.radius.xxl,
    padding: 24,
    alignItems: 'center',
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
    right: 60,
  },
  heroEmojiWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroBigValue: {
    color: '#FFF',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginTop: 18,
  },
  heroStatItem: { alignItems: 'center' },
  heroStatValue: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  heroStatDivider: { width: 1, height: 28 },

  /* new conversation button */
  newConvoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: UI.radius.lg,
    ...UI.shadow.sm,
  },
  newConvoBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },

  /* section label */
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
  },

  /* quick suggestions */
  suggestionsRow: { gap: 10 },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: UI.radius.lg,
    borderWidth: 1,
  },
  suggestionText: { fontSize: 13, fontWeight: '700' },

  /* AI team grid */
  teamGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  teamCard: {
    width: '48%' as any,
    flexGrow: 1,
    flexBasis: '46%',
    borderRadius: UI.radius.xxl,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    ...UI.shadow.sm,
  },
  teamAvatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  teamName: { fontSize: 14, fontWeight: '800', textAlign: 'center' },
  teamRole: { fontSize: 12, fontWeight: '600', marginTop: 2, textAlign: 'center' },

  /* topic cards */
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: UI.radius.xxl,
    padding: 16,
    borderWidth: 1,
    ...UI.shadow.sm,
  },
  topicContent: { flex: 1, marginRight: 10 },
  topicTitle: { fontSize: 16, fontWeight: '800' },
  topicDesc: { fontSize: 13, lineHeight: 19, marginTop: 4 },
  topicBadgeRow: { flexDirection: 'row', marginTop: 8 },
  topicBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  topicBadgeText: { fontSize: 11, fontWeight: '700' },

  /* info card */
  infoCard: {
    borderRadius: UI.radius.xxl,
    padding: 18,
    borderWidth: 1,
    ...UI.shadow.sm,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoTitle: { fontSize: 15, fontWeight: '800' },
  infoText: { fontSize: 13, lineHeight: 20 },
});
