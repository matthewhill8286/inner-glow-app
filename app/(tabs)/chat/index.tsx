import React, { useMemo } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { GlowField, GlowOrb } from '@/components/glow/Glow';
import { AppButton } from '@/components/ui/AppButton';
import { IconButton } from '@/components/ui/IconButton';
import { StatusState } from '@/components/ui/StatusState';
import { TalkCard } from '@/components/chat/ChatParts';
import { useChat } from '@/hooks/useChat';
import { useProfile } from '@/hooks/useProfile';
import { useTopics } from '@/hooks/useTopics';
import { usePremiumGate } from '@/hooks/usePremiumGate';
import { screenBottomPadding } from '@/lib/screen-layout';
import { talkDate, talkIcon, talkSummary, talkTitle } from '@/lib/talks';

/**
 * Glow AI home (05 §3.1): "Glow AI" title with a settings button, the S=209 orb, the greeting, one
 * "Start talking" button and the three most recent talks with "See all". The design's Voice button
 * and the free-plan quota line wait for voice mode and a free tier.
 */
export default function GlowAiHome() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { conversations, isLoading, error, refresh } = useChat();
  const { topics } = useTopics();
  const { profile } = useProfile();
  const { requirePremium } = usePremiumGate();
  const firstName = (profile?.name ?? '').trim().split(/\s+/)[0] ?? '';
  const firstTalk = conversations.at(-1)?.raw;

  const recent = useMemo(
    () =>
      conversations.slice(0, 3).map((c) => {
        const topicName = topics.find((topic) => topic.id === c.topicId)?.name;
        return {
          key: c.raw,
          personaId: c.personaId,
          icon: talkIcon({ personaId: c.personaId, topicId: c.topicId, topicName }, c.raw === firstTalk),
          title: talkTitle(c.messages, topicName ?? t('glowAi.newTalk')),
          summary: talkSummary(c.messages),
          date: talkDate(c.updatedAt, i18n.language, t('glowAi.today')),
        };
      }),
    [conversations, topics, firstTalk, i18n.language, t],
  );

  const startTalking = () => {
    if (isLoading || requirePremium()) return;
    router.push({ pathname: '/(tabs)/chat/new-conversation', params: { from: '/(tabs)/chat' } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <GlowField
        glows={[
          { color: palette.mustard, opacity: 0.28, x: -50, y: -20, width: 280, blur: 80 },
          { color: palette.lavenderSoft, opacity: 0.25, x: 180, y: 60, width: 220, blur: 80 },
        ]}
      />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 24, paddingBottom: screenBottomPadding(insets.bottom) }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text accessibilityRole="header" style={[Type.titleXl, { lineHeight: 42, color: palette.ink }]}>
            {t('glowAi.title')}
          </Text>
          <IconButton
            variant="solid"
            icon="line/filter"
            iconSize={20}
            accessibilityLabel={t('glowAi.settings')}
            onPress={() => router.push({ pathname: '/(tabs)/chat/customize', params: { from: '/(tabs)/chat' } })}
          />
        </View>

        <GlowOrb size={209} style={{ alignSelf: 'center', marginTop: 42 }} />
        <Text style={[Type.titleLg, { lineHeight: 36, color: palette.ink, textAlign: 'center', marginTop: 16 }]}>
          {firstName ? t('glowAi.greeting', { name: firstName }) : t('glowAi.greetingNoName')}
        </Text>
        <Text style={[Type.bodySm, { color: palette.textMuted, textAlign: 'center', marginTop: 2 }]}>{t('glowAi.subtitle')}</Text>
        <AppButton title={t('glowAi.start')} icon="line/chat" iconPosition="left" onPress={startTalking} style={{ marginTop: 24 }} />

        {error ? (
          <StatusState
            title="Could not load conversations"
            message="Please try again. Your saved conversations have not been removed."
            busy={isLoading}
            onRetry={() => void refresh()}
          />
        ) : recent.length > 0 ? (
          <View style={{ marginTop: 42, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
              <Text accessibilityRole="header" style={[Type.bodyStrong, { color: palette.ink }]}>
                {t('glowAi.recent')}
              </Text>
              <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/chat/history')} hitSlop={10}>
                <Text style={[Type.buttonS, { color: palette.lavender }]}>{t('glowAi.seeAll')}</Text>
              </Pressable>
            </View>
            {recent.map((talk) => (
              <TalkCard
                key={talk.key}
                icon={talk.icon}
                title={talk.title}
                summary={talk.summary}
                date={talk.date}
                onPress={() =>
                  router.push({ pathname: '/(tabs)/chat/[issueKey]', params: { issueKey: talk.key, persona: talk.personaId, from: '/(tabs)/chat' } })
                }
              />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
