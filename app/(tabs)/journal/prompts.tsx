import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, TextInput, FlatList } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenHeader from '@/components/ScreenHeader';
import { JOURNAL_PROMPTS } from '@/data/journalPrompts';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';

export default function JournalPrompts() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { t } = useTranslation();
  const [q, setQ] = useState('');

  const data = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return JOURNAL_PROMPTS;
    return JOURNAL_PROMPTS.filter((p) =>
      (p.title + ' ' + p.prompt + ' ' + p.category).toLowerCase().includes(s),
    );
  }, [q]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        padding: UI.spacing.xl,
      }}
    >
      <ScreenHeader
        title={t('journalPrompts.title')}
        subtitle={t('journalPrompts.subtitle')}
        showBack
      />

      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder={t('journalPrompts.searchPlaceholder')}
        placeholderTextColor={colors.placeholder}
        style={{
          marginTop: 14,
          backgroundColor: colors.card,
          padding: 12,
          borderRadius: UI.radius.md,
          color: colors.text,
        }}
      />

      <FlatList
        style={{ marginTop: 14 }}
        data={data}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ gap: 10, paddingBottom: 18 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({ pathname: '/(tabs)/journal/new', params: { promptId: item.id } })
            }
            style={{ padding: 14, borderRadius: UI.radius.lg, backgroundColor: colors.card }}
          >
            <Text style={{ fontSize: 16, fontWeight: '900', color: colors.text }}>
              {item.title}
            </Text>
            <Text style={{ color: colors.mutedText, marginTop: 4 }}>{item.prompt}</Text>
            <Text style={{ color: colors.primary, marginTop: 8, fontWeight: '800' }}>
              {item.category.toUpperCase()}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}
