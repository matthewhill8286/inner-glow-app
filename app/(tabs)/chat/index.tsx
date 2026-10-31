import { ConversationRow } from '@/components/ConversationRow';
import { StatusState } from '@/components/ui/StatusState';
import { screenBottomPadding } from '@/lib/screen-layout';
import { returnHome } from '@/lib/navigation';
import { Typography } from '@/constants/typography';
import { stageChatDraft } from '@/lib/chat-drafts';
import { WellnessIconText } from '@/components/WellnessIconText';
import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Platform,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
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
import MaterialIcons from '@/components/AppIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/* ── quick suggestion chips ─────────────────────── */
const QUICK_SUGGESTIONS = [
  { icon: 'sentiment-dissatisfied', title: 'Feeling anxious', label: "I'm feeling anxious" },
  { icon: 'nightlight-round', title: 'Trouble sleeping', label: "I can't sleep well" },
  { icon: 'chat-bubble-outline', title: 'Reflect together', label: 'Help me reflect' },
  { icon: 'air', title: 'Find some calm', label: 'Guide me to relax' },
];

export default function Chatbot() {
  const theme = useColorScheme() ?? 'light';
  const {
    hasFullAccess,
    isLoading: accessLoading,
    error: accessError,
    refresh: refreshAccess,
  } = useSubscription();
  const colors = Colors[theme];
  const { topics } = useTopics();
  const {
    history,
    conversations,
    isLoading: chatLoading,
    error: historyError,
    refresh: refreshHistory,
  } = useChat();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const singleColumn = width < 360 || fontScale > 1.2;
  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, []),
  );

  /** Gate action behind premium access — returns true if blocked. */
  const requirePremium = useCallback((): boolean => {
    if (hasFullAccess) return false;
    if (accessLoading || accessError) {
      showAlert(
        'Check your access',
        accessLoading
          ? 'Your access is being checked. Please try again in a moment.'
          : 'We could not verify your access. Refresh it or restore your Apple purchase in Profile.',
        [
          { text: 'Close', style: 'cancel' },
          {
            text: 'Refresh access',
            onPress: () => {
              void refreshAccess();
            },
          },
          { text: 'Restore purchases', onPress: () => router.navigate('/(tabs)/profile') },
        ],
      );
      return true;
    }
    showAlert(
      'Trial or premium access',
      'Start your free trial, choose a plan, or restore an existing purchase.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upgrade', onPress: () => router.push('/(utils)/trial-upgrade') },
      ],
    );
    return true;
  }, [hasFullAccess, accessLoading, accessError, refreshAccess]);

  function handleTopicPress(topicId: string, personaId: string = 'freud') {
    if (chatLoading) return;
    const existing = conversations.find(
      (conversation) => conversation.topicId === topicId && conversation.personaId === personaId,
    );
    if (!existing && requirePremium()) return;
    router.push({
      pathname: '/(tabs)/chat/[issueKey]',
      params: {
        issueKey: existing?.raw ?? buildChatKey(personaId, topicId),
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
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to Home"
          onPress={returnHome}
          style={{
            width: 44,
            minHeight: 44,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 4,
          }}
        >
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text
            accessibilityRole="header"
            numberOfLines={2}
            style={[s.headerTitle, { color: colors.text }]}
          >
            Conversations
          </Text>
          <Text style={[s.headerSub, { color: colors.mutedText }]}>A little room to reflect</Text>
        </View>
        <View style={s.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Conversation history"
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
            accessibilityRole="button"
            accessibilityLabel="Conversation preferences"
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

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          s.scrollContent,
          { paddingBottom: screenBottomPadding(insets.bottom) },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {historyError && (
          <StatusState
            title="Could not load conversations"
            message="Your saved conversations have not been removed. Try loading them again."
            onRetry={() => {
              void refreshHistory();
            }}
            busy={chatLoading}
          />
        )}
        {/* ── New Conversation CTA ───────────────── */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="New conversation"
          onPress={handleNewConversation}
          style={({ pressed }) => [
            s.newConvoBtn,
            {
              backgroundColor: colors.primary,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}
        >
          <MaterialIcons name="add-circle-outline" size={22} color="#FFF" />
          <Text style={s.newConvoBtnText}>New Conversation</Text>
          <MaterialIcons name="arrow-forward" size={18} color="#FFF" />
        </Pressable>

        {conversations.length > 0 && (
          <View style={{ gap: 10 }}>
            <Text accessibilityRole="header" style={[Typography.section, { color: colors.text }]}>
              Recent conversations
            </Text>
            {conversations.slice(0, 2).map((conversation) => (
              <ConversationRow
                key={conversation.raw}
                conversation={conversation}
                topic={
                  topics.find((topic) => topic.id === conversation.topicId)?.name ??
                  conversation.persona.speciality
                }
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/chat/[issueKey]',
                    params: {
                      issueKey: conversation.raw,
                      persona: conversation.personaId,
                      from: '/(tabs)/chat',
                    },
                  })
                }
              />
            ))}
          </View>
        )}
        {/* ── Quick Suggestions ──────────────────── */}
        <Text style={[s.sectionLabel, { color: colors.mutedText }]}>Quick Start</Text>
        <View style={s.suggestionsRow}>
          {QUICK_SUGGESTIONS.map((sug, i) => (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={sug.label}
              onPress={() => {
                if (requirePremium()) return;
                if (chatLoading) return;
                router.push({
                  pathname: '/(tabs)/chat/[issueKey]',
                  params: {
                    issueKey: stageChatDraft(buildNewChatKey('freud'), sug.label),
                    from: '/(tabs)/chat',
                    persona: 'freud',
                  },
                });
              }}
              style={({ pressed }) => [
                s.suggestionChip,
                { flexBasis: singleColumn ? '100%' : '46%' },
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: colors.primary + '12',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialIcons name={sug.icon} size={19} color={colors.primary} />
              </View>
              <Text style={[s.suggestionText, { color: colors.text }]}>{sug.title}</Text>
              <MaterialIcons name="chevron-right" size={16} color={colors.mutedText} />
            </Pressable>
          ))}
        </View>

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
                <WellnessIconText style={{ fontFamily: Typography.family.body, fontSize: 28 }}>
                  {member.emoji}
                </WellnessIconText>
              </View>
              <Text style={[s.teamName, { color: colors.text }]} numberOfLines={2}>
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
            <WellnessIconText style={{ fontFamily: Typography.family.body, fontSize: 20 }}>
              🔒
            </WellnessIconText>
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
  headerTitle: { ...Typography.heading },
  headerSub: { fontFamily: Typography.family.body, fontSize: 14, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: {
    width: 44,
    height: 44,
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
    padding: 20,
    overflow: 'hidden',
    ...UI.shadow.md,
  },
  heroBigValue: {
    color: '#FFF',
    fontSize: 23,
    fontFamily: Typography.family.heading,
    fontWeight: Typography.weight.regular,
    letterSpacing: -0.3,
  },
  heroLabel: {
    fontFamily: Typography.family.body,
    color: 'rgba(255,255,255,0.80)',
    fontSize: 14,
    fontWeight: Typography.weight.medium,
    marginTop: 2,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginTop: 18,
  },
  heroStatItem: { flex: 1, alignItems: 'flex-start' },
  heroStatValue: {
    fontFamily: Typography.family.body,
    color: '#FFF',
    fontSize: 18,
    fontWeight: Typography.weight.bold,
  },
  heroStatLabel: {
    fontFamily: Typography.family.body,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: Typography.weight.medium,
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
    fontFamily: Typography.family.body,
    color: '#FFF',
    fontSize: 16,
    fontWeight: Typography.weight.semibold,
  },

  /* section label */
  sectionLabel: {
    fontFamily: Typography.family.body,
    fontSize: 13,
    fontWeight: Typography.weight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
  },

  /* quick suggestions */
  suggestionsRow: { gap: 10, flexDirection: 'row', flexWrap: 'wrap' },
  suggestionChip: {
    flexGrow: 1,
    minHeight: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    maxWidth: '100%',
    borderRadius: UI.radius.lg,
    borderWidth: 1,
  },
  suggestionText: {
    flex: 1,
    fontFamily: Typography.family.body,
    fontSize: 13,
    fontWeight: Typography.weight.semibold,
  },

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
  teamName: { ...Typography.cardHeading, textAlign: 'center' },
  teamRole: {
    fontFamily: Typography.family.body,
    fontSize: 12,
    fontWeight: Typography.weight.semibold,
    marginTop: 2,
    textAlign: 'center',
  },

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
  topicTitle: { ...Typography.cardHeading },
  topicDesc: { fontFamily: Typography.family.body, fontSize: 13, lineHeight: 19, marginTop: 4 },
  topicBadgeRow: { flexDirection: 'row', marginTop: 8 },
  topicBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  topicBadgeText: {
    fontFamily: Typography.family.body,
    fontSize: 11,
    fontWeight: Typography.weight.medium,
  },

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
  infoTitle: { ...Typography.cardHeading },
  infoText: { fontFamily: Typography.family.body, fontSize: 13, lineHeight: 20 },
});
