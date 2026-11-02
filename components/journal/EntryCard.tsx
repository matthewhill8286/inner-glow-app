import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon } from '@/components/icons/Icon';
import { journalMoodScore } from '@/lib/journal-entry';
import { moodStep } from '@/lib/mood-scale';
import type { JournalEntry } from '@/lib/types';

/** Journal entry card (04 J1 Recent): date block, mood face, title, two-line excerpt and tags. */
export function EntryCard({ entry, lang }: { entry: JournalEntry; lang: string }) {
  const { t } = useTranslation();
  const date = new Date(entry.createdAt);
  const score = journalMoodScore(entry.mood);
  const title = entry.title?.trim() || t('journalDetail.untitledEntry');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${date.toLocaleDateString(lang, { day: 'numeric', month: 'long' })}`}
      onPress={() => router.push({ pathname: '/(tabs)/journal/[id]', params: { id: entry.id } })}
      style={({ pressed }) => ({
        flexDirection: 'row',
        gap: 12,
        borderRadius: 24,
        backgroundColor: palette.white,
        padding: 16,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View
        style={{
          width: 44,
          height: 52,
          borderRadius: 16,
          backgroundColor: palette.surfaceLilacSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={[Type.micro, { fontSize: 10, lineHeight: 14, color: palette.textSubtle }]}>
          {date.toLocaleDateString(lang, { month: 'short' }).toUpperCase()}
        </Text>
        <Text style={[Type.headline, { fontSize: 17, lineHeight: 24, color: palette.ink }]}>
          {date.getDate()}
        </Text>
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {score && <Icon name={moodStep(score).face} size={18} color={palette.plum} />}
          <Text
            numberOfLines={1}
            style={[Type.bodyMSemi, { flex: 1, lineHeight: 21, color: palette.ink }]}
          >
            {title}
          </Text>
        </View>
        {!!entry.content?.trim() && (
          <Text
            numberOfLines={2}
            style={[Type.captionS, { lineHeight: 17, color: palette.textMuted }]}
          >
            {entry.content.trim()}
          </Text>
        )}
        {(entry.tags ?? []).length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {(entry.tags ?? []).slice(0, 3).map((tag) => (
              <View
                key={tag}
                style={{
                  backgroundColor: palette.selected,
                  borderRadius: 999,
                  paddingVertical: 2,
                  paddingHorizontal: 8,
                }}
              >
                <Text style={[Type.tag, { fontSize: 11, lineHeight: 15, color: palette.plum }]}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}
