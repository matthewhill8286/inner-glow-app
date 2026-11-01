import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSubscription } from '@/hooks/useSubscription';
import { useUser } from '@/hooks/useUser';
import { queryKeys } from '@/lib/queryKeys';
import { CrisisSheet } from '@/components/chat/CrisisSheet';
import { StatusState } from '@/components/ui/StatusState';
import { LegalNote } from '@/components/ui/controls';
import { GlowField, GlowOrb } from '@/components/glow/Glow';
import { ChatHeader, Composer, MessageBubble, StarterRow } from '@/components/chat/ChatParts';
import { prepareChatTurn } from '@/lib/conversation-display';
import { ServiceError } from '@/lib/function-errors';
import { takeChatDraft } from '@/lib/chat-drafts';
import { backTo } from '@/lib/navigation';
import { showAlert } from '@/lib/state';
import { talkDate } from '@/lib/talks';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import TypingBubble from '@/components/TypingBubble';
import { sendChatToAI, getPersona, getTopicKeyPrefix, type PersonaId } from '@/lib/chat';
import { useChat } from '@/hooks/useChat';
import { ChatMessage } from '@/lib/types';
import { useTopics } from '@/hooks/useTopics';
import { parseChatKey } from '@/lib/chatKeys';

/* ── Helpers ────────────────────────────────────────── */

function goBack(from?: string) {
  backTo(from, '/(tabs)/chat');
}

function clock(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function sameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

/* ── Main Screen ────────────────────────────────────── */

/**
 * Glow AI · Conversation (05 §3.3, 09 §3.2): the chat header, day stamps, plum and white bubbles, the
 * typing bubble with its caption, the send receipt and the composer pill. Voice, quick replies and
 * practice cards wait for voice mode and structured replies from the chat function.
 */
export default function Chat() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();

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

  const { isLoading: accessLoading } = useSubscription();
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const [crisisOpen, setCrisisOpen] = useState(false);

  /* ── Chat data ── */
  const { history, saveMessages, isLoading: loading } = useChat();

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
      // Free users may send too; the chat function counts the talk and answers 402 at the limit.
      if (accessLoading) return;
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
          issueKey,
        );
        if (aiResponse.usage)
          void queryClient.invalidateQueries({ queryKey: queryKeys.chat.usage(user?.id) });
        if (aiResponse.risk === 'high') setCrisisOpen(true);

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
        if (err instanceof ServiceError && err.status === 402) {
          void queryClient.invalidateQueries({ queryKey: queryKeys.chat.usage(user?.id) });
          router.push('/(tabs)/chat/free-limit');
        } else if (err instanceof ServiceError && err.status === 403) {
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
    [
      inputText,
      issueKey,
      messages,
      topicName,
      issue,
      persona,
      saveMessages,
      t,
      historyReady,
      accessLoading,
      queryClient,
      user?.id,
    ],
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

  /* ── Render ── */

  const header = (
    <ChatHeader
      title={t('glowAi.title')}
      status={t('glowAi.chat.status')}
      backLabel={t('common.back')}
      onBack={() => goBack(from)}
      action={
        messages.some((m) => m.role === 'assistant') && !isAiTyping
          ? {
              icon: 'line/check',
              label: t('glowAi.chat.end'),
              onPress: () =>
                router.push({ pathname: '/(tabs)/chat/summary', params: { issueKey } }),
            }
          : undefined
      }
      style={{ marginTop: insets.top + 10, marginHorizontal: 24 }}
    />
  );
  const glows = (
    <GlowField
      glows={[
        { color: palette.mustard, opacity: 0.2, x: -50, y: -20, width: 280, blur: 80 },
        { color: palette.lavenderSoft, opacity: 0.25, x: 180, y: 60, width: 220, blur: 80 },
      ]}
    />
  );

  /* Show a loading screen while chat histories are being fetched */
  if (!historyReady || lastLoadedKey.current !== issueKey) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg }}>
        {glows}
        {header}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <ActivityIndicator size="large" color={palette.plum} />
          <Text style={[Type.bodySm, { color: palette.textMuted }]}>
            {t('chat.loadingHistory') || 'Loading conversation...'}
          </Text>
        </View>
      </View>
    );
  }

  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const lastUserSaved = !!lastUser && (history[issueKey] ?? []).some((m) => m.id === lastUser.id);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: palette.bg }}
    >
      {glows}
      {header}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 20,
          paddingBottom: 12,
          gap: 12,
        }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={{ gap: 8 }}>
            <GlowOrb size={120} style={{ alignSelf: 'center', marginVertical: 24 }} />
            {suggestions.map((sug) => (
              <StarterRow
                key={sug}
                icon="line/chat"
                label={sug}
                onPress={() => void sendMessage(sug)}
              />
            ))}
          </View>
        }
        renderItem={({ item, index }) => (
          <MessageBubble
            item={item}
            dayStamp={
              index === 0 || !sameDay(messages[index - 1].createdAt, item.createdAt)
                ? t('glowAi.chat.day', {
                    day: talkDate(item.createdAt, i18n.language, t('glowAi.today')),
                    time: clock(item.createdAt),
                  })
                : undefined
            }
            receipt={
              item.id === lastUser?.id && lastUserSaved
                ? t('glowAi.chat.sent', { time: clock(item.createdAt) })
                : undefined
            }
          />
        )}
        ListFooterComponent={
          isTyping ? (
            <View style={{ gap: 6, marginTop: 12 }}>
              <TypingBubble />
              <Text style={[Type.micro, { lineHeight: 15, color: palette.textSubtle }]}>
                {t('glowAi.chat.typing')}
              </Text>
            </View>
          ) : null
        }
      />

      <View
        style={{
          paddingHorizontal: 24,
          paddingBottom: keyboardVisible ? 8 : insets.bottom + 10,
          paddingTop: 8,
          gap: 12,
        }}
      >
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
        <Composer
          value={inputText}
          onChangeText={setInputText}
          onSend={() => void sendMessage()}
          placeholder={t('glowAi.composer.placeholder')}
          sendLabel={t('glowAi.composer.send')}
          disabled={isTyping}
        />
        {!keyboardVisible && <LegalNote text={t('glowAi.note')} />}
      </View>
      <CrisisSheet visible={crisisOpen} onClose={() => setCrisisOpen(false)} />
    </KeyboardAvoidingView>
  );
}
