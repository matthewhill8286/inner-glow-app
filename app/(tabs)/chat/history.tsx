import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import ScreenHeader from '@/components/ScreenHeader';
import { ConversationRow } from '@/components/ConversationRow';
import { AppField } from '@/components/ui/AppField';
import { AppButton } from '@/components/ui/AppButton';
import { StatusState } from '@/components/ui/StatusState';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import { Typography } from '@/constants/typography';
import { useChat } from '@/hooks/useChat';
import { useTopics } from '@/hooks/useTopics';
import { conversationTitle, matchesConversation } from '@/lib/conversation-display';
import { screenBottomPadding } from '@/lib/screen-layout';
import { backTo } from '@/lib/navigation';
export default function ChatHistory() {
  const colors = Colors[useColorScheme() ?? 'light'];
  const insets = useSafeAreaInsets();
  const { conversations, isLoading, error, refresh } = useChat();
  const { topics } = useTopics();
  const [query, setQuery] = useState('');
  const items = useMemo(
    () =>
      conversations
        .map((conversation) => ({
          conversation,
          topic:
            topics.find((topic) => topic.id === conversation.topicId)?.name ??
            conversation.persona.speciality,
        }))
        .filter(({ conversation, topic }) =>
          matchesConversation(
            query,
            conversationTitle(conversation.messages, topic),
            conversation.persona.name,
            topic,
          ),
        ),
    [conversations, topics, query],
  );
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingHorizontal: UI.spacing.xl }}>
      <ScreenHeader
        title="Conversation history"
        subtitle="Find a conversation and continue where you left off."
        showBack
        onBack={() => backTo('/(tabs)/chat', '/(tabs)/chat')}
      />
      <AppField
        label="Search conversations"
        placeholder="Search by conversation, coach or topic"
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        returnKeyType="search"
      />
      {error && (
        <StatusState
          title="Could not load conversations"
          message="Please try again. Your saved conversations have not been removed."
          busy={isLoading}
          onRetry={() => {
            void refresh();
          }}
        />
      )}
      {isLoading && conversations.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} />
      ) : (
        <FlatList
          style={{ marginTop: 16 }}
          data={items}
          keyExtractor={(item) => item.conversation.raw}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            gap: 12,
            paddingBottom: screenBottomPadding(insets.bottom, false),
          }}
          ListEmptyComponent={
            !error ? (
              <View style={{ gap: 12, paddingVertical: 24 }}>
                <Text
                  accessibilityRole="header"
                  style={[Typography.section, { color: colors.text }]}
                >
                  {query ? 'No matching conversations' : 'Your conversations will appear here'}
                </Text>
                <Text style={[Typography.body, { color: colors.mutedText }]}>
                  {query
                    ? 'Try another title, coach or topic.'
                    : 'Start with a thought or choose a prompt.'}
                </Text>
                <AppButton
                  title={query ? 'Clear search' : 'Start a conversation'}
                  variant="secondary"
                  onPress={() =>
                    query
                      ? setQuery('')
                      : router.push({
                          pathname: '/(tabs)/chat/new-conversation',
                          params: { from: '/(tabs)/chat/history' },
                        })
                  }
                />
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <ConversationRow
              conversation={item.conversation}
              topic={item.topic}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/chat/[issueKey]',
                  params: {
                    issueKey: item.conversation.raw,
                    persona: item.conversation.personaId,
                    from: '/(tabs)/chat/history',
                  },
                })
              }
            />
          )}
        />
      )}
    </View>
  );
}
