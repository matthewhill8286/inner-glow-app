import React, { useMemo } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import ScreenHeader from '@/components/ScreenHeader';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import { useChat, type ConversationMeta } from '@/hooks/useChat';
import { useTopics } from '@/hooks/useTopics';

export default function ChatHistory() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { conversations, isLoading, error } = useChat();
  const { topics } = useTopics();

  /* Build display items from the pre-parsed conversations */
  const historyItems = useMemo(() => {
    return conversations.map((convo: ConversationMeta) => {
      const topic = topics.find((tp: any) => tp.id === convo.topicId);
      const topicName =
        topic?.name || (convo.topicId === 'general' ? convo.persona.speciality : convo.topicId);

      return {
        key: convo.raw,
        personaId: convo.personaId,
        title: `${convo.persona.emoji} ${convo.persona.name} · ${topicName}`,
        lastMessage: convo.lastMessage?.content || t('chat.noMessages'),
        date: convo.lastMessage?.createdAt
          ? new Date(convo.lastMessage.createdAt).toLocaleDateString()
          : '',
        messageCount: convo.messages.length,
      };
    });
  }, [conversations, topics, t]);

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          padding: UI.spacing.xl,
          paddingTop: insets.top + 6,
        }}
      >
        <ScreenHeader
          title={t('chat.historyTitle')}
          subtitle={t('chat.historySubtitle')}
          showBack
        />
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        padding: UI.spacing.xl,
        paddingTop: insets.top + 6,
      }}
    >
      <ScreenHeader title={t('chat.historyTitle')} subtitle={t('chat.historySubtitle')} showBack />

      {isLoading && historyItems.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.text} />
        </View>
      ) : historyItems.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', opacity: 0.6 }}>
          <Text style={{ color: colors.text, fontSize: 16 }}>{t('chat.noHistory')}</Text>
        </View>
      ) : (
        <FlatList
          style={{ marginTop: 16 }}
          data={historyItems}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{ gap: 10, paddingBottom: 18 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/chat/[issueKey]',
                  params: { issueKey: item.key, persona: item.personaId },
                })
              }
              style={({ pressed }) => ({
                padding: 16,
                borderRadius: UI.radius.lg,
                backgroundColor: colors.card,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text
                  style={{ fontSize: 15, fontWeight: '900', color: colors.text, flex: 1, marginRight: 8 }}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text style={{ fontSize: 12, color: colors.mutedText }}>{item.date}</Text>
              </View>
              <Text
                style={{ color: colors.mutedText, marginTop: 6, fontSize: 14 }}
                numberOfLines={1}
              >
                {item.lastMessage}
              </Text>
              <Text style={{ color: colors.subtleText, marginTop: 4, fontSize: 11 }}>
                {item.messageCount} {item.messageCount === 1 ? 'message' : 'messages'}
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
