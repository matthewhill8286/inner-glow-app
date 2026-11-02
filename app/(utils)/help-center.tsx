import React, { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { SettingsScreen } from '@/components/settings/SettingsParts';
import { Icon } from '@/components/icons/Icon';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { backTo } from '@/lib/navigation';
import {
  filterHelpQuestions,
  HELP_CATEGORIES,
  HELP_QUESTIONS,
  type HelpCategory,
} from '@/lib/help-center';

export default function HelpCenter() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<HelpCategory>('all');
  const [open, setOpen] = useState<string | null>('therapist');
  const questions = HELP_QUESTIONS.map((item) => ({
    ...item,
    question: t(`helpCenter.questions.${item.id}.question`),
    answer: t(`helpCenter.questions.${item.id}.answer`),
  }));
  const visible = filterHelpQuestions(questions, category, query);
  const contact = () => router.push('/(utils)/support');
  return (
    <SettingsScreen
      title={t('helpCenter.title')}
      largeTitle={t('helpCenter.heading')}
      backLabel={t('common.back')}
      onBack={() => backTo(undefined, '/(tabs)/profile/settings')}
      contentStyle={{ gap: 20 }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 16,
          borderRadius: 16,
          minHeight: 52,
          backgroundColor: palette.white,
          borderWidth: 1,
          borderColor: palette.borderLilac,
        }}
      >
        <Icon name="line/search" size={20} />
        <TextInput
          accessibilityLabel={t('helpCenter.search')}
          placeholder={t('helpCenter.search')}
          placeholderTextColor={palette.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
          style={[Type.bodySm, { flex: 1, paddingVertical: 14, color: palette.ink }]}
        />
      </View>
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: palette.selected,
          borderRadius: 22,
          padding: 4,
        }}
      >
        <View
          accessibilityRole="tab"
          accessibilityState={{ selected: true }}
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 18,
            alignItems: 'center',
            backgroundColor: palette.white,
          }}
        >
          <Text style={[Type.bodyMSemi, { color: palette.plum }]}>{t('helpCenter.faq')}</Text>
        </View>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: false }}
          onPress={contact}
          style={{ flex: 1, padding: 10, alignItems: 'center' }}
        >
          <Text style={[Type.bodySm, { color: palette.textMuted }]}>{t('helpCenter.contact')}</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {HELP_CATEGORIES.map((item) => (
          <Pressable
            key={item}
            accessibilityRole="button"
            accessibilityState={{ selected: category === item }}
            onPress={() => setCategory(item)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: category === item ? palette.plum : palette.surface,
            }}
          >
            <Text
              style={[
                Type.captionM,
                { color: category === item ? palette.white : palette.textMuted },
              ]}
            >
              {t(`helpCenter.categories.${item}`)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={{ gap: 12 }}>
        {visible.map((item) => {
          const expanded = open === item.id;
          return (
            <View
              key={item.id}
              style={{
                backgroundColor: palette.white,
                borderRadius: expanded ? 24 : 20,
                borderWidth: expanded ? 1.5 : 0,
                borderColor: palette.plum,
              }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                onPress={() => setOpen(expanded ? null : item.id)}
                style={{
                  minHeight: 58,
                  padding: 18,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <Text
                  style={[expanded ? Type.bodyMSemi : Type.bodySm, { flex: 1, color: palette.ink }]}
                >
                  {item.question}
                </Text>
                <Icon name={expanded ? 'arrow/chevron-up' : 'arrow/chevron-down'} size={18} />
              </Pressable>
              {expanded && (
                <Text
                  style={[
                    Type.bodySm,
                    {
                      paddingHorizontal: 20,
                      paddingBottom: 20,
                      lineHeight: 20,
                      color: palette.plumDeep,
                    },
                  ]}
                >
                  {item.answer}
                </Text>
              )}
            </View>
          );
        })}
        {visible.length === 0 && (
          <View accessibilityLiveRegion="polite" style={{ padding: 20, gap: 8 }}>
            <Text style={[Type.bodyMSemi, { color: palette.ink }]}>
              {t('helpCenter.noResults')}
            </Text>
            <Text style={[Type.bodySm, { color: palette.textMuted }]}>
              {t('helpCenter.tryAgain')}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setQuery('');
                setCategory('all');
              }}
              style={{ paddingVertical: 12 }}
            >
              <Text style={[Type.bodyMSemi, { color: palette.plum }]}>{t('helpCenter.reset')}</Text>
            </Pressable>
          </View>
        )}
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={contact}
        style={{
          padding: 20,
          borderRadius: 20,
          backgroundColor: palette.selected,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[Type.bodyMSemi, { color: palette.ink }]}>
            {t('helpCenter.stillNeedHelp')}
          </Text>
          <Text style={[Type.bodySm, { color: palette.textMuted }]}>
            {t('helpCenter.writeToUs')}
          </Text>
        </View>
        <Icon name="arrow/chevron-right" size={20} />
      </Pressable>
      <Pressable
        accessibilityRole="link"
        onPress={() => router.push('/resources')}
        style={{ paddingVertical: 12 }}
      >
        <Text style={[Type.bodySm, { color: palette.plum }]}>{t('helpCenter.resources')}</Text>
      </Pressable>
    </SettingsScreen>
  );
}
