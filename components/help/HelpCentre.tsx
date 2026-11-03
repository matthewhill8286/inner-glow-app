import React, { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { SettingsScreen } from '@/components/settings/SettingsParts';
import { Icon } from '@/components/icons/Icon';
import { palette } from '@/constants/theme';
import { Type } from '@/constants/typography';
import { backTo } from '@/lib/navigation';
import { ContactPanel } from '@/components/help/ContactPanel';
import {
  filterHelpQuestions,
  HELP_CATEGORIES,
  HELP_QUESTIONS,
  type HelpCategory,
} from '@/lib/help-center';

export type HelpTab = 'faq' | 'contact';

/**
 * Help Centre (06 §P10–P11, `6722:4755` and `6722:4837`): one screen with an FAQ / Contact us
 * switch under the nav bar. The switch changes the content in place, with no new screen. The
 * track is white with a 1px `#E6E0EA` stroke, radius 22 and padding 4. The active tab is the
 * selected fill with a 1.5 plum stroke, radius 18, in SemiBold 14 plum; the other is Medium 14 muted.
 */
export function HelpCentre({ initialTab = 'faq' }: { initialTab?: HelpTab }) {
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
  const [tab, setTab] = useState<HelpTab>(initialTab);
  const contact = () => setTab('contact');
  return (
    <SettingsScreen
      title={t('helpCenter.title')}
      largeTitle={tab === 'faq' ? t('helpCenter.heading') : undefined}
      backLabel={t('common.back')}
      onBack={() => backTo(undefined, '/(tabs)/profile/settings')}
      contentStyle={{ gap: 20 }}
    >
      {tab === 'faq' && (
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
      )}
      <View
        accessibilityRole="tablist"
        style={{
          flexDirection: 'row',
          gap: 3,
          padding: 4,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: '#E6E0EA',
          backgroundColor: palette.white,
        }}
      >
        {(['faq', 'contact'] as const).map((key) => {
          const active = tab === key;
          return (
            <Pressable
              key={key}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setTab(key)}
              style={{
                flex: 1,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: active ? palette.selected : 'transparent',
                borderWidth: active ? 1.5 : 0,
                borderColor: palette.plum,
              }}
            >
              <Text
                style={[
                  active ? Type.label : { ...Type.label, fontWeight: '500' },
                  { letterSpacing: 0, color: active ? palette.plum : palette.textMuted },
                ]}
              >
                {t(key === 'faq' ? 'helpCenter.faq' : 'helpCenter.contact')}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {tab === 'contact' ? (
        <ContactPanel />
      ) : (
        <>
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
                      style={[
                        expanded ? Type.bodyMSemi : Type.bodySm,
                        { flex: 1, color: palette.ink },
                      ]}
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
                  <Text style={[Type.bodyMSemi, { color: palette.plum }]}>
                    {t('helpCenter.reset')}
                  </Text>
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
        </>
      )}
    </SettingsScreen>
  );
}
