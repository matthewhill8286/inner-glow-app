import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { GlowField } from '@/components/glow/Glow';
import { NavBar } from '@/components/ui/IconButton';
import { AppField } from '@/components/ui/AppField';
import { ListRow } from '@/components/ui/ListRow';
import { LegalNote } from '@/components/ui/controls';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusState } from '@/components/ui/StatusState';
import { EmptyScreen } from '@/components/EmptyScreen';
import { useChat } from '@/hooks/useChat';
import { useTopics } from '@/hooks/useTopics';
import { backTo } from '@/lib/navigation';
import { showAlert } from '@/lib/state';
import { matchesConversation } from '@/lib/conversation-display';
import { talkDate, talkGroup, talkIcon, talkSummary, talkTitle } from '@/lib/talks';
import type { IconName } from '@/components/icons/iconData';

type Talk = { key: string; personaId: string; icon: IconName; title: string; summary: string; date: string; group: 'thisWeek' | 'earlier' };

/** Delete action revealed by swiping a row left (09 §3.1). */
function DeleteAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{ width: 88, backgroundColor: palette.danger, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={[Type.buttonS, { color: palette.white }]}>{label}</Text>
    </Pressable>
  );
}

/**
 * Glow AI · Conversation history (09 §3.1): Nav Bar "Your talks", the library Search Field, talks in
 * "This week" (Monday start) and "Earlier" List Groups with a topic icon, title, one-line summary and
 * date, swipe left to delete with a confirm, and the privacy note. No talks at all shows 09 §3.5.
 */
export default function ChatHistory() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { conversations, isLoading, error, refresh, clearHistory } = useChat();
  const { topics } = useTopics();
  const [query, setQuery] = useState('');
  const firstTalk = conversations.at(-1)?.raw;

  const talks = useMemo(
    () =>
      conversations
        .map((c) => {
          const topicName = topics.find((topic) => topic.id === c.topicId)?.name;
          const title = talkTitle(c.messages, topicName ?? t('glowAi.newTalk'));
          const talk: Talk & { search: string } = {
            key: c.raw,
            personaId: c.personaId,
            icon: talkIcon({ personaId: c.personaId, topicId: c.topicId, topicName }, c.raw === firstTalk),
            title,
            summary: talkSummary(c.messages),
            date: talkDate(c.updatedAt, i18n.language, t('glowAi.today')),
            group: talkGroup(c.updatedAt),
            search: `${title} ${talkSummary(c.messages, 400)} ${topicName ?? ''}`,
          };
          return talk;
        })
        .filter((talk) => matchesConversation(query, talk.search, '', '')),
    [conversations, topics, firstTalk, query, i18n.language, t],
  );

  const back = () => backTo('/(tabs)/chat', '/(tabs)/chat');
  const open = (talk: Talk) =>
    router.push({ pathname: '/(tabs)/chat/[issueKey]', params: { issueKey: talk.key, persona: talk.personaId, from: '/(tabs)/chat/history' } });
  const confirmDelete = (talk: Talk) =>
    showAlert(t('glowAi.history.deleteTitle'), t('glowAi.history.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('glowAi.history.delete'), style: 'destructive', onPress: () => void clearHistory(talk.key) },
    ]);

  // Glow AI · No talks yet (09 §3.5): no search field until there is something to search.
  if (!isLoading && !error && conversations.length === 0) {
    return (
      <EmptyScreen
        header={{ kind: 'nav', title: t('emptyStates.talks.title'), backLabel: t('common.back'), onBack: back }}
        glowColor={palette.lavenderSoft}
        title={t('emptyStates.talks.emptyTitle')}
        body={t('emptyStates.talks.body')}
        action={{
          label: t('emptyStates.talks.action'),
          onPress: () => router.push({ pathname: '/(tabs)/chat/new-conversation', params: { from: '/(tabs)/chat/history' } }),
        }}
        tabBarVisible={false}
      />
    );
  }

  const groups = (['thisWeek', 'earlier'] as const)
    .map((g) => ({ key: g, items: talks.filter((talk) => talk.group === g) }))
    .filter((g) => g.items.length);

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <GlowField
        glows={[
          { color: palette.lavenderSoft, opacity: 0.25, x: -70, y: -50, width: 280, blur: 90 },
          { color: palette.sky, opacity: 0.15, x: 200, y: 40, width: 220, blur: 90 },
        ]}
      />
      <NavBar title={t('emptyStates.talks.title')} backLabel={t('common.back')} onBack={back} style={{ marginTop: insets.top + 10, marginHorizontal: 24 }} />
      <ScrollView
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: 18, paddingHorizontal: 24, paddingBottom: insets.bottom + 32, gap: 24 }}
      >
        <AppField variant="search" value={query} onChangeText={setQuery} placeholder={t('glowAi.history.search')} autoCorrect={false} returnKeyType="search" />
        {error ? (
          <StatusState
            title="Could not load conversations"
            message="Please try again. Your saved conversations have not been removed."
            busy={isLoading}
            onRetry={() => void refresh()}
          />
        ) : isLoading && conversations.length === 0 ? (
          <ActivityIndicator color={palette.plum} />
        ) : groups.length === 0 ? (
          <EmptyState glowColor={palette.lavenderSoft} title={t('glowAi.history.noMatchesTitle')} body={t('glowAi.history.noMatchesBody')} />
        ) : (
          groups.map((group) => (
            <View key={group.key} style={{ gap: 10 }}>
              <Text accessibilityRole="header" style={[Type.labelM, { color: palette.lavender }]}>
                {t(`glowAi.history.${group.key}`)}
              </Text>
              <View style={{ backgroundColor: palette.white, borderRadius: 24, overflow: 'hidden' }}>
                {group.items.map((talk, i) => (
                  <ReanimatedSwipeable
                    key={talk.key}
                    friction={2}
                    rightThreshold={40}
                    overshootRight={false}
                    renderRightActions={() => <DeleteAction label={t('glowAi.history.delete')} onPress={() => confirmDelete(talk)} />}
                  >
                    <View style={{ backgroundColor: palette.white }}>
                      <ListRow
                        icon={talk.icon}
                        label={talk.title}
                        supportingText={talk.summary}
                        trailing="value"
                        value={talk.date}
                        singleLine
                        divider={i > 0}
                        onPress={() => open(talk)}
                        accessibilityLabel={`${talk.title}. ${talk.summary}. ${talk.date}`}
                      />
                    </View>
                  </ReanimatedSwipeable>
                ))}
              </View>
            </View>
          ))
        )}
        {groups.length > 0 && <LegalNote text={t('glowAi.history.note')} />}
      </ScrollView>
    </View>
  );
}
