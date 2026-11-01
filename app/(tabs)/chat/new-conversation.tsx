import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { GlowField, GlowOrb } from '@/components/glow/Glow';
import { LegalNote } from '@/components/ui/controls';
import { ChatHeader, Composer, StarterRow } from '@/components/chat/ChatParts';
import { useChat } from '@/hooks/useChat';
import { usePremiumGate } from '@/hooks/usePremiumGate';
import { stageChatDraft } from '@/lib/chat-drafts';
import { getPersona } from '@/lib/chat';
import { buildNewChatKey } from '@/lib/chatKeys';
import { backTo } from '@/lib/navigation';
import type { IconName } from '@/components/icons/iconData';

const STARTERS: { key: 'anxious' | 'sleep' | 'vent' | 'reflect'; icon: IconName }[] = [
  { key: 'anxious', icon: 'line/activity' },
  { key: 'sleep', icon: 'line/moon' },
  { key: 'vent', icon: 'line/chat' },
  { key: 'reflect', icon: 'line/sparkle' },
];

/**
 * Glow AI · New chat (05 §3.2): the chat header, the S=152 orb, "What's on your mind?", four starter
 * rows and the composer with the legal note. A starter or typed text becomes the first message of a
 * new talk. There is no topic or persona choice in the design; the default companion is used unless
 * a caller passes one.
 */
export default function NewConversation() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { from, initialMessage, persona: personaParam } = useLocalSearchParams<{ from?: string; initialMessage?: string; persona?: string }>();
  const { isLoading } = useChat();
  const { requirePremium } = usePremiumGate();
  const persona = getPersona(personaParam);
  const [text, setText] = useState(initialMessage ?? '');

  function start(message: string) {
    const first = message.trim();
    if (!first || isLoading || requirePremium()) return;
    router.replace({
      pathname: '/(tabs)/chat/[issueKey]',
      params: { issueKey: stageChatDraft(buildNewChatKey(persona.id), first), from: '/(tabs)/chat', persona: persona.id },
    });
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: palette.bg }}>
      <GlowField
        glows={[
          { color: palette.mustard, opacity: 0.28, x: -50, y: -20, width: 280, blur: 80 },
          { color: palette.lavenderSoft, opacity: 0.25, x: 180, y: 60, width: 220, blur: 80 },
        ]}
      />
      <ChatHeader
        title={t('glowAi.title')}
        status={t('glowAi.chat.status')}
        backLabel={t('common.back')}
        onBack={() => backTo(from, '/(tabs)/chat')}
        style={{ marginTop: insets.top + 10, marginHorizontal: 24 }}
      />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16 }}>
        <GlowOrb size={152} style={{ alignSelf: 'center', marginTop: 60 }} />
        <Text accessibilityRole="header" style={[Type.titleMd, { fontSize: 24, lineHeight: 34, color: palette.ink, textAlign: 'center', marginTop: 16 }]}>
          {t('glowAi.newChat.title')}
        </Text>
        <Text style={[Type.bodySm, { color: palette.textMuted, textAlign: 'center', marginTop: 2 }]}>{t('glowAi.newChat.subtitle')}</Text>
        <View style={{ gap: 8, marginTop: 24 }}>
          {STARTERS.map((s) => {
            const label = t(`glowAi.newChat.starters.${s.key}`);
            return <StarterRow key={s.key} icon={s.icon} label={label} onPress={() => start(label)} />;
          })}
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 10, gap: 12 }}>
        <Composer
          value={text}
          onChangeText={setText}
          onSend={() => start(text)}
          placeholder={t('glowAi.composer.placeholder')}
          sendLabel={t('glowAi.composer.send')}
        />
        <LegalNote text={t('glowAi.note')} />
      </View>
    </KeyboardAvoidingView>
  );
}
