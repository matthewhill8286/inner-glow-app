import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import AppIcon from '@/components/AppIcon';
import { AppButton } from '@/components/ui/AppButton';
import { Colors, UI } from '@/constants/theme';
import { Typography } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CATEGORIES, type PostCategory, type PostType } from '@/lib/community';
import { WellnessIconText } from '@/components/WellnessIconText';

export function CommunityFilterSheet({
  categories,
  types,
  onClose,
  onApply,
}: {
  categories: PostCategory[];
  types: PostType[];
  onClose: () => void;
  onApply: (selection: { categories: PostCategory[]; types: PostType[] }) => void;
}) {
  const colors = Colors[useColorScheme() ?? 'light'];
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [topics, setTopics] = useState(new Set(categories));
  const [formats, setFormats] = useState(new Set(types));
  function toggle<T>(value: T, current: Set<T>, set: (next: Set<T>) => void) {
    const next = new Set(current);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    set(next);
  }
  const count = topics.size + formats.size;
  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          alignItems: 'center',
          backgroundColor: colors.overlay,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          onPress={onClose}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View
          accessibilityViewIsModal
          style={{
            width: '100%',
            maxWidth: 560,
            maxHeight: '92%',
            backgroundColor: colors.background,
            borderTopLeftRadius: UI.radius.xxl,
            borderTopRightRadius: UI.radius.xxl,
            paddingTop: 12,
          }}
        >
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.border,
              alignSelf: 'center',
              marginBottom: 12,
            }}
          />
          <View
            style={{ paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 12 }}
          >
            <Text
              accessibilityRole="header"
              style={[Typography.heading, { color: colors.text, flex: 1 }]}
            >
              {t('communityFilter.title')}
            </Text>
            <Pressable
              accessibilityRole="button"
              disabled={!count}
              onPress={() => {
                setTopics(new Set());
                setFormats(new Set());
              }}
              style={{ minHeight: 44, justifyContent: 'center', opacity: count ? 1 : 0.45 }}
            >
              <Text style={[Typography.caption, { color: colors.tint }]}>
                {t('communityFilter.resetButton')}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              onPress={onClose}
              style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <AppIcon name="close" size={22} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
            <Text style={[Typography.body, { color: colors.mutedText }]}>
              {t('communityFilter.subtitle')}
            </Text>
            <Text style={[Typography.label, { color: colors.mutedText }]}>
              {t('communityFilter.postTypeLabel')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {(['story', 'audio'] as const).map((type) => (
                <Pressable
                  key={type}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: formats.has(type) }}
                  aria-checked={formats.has(type)}
                  onPress={() => toggle(type, formats, setFormats)}
                  style={{
                    flex: 1,
                    minHeight: 48,
                    borderRadius: UI.radius.md,
                    borderWidth: 1,
                    borderColor: formats.has(type) ? colors.tint : colors.border,
                    backgroundColor: formats.has(type) ? colors.inputBg : colors.card,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <AppIcon name={type === 'story' ? 'edit' : 'mic'} size={18} color={colors.tint} />
                  <Text
                    style={[
                      Typography.caption,
                      { color: colors.text, fontWeight: Typography.weight.semibold },
                    ]}
                  >
                    {t(`communityFilter.postTypes.${type}`)}
                  </Text>
                  <AppIcon
                    name={formats.has(type) ? 'check-box' : 'check-box-outline-blank'}
                    size={18}
                    color={colors.tint}
                  />
                </Pressable>
              ))}
            </View>
            <Text style={[Typography.label, { color: colors.mutedText }]}>
              {t('communityFilter.topicsLabel')}
            </Text>
            <View
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: UI.radius.xl,
                overflow: 'hidden',
                backgroundColor: colors.card,
              }}
            >
              {CATEGORIES.map((category, index) => (
                <Pressable
                  key={category.key}
                  accessibilityRole="checkbox"
                  accessibilityLabel={category.label}
                  accessibilityState={{ checked: topics.has(category.key) }}
                  aria-checked={topics.has(category.key)}
                  onPress={() => toggle(category.key, topics, setTopics)}
                  style={{
                    minHeight: 52,
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    borderTopWidth: index ? 1 : 0,
                    borderTopColor: colors.divider,
                    backgroundColor: topics.has(category.key) ? colors.inputBg : colors.card,
                  }}
                >
                  <WellnessIconText style={{ fontSize: 20, color: colors.tint }}>
                    {category.emoji}
                  </WellnessIconText>
                  <Text style={[Typography.body, { color: colors.text, flex: 1 }]}>
                    {category.label}
                  </Text>
                  <AppIcon
                    name={topics.has(category.key) ? 'check-box' : 'check-box-outline-blank'}
                    size={22}
                    color={topics.has(category.key) ? colors.tint : colors.subtleText}
                  />
                </Pressable>
              ))}
            </View>
          </ScrollView>
          <View
            style={{
              paddingHorizontal: 24,
              paddingTop: 12,
              paddingBottom: Math.max(insets.bottom, 16),
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <AppButton
              title={t('communityDesign.applyFilters')}
              onPress={() =>
                onApply({ categories: [...topics].sort(), types: [...formats].sort() })
              }
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
