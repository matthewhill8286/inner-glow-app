import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import ScreenHeader from '@/components/ScreenHeader';
import AppIcon from '@/components/AppIcon';
import { AppButton } from '@/components/ui/AppButton';
import { Colors, UI } from '@/constants/theme';
import { Typography } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { backTo } from '@/lib/navigation';
import { screenBottomPadding } from '@/lib/screen-layout';
import {
  SEARCH_CATEGORIES,
  searchCatalogue,
  type SearchCategory,
  type SearchItem,
} from '@/lib/search-catalogue';

export default function Search() {
  const { t } = useTranslation();
  const colors = Colors[useColorScheme() ?? 'light'];
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [categories, setCategories] = useState<SearchCategory[]>([]);
  const [draftCategories, setDraftCategories] = useState<SearchCategory[]>([]);
  const [alphabetical, setAlphabetical] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const results = useMemo(
    () => searchCatalogue(query, categories, alphabetical, (key) => t(key)),
    [query, categories, alphabetical, t],
  );
  const toggle = (category: SearchCategory, values: SearchCategory[]) =>
    values.includes(category)
      ? values.filter((value) => value !== category)
      : [...values, category];
  function open(item: SearchItem) {
    Keyboard.dismiss();
    router.push(item.path as Href);
  }
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 6 }}>
      <View style={{ paddingHorizontal: 24 }}>
        <ScreenHeader
          title={t('search.title')}
          safeArea={false}
          showBack
          onBack={() => backTo(undefined, '/(tabs)/home')}
        />
        <View
          style={{
            minHeight: 52,
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: inputFocused ? colors.tint : colors.border,
            backgroundColor: colors.card,
            borderRadius: UI.radius.lg,
            paddingLeft: 14,
            paddingRight: 4,
            gap: 10,
          }}
        >
          <AppIcon name="search" size={21} color={colors.mutedText} />
          <TextInput
            accessibilityLabel={t('search.placeholder')}
            placeholder={t('search.placeholder')}
            value={query}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            onChangeText={setQuery}
            placeholderTextColor={colors.placeholder}
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
            style={[
              Typography.body,
              { flex: 1, minWidth: 0, color: colors.text, paddingVertical: 12 },
              ...(Platform.OS === 'web' ? [{ outlineStyle: 'none' } as any] : []),
            ]}
          />
          {!!query && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('searchFixes.clearSearch')}
              onPress={() => setQuery('')}
              style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <AppIcon name="close" size={19} color={colors.mutedText} />
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('search.filterTitle')}
            accessibilityState={{ selected: categories.length > 0 }}
            onPress={() => {
              Keyboard.dismiss();
              setDraftCategories([...categories]);
              setFilterVisible(true);
            }}
            style={{
              width: 44,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: UI.radius.md,
              backgroundColor: categories.length ? colors.inputBg : 'transparent',
            }}
          >
            <AppIcon
              name="tune"
              size={21}
              color={categories.length ? colors.tint : colors.mutedText}
            />
          </Pressable>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, flexShrink: 0, maxHeight: 64, marginTop: 12 }}
        contentContainerStyle={{
          alignItems: 'center',
          paddingHorizontal: 24,
          paddingBottom: 12,
          gap: 8,
        }}
      >
        {SEARCH_CATEGORIES.map((category) => {
          const selected = categories.includes(category.label);
          return (
            <Pressable
              key={category.label}
              accessibilityRole="checkbox"
              accessibilityLabel={t(category.labelKey)}
              accessibilityState={{ checked: selected }}
              aria-checked={selected}
              onPress={() => setCategories(toggle(category.label, categories))}
              style={{
                height: 44,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingHorizontal: 14,
                borderWidth: 1,
                borderRadius: UI.radius.md,
                borderColor: selected ? colors.tint : colors.border,
                backgroundColor: selected ? colors.inputBg : colors.card,
              }}
            >
              <AppIcon name={category.icon} size={17} color={colors.tint} />
              <Text
                style={[
                  Typography.caption,
                  { color: colors.text, fontWeight: Typography.weight.medium },
                ]}
              >
                {t(category.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View
        style={{
          paddingHorizontal: 24,
          paddingBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text
          accessibilityLiveRegion="polite"
          style={[Typography.caption, { color: colors.mutedText, flexShrink: 1 }]}
        >
          {query.trim() || categories.length
            ? t('searchFixes.results', { count: results.length })
            : t('search.quickAccess')}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('searchFixes.changeSort')}
          onPress={() => setAlphabetical(!alphabetical)}
          style={{
            minHeight: 44,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingLeft: 12,
          }}
        >
          <AppIcon name="sort" size={17} color={colors.mutedText} />
          <Text style={[Typography.caption, { color: colors.mutedText }]}>
            {alphabetical ? t('search.sortAZ') : t('searchFixes.recommended')}
          </Text>
        </Pressable>
      </View>
      <FlatList
        data={results}
        keyExtractor={(item) => item.key}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: screenBottomPadding(insets.bottom),
          gap: 10,
          flexGrow: results.length ? undefined : 1,
        }}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => open(item)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 16,
              minHeight: 84,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: UI.radius.xl,
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.inputBg,
              }}
            >
              <AppIcon name={item.icon} size={21} color={colors.tint} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[Typography.cardHeading, { color: colors.text }]}>
                {t(item.titleKey)}
              </Text>
              <Text style={[Typography.caption, { color: colors.mutedText }]}>
                {t(item.subtitleKey)}
              </Text>
            </View>
            <AppIcon name="chevron-right" size={20} color={colors.subtleText} />
          </Pressable>
        )}
        ListEmptyComponent={
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 32,
              gap: 12,
            }}
          >
            <AppIcon name="search-off" size={32} color={colors.mutedText} />
            <Text style={[Typography.section, { color: colors.text, textAlign: 'center' }]}>
              {t('search.notFoundTitle')}
            </Text>
            <Text style={[Typography.body, { color: colors.mutedText, textAlign: 'center' }]}>
              {t('search.notFoundMessage')}
            </Text>
            {!!categories.length && (
              <AppButton
                title={t('searchFixes.clearFilters')}
                variant="secondary"
                onPress={() => setCategories([])}
              />
            )}
          </View>
        }
      />
      <Modal
        visible={filterVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterVisible(false)}
      >
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
            onPress={() => setFilterVisible(false)}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View
            accessibilityViewIsModal
            style={{
              width: '100%',
              maxWidth: 560,
              maxHeight: '90%',
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
                {t('search.filterTitle')}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setDraftCategories([])}
                style={{ minHeight: 44, justifyContent: 'center' }}
              >
                <Text style={[Typography.caption, { color: colors.tint }]}>
                  {t('communityFilter.resetButton')}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
                onPress={() => setFilterVisible(false)}
                style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
              >
                <AppIcon name="close" size={22} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: 24 }}>
              {SEARCH_CATEGORIES.map((category) => (
                <Pressable
                  key={category.label}
                  accessibilityRole="checkbox"
                  accessibilityLabel={t(category.labelKey)}
                  accessibilityState={{ checked: draftCategories.includes(category.label) }}
                  aria-checked={draftCategories.includes(category.label)}
                  onPress={() => setDraftCategories(toggle(category.label, draftCategories))}
                  style={{
                    minHeight: 52,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <AppIcon name={category.icon} size={20} color={colors.tint} />
                  <Text style={[Typography.body, { color: colors.text, flex: 1 }]}>
                    {t(category.labelKey)}
                  </Text>
                  <AppIcon
                    name={
                      draftCategories.includes(category.label)
                        ? 'check-box'
                        : 'check-box-outline-blank'
                    }
                    size={22}
                    color={colors.tint}
                  />
                </Pressable>
              ))}
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
                onPress={() => {
                  setCategories([...draftCategories]);
                  setFilterVisible(false);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
