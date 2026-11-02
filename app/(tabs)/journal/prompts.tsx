import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { Icon } from '@/components/icons/Icon';
import { AppField } from '@/components/ui/AppField';
import { SettingsScreen } from '@/components/settings/SettingsParts';
import { JOURNAL_PROMPTS } from '@/data/journalPrompts';
import { backTo } from '@/lib/navigation';

/**
 * Journal prompts. There is no frame for this screen, so it uses the library shell, search field and
 * cards: tap a prompt to start Write entry with it.
 */
export default function JournalPrompts() {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const data = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return JOURNAL_PROMPTS;
    return JOURNAL_PROMPTS.filter((p) =>
      `${p.title} ${p.prompt} ${t(`journalPrompts.categories.${p.category}`)}`
        .toLowerCase()
        .includes(s),
    );
  }, [q, t]);

  return (
    <SettingsScreen
      title={t('journalPrompts.title')}
      backLabel={t('common.back')}
      onBack={() => backTo(undefined, '/(tabs)/journal')}
      contentStyle={{ gap: 16 }}
    >
      <Text style={[Type.bodyS, { color: palette.textMuted }]}>{t('journalPrompts.subtitle')}</Text>
      <AppField
        variant="search"
        value={q}
        onChangeText={setQ}
        placeholder={t('journalPrompts.searchPlaceholder')}
        accessibilityLabel={t('journalPrompts.searchPlaceholder')}
        autoCorrect={false}
      />
      <View style={{ gap: 10 }}>
        {data.map((p) => (
          <Pressable
            key={p.id}
            accessibilityRole="button"
            accessibilityLabel={`${p.title}. ${p.prompt}`}
            onPress={() =>
              router.push({ pathname: '/(tabs)/journal/new', params: { promptId: p.id } })
            }
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              backgroundColor: palette.white,
              borderRadius: 24,
              padding: 16,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={[Type.bodyMSemi, { lineHeight: 21, color: palette.ink }]}>
                {p.title}
              </Text>
              <Text style={[Type.captionM, { lineHeight: 19, color: palette.textMuted }]}>
                {p.prompt}
              </Text>
              <View
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: palette.selected,
                  borderRadius: 999,
                  paddingVertical: 2,
                  paddingHorizontal: 8,
                  marginTop: 2,
                }}
              >
                <Text style={[Type.tag, { fontSize: 11, lineHeight: 15, color: palette.plum }]}>
                  {t(`journalPrompts.categories.${p.category}`)}
                </Text>
              </View>
            </View>
            <Icon name="arrow/chevron-right" size={18} color={palette.plum} />
          </Pressable>
        ))}
        {data.length === 0 && (
          <Text
            style={[
              Type.captionM,
              { color: palette.textMuted, textAlign: 'center', marginTop: 12 },
            ]}
          >
            {t('journalPrompts.none')}
          </Text>
        )}
      </View>
    </SettingsScreen>
  );
}
