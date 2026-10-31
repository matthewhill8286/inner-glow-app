import { useSubscription } from '@/hooks/useSubscription';
import { AppCard } from '@/components/ui/AppCard';
import { AppButton } from '@/components/ui/AppButton';
import { prepareChatTurn } from '@/lib/conversation-display';
import { StatusState } from '@/components/ui/StatusState';
import { Typography } from '@/constants/typography';
import { ServiceError } from '@/lib/function-errors';
import { takeChatDraft } from '@/lib/chat-drafts';
import { backTo } from '@/lib/navigation';
import { WellnessIconText } from '@/components/WellnessIconText';
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  Pressable,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { showAlert } from '@/lib/state';
import { toast } from '@/components/Toast';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import MaterialIcons from '@/components/AppIcon';
import TypingBubble from '@/components/TypingBubble';
import {
  sendChatToAI,
  getPersona,
  getTopicKeyPrefix,
  type PersonaId,
  type PersonaMeta,
} from '@/lib/chat';
import { useChat } from '@/hooks/useChat';
import { ChatMessage } from '@/lib/types';
import { useTopics } from '@/hooks/useTopics';
import { parseChatKey } from '@/lib/chatKeys';
import CitationSection from '@/components/CitationSection';

/* ── Helpers ────────────────────────────────────────── */

function goBack(from?: string) {
  backTo(from, '/(tabs)/chat');
}

/* ── Message Bubble ─────────────────────────────────── */

type AppColors = (typeof Colors)['light'] | (typeof Colors)['dark'];

function MessageBubble({
  item,
  persona,
  colors,
}: {
  item: ChatMessage;
  persona: PersonaMeta;
  colors: AppColors;
}) {
  const isUser = item.role === 'user';
  const hasCitations = !isUser && item.citations && item.citations.length > 0;

  return (
    <View style={[s.msgRow, { justifyContent: isUser ? 'flex-end' : 'flex-start' }]}>
      {!isUser && (
        <View style={[s.aiAvatar, { backgroundColor: persona.color + '18' }]}>
          <WellnessIconText style={{ fontFamily: Typography.family.body, fontSize: 16 }}>
            {persona.emoji}
          </WellnessIconText>
        </View>
      )}
      <View
        style={[
          s.msgBubble,
          isUser
            ? [s.userBubble, { backgroundColor: persona.color }]
            : [s.aiBubble, { backgroundColor: colors.card, borderColor: colors.border }],
        ]}
      >
        <Text style={[s.msgText, { color: isUser ? '#FFF' : colors.text }]}>{item.content}</Text>

        {hasCitations && (
          <CitationSection
            citations={item.citations!}
            accentColor={persona.color}
            colors={colors as any}
            compact
          />
        )}

        <Text style={[s.msgTime, { color: isUser ? 'rgba(255,255,255,0.6)' : colors.subtleText }]}>
          {new Date(item.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );
}

/* ── Empty State ────────────────────────────────────── */

function EmptyState({
  persona,
  topicName,
  suggestions,
  colors,
  onSuggestion,
}: {
  persona: PersonaMeta;
  topicName: string;
  suggestions: string[];
  colors: AppColors;
  onSuggestion: (text: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={s.emptyWrap}>
      <View style={[s.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[s.emptyAvatarWrap, { backgroundColor: persona.color + '15' }]}>
          <WellnessIconText style={{ fontFamily: Typography.family.body, fontSize: 36 }}>
            {persona.emoji}
          </WellnessIconText>
        </View>
        <Text style={[s.emptyTitle, { color: colors.text }]}>{t('chat.startConversation')}</Text>
        <Text style={[s.emptySub, { color: colors.mutedText }]}>
          {t('chat.startSubtitle', { topic: topicName.toLowerCase() })}
        </Text>
      </View>

      <View style={s.emptySuggestions}>
        {suggestions.map((sug, i) => (
          <Pressable
            key={i}
            onPress={() => onSuggestion(sug)}
            style={({ pressed }) => [
              s.emptySugBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              },
            ]}
          >
            <Text style={[s.emptySugText, { color: colors.text }]}>{sug}</Text>
            <MaterialIcons name="arrow-forward-ios" size={11} color={colors.subtleText} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/* ── Main Screen ────────────────────────────────────── */

export default function Chat() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  /* ── Route params ── */
  const {
    issueKey,
    from,
    initialMessage,
    persona: personaParam,
  } = useLocalSearchParams<{
    issueKey: string;
    from?: string;
    initialMessage?: string;
    persona?: string;
  }>();

  /* ── Parse the composite key for topic + persona ── */
  const { topicId } = useMemo(() => parseChatKey(issueKey || ''), [issueKey]);
  const { topics } = useTopics();
  const issue = useMemo(() => topics.find((i: any) => i.id === topicId), [topicId, topics]);
  const persona = useMemo(() => getPersona(personaParam), [personaParam]);

  const { hasFullAccess, isLoading: accessLoading } = useSubscription();

  /* ── Chat data ── */
  const { history, saveMessages, clearHistory, isLoading: loading } = useChat();

  /* ── Local messages — syncs from DB, then managed locally ── */
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [inputText, setInputText] = useState('');
  const [failedMessage, setFailedMessage] = useState<{
    text: string;
    message: string;
    saved: boolean;
  } | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const requestRef = useRef<{ key: string; token: symbol } | null>(null);
  useEffect(
    () => () => {
      lastLoadedKey.current = null;
    },
    [],
  );

  /* ── Track keyboard visibility ── */
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  /* Track which key we've loaded to handle screen reuse correctly */
  const lastLoadedKey = useRef<string | null>(null);
  const lastInitialKey = useRef<string | null>(null);

  useEffect(() => {
    if (!loading && issueKey && lastLoadedKey.current !== issueKey) {
      lastLoadedKey.current = issueKey;
      setMessages(history[issueKey] || []);
      setInputText('');
      setFailedMessage(null);
      setIsAiTyping(false);
    }
  }, [loading, issueKey, history]);

  useEffect(() => {
    const saved = history[issueKey || ''];
    if (
      saved &&
      lastLoadedKey.current === issueKey &&
      !requestRef.current &&
      !failedMessage &&
      saved.length > messages.length
    )
      setMessages(saved);
  }, [history, issueKey, messages.length, failedMessage]);

  const historyReady = !loading;
  const isTyping = isAiTyping;
  const topicName = issue?.name ?? persona.speciality;

  const suggestions = useMemo(() => {
    // Try topic-specific suggestions first
    const topicPrefix = getTopicKeyPrefix(issue?.name, issue?.context_tags ?? undefined);
    if (topicPrefix) {
      return [
        t(`chat.${topicPrefix}_suggestion1`),
        t(`chat.${topicPrefix}_suggestion2`),
        t(`chat.${topicPrefix}_suggestion3`),
        t(`chat.${topicPrefix}_suggestion4`),
      ];
    }
    // Fall back to persona-specific suggestions
    const personaPrefix = persona.id === 'freud' ? '' : `${persona.id}_`;
    return [
      t(`chat.${personaPrefix}suggestion1`),
      t(`chat.${personaPrefix}suggestion2`),
      t(`chat.${personaPrefix}suggestion3`),
      t(`chat.${personaPrefix}suggestion4`),
    ];
  }, [t, persona.id, issue]);

  /* ── Send ── */
  const sendMessage = useCallback(
    async (text?: string, retry = false, openingHistory?: ChatMessage[]) => {
      const msgText = (text || inputText).trim();
      if (!msgText || !issueKey || !historyReady || requestRef.current?.key === issueKey) return;
      if (!hasFullAccess) {
        if (!accessLoading)
          showAlert(
            'Continue with Premium',
            'Your saved conversations remain available to read. Start a trial or choose Premium to send AI messages.',
            [
              { text: 'Close', style: 'cancel' },
              { text: 'View plans', onPress: () => router.push('/(utils)/trial-upgrade') },
            ],
          );
        return;
      }
      const request = { key: issueKey, token: Symbol() };
      requestRef.current = request;
      setFailedMessage(null);

      if (!text) setInputText('');

      const userMsg: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        role: 'user',
        content: msgText,
        createdAt: new Date().toISOString(),
      };

      const withUserMsg = prepareChatTurn(openingHistory ?? messages, userMsg, retry);
      setMessages(withUserMsg);
      setIsAiTyping(true);

      let saved = false;
      try {
        await saveMessages(issueKey, withUserMsg);
        saved = true;
        const aiResponse = await sendChatToAI(
          topicName,
          issue?.context_tags ?? [],
          withUserMsg.map((m) => ({ role: m.role, content: m.content })),
          persona.id as PersonaId,
        );

        const aiMsg: ChatMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          role: 'assistant',
          content: aiResponse.text,
          createdAt: new Date().toISOString(),
          citations: aiResponse.citations.length > 0 ? aiResponse.citations : undefined,
        };

        const withAiMsg = [...withUserMsg, aiMsg];
        await saveMessages(issueKey, withAiMsg);
        if (lastLoadedKey.current === issueKey && requestRef.current === request)
          setMessages(withAiMsg);
      } catch (err) {
        if (lastLoadedKey.current !== issueKey) return;
        const message = err instanceof Error ? err.message : t('chat.errorMessage');
        setFailedMessage({
          text: msgText,
          saved,
          message: err instanceof ServiceError ? `${message} Reference: ${err.reference}` : message,
        });
        if (err instanceof ServiceError && err.status === 403) {
          showAlert('Trial or premium access required', message, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'View access options', onPress: () => router.push('/(utils)/trial-upgrade') },
          ]);
        }
      } finally {
        if (requestRef.current === request) {
          requestRef.current = null;
          if (lastLoadedKey.current === issueKey) setIsAiTyping(false);
        }
      }
    },
    [inputText, issueKey, messages, topicName, issue, persona, saveMessages, t, historyReady],
  );

  // Start prompt-based conversations in the same update as history hydration.
  // Passing the hydrated history avoids a stale render dropping saved messages.
  useEffect(() => {
    if (!issueKey || loading || accessLoading || lastInitialKey.current === issueKey) return;
    const openingMessage = takeChatDraft(issueKey) || initialMessage;
    if (!openingMessage) return;
    lastInitialKey.current = issueKey;
    void sendMessage(openingMessage, false, history[issueKey] || []);
  }, [initialMessage, issueKey, loading, accessLoading, history, sendMessage]);

  /* ── Clear ── */
  function handleClear() {
    if (!issueKey) return;
    showAlert(t('chat.clearTitle'), t('chat.clearMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('chat.clear'),
        style: 'destructive',
        onPress: async () => {
          await clearHistory(issueKey);
          setMessages([]);
        },
      },
    ]);
  }

  /* ── Render ── */

  /* Show a loading screen while chat histories are being fetched */
  if (!historyReady || lastLoadedKey.current !== issueKey) {
    return (
      <View
        style={[
          s.container,
          {
            backgroundColor: colors.background,
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: insets.top + 8,
          },
        ]}
      >
        <View style={s.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to conversations"
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
          <View style={[s.headerAvatarWrap, { backgroundColor: persona.color + '15' }]}>
            <WellnessIconText style={{ fontFamily: Typography.family.body, fontSize: 20 }}>
              {persona.emoji}
            </WellnessIconText>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.headerTitle, { color: colors.text }]} numberOfLines={2}>
              {topicName}
            </Text>
            <Text style={[s.headerSub, { color: colors.mutedText }]}>{persona.name}</Text>
          </View>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={persona.color} />
          <Text
            style={{
              fontFamily: Typography.family.body,
              color: colors.mutedText,
              marginTop: 12,
              fontSize: 14,
            }}
          >
            {t('chat.loadingHistory') || 'Loading conversation...'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <View
        style={[s.container, { backgroundColor: colors.background, paddingTop: insets.top + 8 }]}
      >
        {/* ── Header ── */}
        <View style={s.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to conversations"
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

          <View style={[s.headerAvatarWrap, { backgroundColor: persona.color + '15' }]}>
            <WellnessIconText style={{ fontFamily: Typography.family.body, fontSize: 20 }}>
              {persona.emoji}
            </WellnessIconText>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.headerTitle, { color: colors.text }]} numberOfLines={2}>
              {topicName}
            </Text>
            <Text style={[s.headerSub, { color: colors.mutedText }]}>{persona.name}</Text>
          </View>

          {messages.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear conversation"
              disabled={isAiTyping}
              onPress={handleClear}
              style={({ pressed }) => [
                s.headerActionBtn,
                {
                  backgroundColor: theme === 'light' ? '#fee2e2' : '#442222',
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <MaterialIcons
                name="delete-outline"
                size={18}
                color={theme === 'light' ? '#ef4444' : '#f88'}
              />
            </Pressable>
          )}
        </View>

        {/* ── Messages ── */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          style={{ flex: 1 }}
          contentContainerStyle={s.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <EmptyState
              persona={persona}
              topicName={topicName}
              suggestions={suggestions}
              colors={colors}
              onSuggestion={sendMessage}
            />
          }
          renderItem={({ item }) => <MessageBubble item={item} persona={persona} colors={colors} />}
        />

        {failedMessage && (
          <StatusState
            title={
              failedMessage.saved ? 'Your message is saved' : 'Your message could not be saved'
            }
            message={failedMessage.message}
            onRetry={() => {
              void sendMessage(failedMessage.text, true);
            }}
            busy={isAiTyping}
          />
        )}
        {/* ── Typing indicator ── */}
        {isTyping && (
          <View style={s.typingRow}>
            <View style={[s.aiAvatar, { backgroundColor: persona.color + '18' }]}>
              <WellnessIconText style={{ fontFamily: Typography.family.body, fontSize: 14 }}>
                {persona.emoji}
              </WellnessIconText>
            </View>
            <View
              style={[s.typingBubble, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <TypingBubble />
            </View>
          </View>
        )}

        {!accessLoading && !hasFullAccess && (
          <AppCard>
            <Text style={[Typography.caption, { color: colors.mutedText }]}>
              Your conversations stay available to read. Trial or Premium access is needed to send
              AI messages.
            </Text>
            <AppButton
              title="View Premium plans"
              onPress={() => router.push('/(utils)/trial-upgrade')}
            />
          </AppCard>
        )}
        {/* ── Input Bar ── */}
        <View
          style={[
            s.inputBar,
            {
              borderTopColor: colors.border,
              paddingBottom: keyboardVisible ? 8 : Math.max(insets.bottom, 12),
            },
          ]}
        >
          <TextInput
            editable={hasFullAccess}
            accessibilityLabel="Message"
            value={inputText}
            onChangeText={setInputText}
            placeholder={t('chat.typePlaceholder')}
            placeholderTextColor={colors.placeholder}
            multiline
            style={[
              s.input,
              { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
            ]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            onPress={() => sendMessage()}
            disabled={!inputText.trim() || isTyping || !hasFullAccess}
            style={({ pressed }) => [
              s.sendBtn,
              {
                backgroundColor: inputText.trim() && !isTyping ? persona.color : colors.divider,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <MaterialIcons
              name="send"
              size={20}
              color={inputText.trim() && !isTyping ? '#FFF' : colors.mutedText}
            />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ── Styles ──────────────────────────────────────────── */
const s = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: UI.spacing.xl,
    paddingTop: 0,
  },

  /* header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerAvatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...Typography.heading, fontSize: 24 },
  headerSub: {
    fontFamily: Typography.family.body,
    fontSize: 12,
    fontWeight: Typography.weight.semibold,
    marginTop: 1,
  },
  headerActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* messages */
  messagesList: { paddingVertical: 16, gap: 12 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  aiAvatar: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgBubble: { maxWidth: '78%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
  userBubble: { borderBottomRightRadius: 4 },
  aiBubble: { borderBottomLeftRadius: 4, borderWidth: 1 },
  msgText: { ...Typography.body },
  msgTime: {
    fontFamily: Typography.family.body,
    fontSize: 10,
    fontWeight: Typography.weight.bold,
    marginTop: 6,
    alignSelf: 'flex-end',
  },

  /* typing */
  typingRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 8 },
  typingBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },

  /* empty state */
  emptyWrap: { gap: 14, paddingTop: 8 },
  emptyCard: {
    borderRadius: UI.radius.xxl,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    ...UI.shadow.sm,
  },
  emptyAvatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: { ...Typography.cardHeading, textAlign: 'center' },
  emptySub: {
    fontFamily: Typography.family.body,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 8,
  },
  emptySuggestions: { gap: 8 },
  emptySugBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: UI.radius.lg,
    borderWidth: 1,
  },
  emptySugText: {
    fontFamily: Typography.family.body,
    fontSize: 14,
    fontWeight: Typography.weight.semibold,
    flex: 1,
  },

  /* input bar */
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
  },
  input: {
    fontFamily: Typography.family.body,
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    maxHeight: 120,
    fontSize: 15,
    borderWidth: 1,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
