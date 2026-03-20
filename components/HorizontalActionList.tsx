import React from 'react';
import { View, Text, Pressable, ScrollView, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors, UI } from '@/constants/theme';
import { IconSymbol } from '@/components/icon-symbol';

interface Action {
  title: string;
  subtitle: string;
  onPress: () => void;
  icon: any;
  color: string;
  emoji: string;
}

export function HorizontalActionList({ title }: { title: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];

  const actions: Action[] = [
    {
      title: t('quickActions.stressTitle'),
      subtitle: t('quickActions.stressSubtitle'),
      onPress: () => router.push('/(tabs)/stress'),
      icon: 'bolt.fill',
      color: colors.scoreOrange,
      emoji: '⚡',
    },
    {
      title: t('quickActions.moodTitle'),
      subtitle: t('quickActions.moodSubtitle'),
      onPress: () => router.push('/(tabs)/mood'),
      icon: 'text.bubble',
      color: colors.scoreGreen,
      emoji: '😊',
    },
    {
      title: t('quickActions.journalTitle'),
      subtitle: t('quickActions.journalSubtitle'),
      onPress: () => router.push('/(tabs)/journal'),
      icon: 'note.text',
      color: colors.scorePurple,
      emoji: '📝',
    },
    {
      title: t('quickActions.chatTitle'),
      subtitle: t('quickActions.chatSubtitle'),
      onPress: () => router.push('/(tabs)/chat'),
      icon: 'paperplane.fill',
      color: colors.primary,
      emoji: '💬',
    },
    {
      title: t('quickActions.sleepTitle'),
      subtitle: t('quickActions.sleepSubtitle'),
      onPress: () => router.push('/(tabs)/sleep'),
      icon: 'moon.stars.fill',
      color: colors.accent,
      emoji: '🌙',
    },
  ];

  return (
    <View style={{ marginTop: 24, marginBottom: 8 }}>
      <Text
        style={{
          fontSize: 17,
          fontWeight: '800',
          color: colors.text,
          paddingHorizontal: 4,
          marginBottom: 14,
        }}
      >
        {title}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingHorizontal: 4 }}
      >
        {actions.map((action) => (
          <Pressable
            key={action.title}
            onPress={action.onPress}
            style={({ pressed }) => [
              {
                width: 170,
                backgroundColor: colors.card,
                borderRadius: UI.radius.xl,
                padding: 16,
                borderWidth: 1,
                borderColor: pressed ? action.color + '30' : colors.border,
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
                ...UI.shadow.sm,
              },
            ]}
          >
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                backgroundColor: action.color + '14',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 20 }}>{action.emoji}</Text>
            </View>
            <Text
              style={{
                fontSize: 15,
                fontWeight: '800',
                color: colors.text,
                marginBottom: 4,
              }}
              numberOfLines={1}
            >
              {action.title}
            </Text>
            <Text
              style={{ fontSize: 12, color: colors.mutedText, lineHeight: 17 }}
              numberOfLines={2}
            >
              {action.subtitle}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
