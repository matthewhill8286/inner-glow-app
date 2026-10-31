import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Colors, UI } from '@/constants/theme';
import { Typography } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from '@/components/AppIcon';
import type { ConversationMeta } from '@/hooks/useChat';
import { conversationTitle, conversationPreview } from '@/lib/conversation-display';
export function ConversationRow({
  conversation,
  topic,
  onPress,
}: {
  conversation: ConversationMeta;
  topic: string;
  onPress: () => void;
}) {
  const colors = Colors[useColorScheme() ?? 'light'];
  const title = conversationTitle(conversation.messages, topic);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Continue ${title}`}
      onPress={onPress}
      style={({ pressed }) => ({
        padding: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: UI.radius.lg,
        backgroundColor: colors.card,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <Text numberOfLines={2} style={[Typography.cardHeading, { flex: 1, color: colors.text }]}>
          {title}
        </Text>
        <MaterialIcons name="chevron-right" size={20} color={colors.mutedText} />
      </View>
      <Text style={[Typography.caption, { color: colors.mutedText }]}>
        {conversation.persona.name} · {topic}
      </Text>
      <Text numberOfLines={1} style={[Typography.body, { color: colors.mutedText }]}>
        {conversationPreview(conversation.messages)}
      </Text>
      <Text style={[Typography.caption, { color: colors.subtleText }]}>
        {conversation.updatedAt
          ? new Date(conversation.updatedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })
          : ''}{' '}
        · {conversation.messages.length} messages
      </Text>
    </Pressable>
  );
}
