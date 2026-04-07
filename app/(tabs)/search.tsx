import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Platform,
  Modal,
  ScrollView,
  Animated,
  Dimensions,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import { useSubscription } from '@/hooks/useSubscription';
import { showAlert } from '@/lib/state';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';

/* ─────────────────────────────────────────────
   Searchable catalogue – every item the user
   can navigate to, with category metadata
   ───────────────────────────────────────────── */

type SearchCategory =
  | 'Sleep'
  | 'Mood'
  | 'Meditation'
  | 'Journal'
  | 'Community'
  | 'Home'
  | 'AI Chatbot'
  | 'Resources';

type SearchItem = {
  key: string;
  titleKey: string;
  subtitleKey: string;
  category: SearchCategory;
  categoryKey: string;
  path: string;
  isPremium?: boolean;
  icon: string;
  iconBg: string;
};

const SEARCH_ITEMS: SearchItem[] = [
  // ── Home ──
  { key: 'home', titleKey: 'search.items.homeTitle', subtitleKey: 'search.items.homeSubtitle', category: 'Home', categoryKey: 'search.categories.home', path: '/(tabs)/home', icon: 'home', iconBg: '#8B6B47' },
  // ── Mood ──
  { key: 'mood-history', titleKey: 'search.items.moodHistoryTitle', subtitleKey: 'search.items.moodHistorySubtitle', category: 'Mood', categoryKey: 'search.categories.mood', path: '/(tabs)/mood', icon: 'mood', iconBg: '#E8985A' },
  { key: 'mood-improvements', titleKey: 'search.items.moodImprovementsTitle', subtitleKey: 'search.items.moodImprovementsSubtitle', category: 'Mood', categoryKey: 'search.categories.mood', path: '/(tabs)/mood', icon: 'trending-up', iconBg: '#5B8A5A' },
  { key: 'mood-journals', titleKey: 'search.items.moodJournalsTitle', subtitleKey: 'search.items.moodJournalsSubtitle', category: 'Mood', categoryKey: 'search.categories.mood', path: '/(tabs)/journal', icon: 'menu-book', iconBg: '#5B8A5A' },
  { key: 'mood-ai', titleKey: 'search.items.moodAiTitle', subtitleKey: 'search.items.moodAiSubtitle', category: 'Mood', categoryKey: 'search.categories.mood', path: '/(tabs)/chat', icon: 'smart-toy', iconBg: '#7B6DC9', isPremium: true },
  { key: 'my-mood', titleKey: 'search.items.myMoodTitle', subtitleKey: 'search.items.myMoodSubtitle', category: 'Mood', categoryKey: 'search.categories.mood', path: '/(tabs)/mood', icon: 'emoji-emotions', iconBg: '#E8985A' },
  // ── Sleep ──
  { key: 'sleep-quality', titleKey: 'search.items.sleepQualityTitle', subtitleKey: 'search.items.sleepQualitySubtitle', category: 'Sleep', categoryKey: 'search.categories.sleep', path: '/(tabs)/sleep', icon: 'bedtime', iconBg: '#5A3E7A' },
  { key: 'sleep-history', titleKey: 'search.items.sleepHistoryTitle', subtitleKey: 'search.items.sleepHistorySubtitle', category: 'Sleep', categoryKey: 'search.categories.sleep', path: '/(tabs)/sleep/history', icon: 'history', iconBg: '#5A3E7A' },
  { key: 'sleep-insights', titleKey: 'search.items.sleepInsightsTitle', subtitleKey: 'search.items.sleepInsightsSubtitle', category: 'Sleep', categoryKey: 'search.categories.sleep', path: '/(tabs)/sleep/insights', icon: 'insights', iconBg: '#7B6DC9' },
  { key: 'sleep-schedule', titleKey: 'search.items.sleepScheduleTitle', subtitleKey: 'search.items.sleepScheduleSubtitle', category: 'Sleep', categoryKey: 'search.categories.sleep', path: '/(tabs)/sleep/schedule', icon: 'schedule', iconBg: '#5A3E7A' },
  { key: 'sleep-start', titleKey: 'search.items.sleepStartTitle', subtitleKey: 'search.items.sleepStartSubtitle', category: 'Sleep', categoryKey: 'search.categories.sleep', path: '/(tabs)/sleep/start', icon: 'nightlight-round', iconBg: '#2A1A3E' },
  // ── Meditation ──
  { key: 'meditation', titleKey: 'search.items.meditationTitle', subtitleKey: 'search.items.meditationSubtitle', category: 'Meditation', categoryKey: 'search.categories.meditation', path: '/(tabs)/mindful', icon: 'self-improvement', iconBg: '#5B8A5A' },
  { key: 'meditation-schedule', titleKey: 'search.items.meditationScheduleTitle', subtitleKey: 'search.items.meditationScheduleSubtitle', category: 'Meditation', categoryKey: 'search.categories.meditation', path: '/(tabs)/mindful', icon: 'event', iconBg: '#5B8A5A' },
  { key: 'meditation-ai', titleKey: 'search.items.meditationAiTitle', subtitleKey: 'search.items.meditationAiSubtitle', category: 'Meditation', categoryKey: 'search.categories.meditation', path: '/(tabs)/chat', icon: 'auto-awesome', iconBg: '#7B6DC9', isPremium: true },
  { key: 'my-meditation', titleKey: 'search.items.myMeditationTitle', subtitleKey: 'search.items.myMeditationSubtitle', category: 'Meditation', categoryKey: 'search.categories.meditation', path: '/(tabs)/mindful', icon: 'spa', iconBg: '#5B8A5A' },
  // ── Journal ──
  { key: 'journal', titleKey: 'search.items.journalTitle', subtitleKey: 'search.items.journalSubtitle', category: 'Journal', categoryKey: 'search.categories.journal', path: '/(tabs)/journal', icon: 'edit-note', iconBg: '#8B6B47' },
  { key: 'journal-prompts', titleKey: 'search.items.journalPromptsTitle', subtitleKey: 'search.items.journalPromptsSubtitle', category: 'Journal', categoryKey: 'search.categories.journal', path: '/(tabs)/journal', icon: 'lightbulb', iconBg: '#E8985A' },
  // ── Community ──
  { key: 'community', titleKey: 'search.items.communityTitle', subtitleKey: 'search.items.communitySubtitle', category: 'Community', categoryKey: 'search.categories.community', path: '/(tabs)/community', icon: 'people', iconBg: '#5B8A5A' },
  // ── AI Chatbot ──
  { key: 'chatbot', titleKey: 'search.items.chatbotTitle', subtitleKey: 'search.items.chatbotSubtitle', category: 'AI Chatbot', categoryKey: 'search.categories.aiChatbot', path: '/(tabs)/chat', icon: 'smart-toy', iconBg: '#7B6DC9', isPremium: true },
  // ── Resources ──
  { key: 'stress', titleKey: 'search.items.stressTitle', subtitleKey: 'search.items.stressSubtitle', category: 'Resources', categoryKey: 'search.categories.resources', path: '/(tabs)/stress', icon: 'psychology', iconBg: '#E8985A' },
  { key: 'notifications', titleKey: 'search.items.notificationsTitle', subtitleKey: 'search.items.notificationsSubtitle', category: 'Resources', categoryKey: 'search.categories.resources', path: '/(tabs)/notifications', icon: 'notifications', iconBg: '#8B6B47' },
  { key: 'profile', titleKey: 'search.items.profileTitle', subtitleKey: 'search.items.profileSubtitle', category: 'Resources', categoryKey: 'search.categories.resources', path: '/(tabs)/profile', icon: 'person', iconBg: '#8B6B47' },
  { key: 'help', titleKey: 'search.items.helpTitle', subtitleKey: 'search.items.helpSubtitle', category: 'Resources', categoryKey: 'search.categories.resources', path: '/(utils)/help-center', icon: 'help', iconBg: '#5A8FB5' },
  { key: 'assessment', titleKey: 'search.items.assessmentTitle', subtitleKey: 'search.items.assessmentSubtitle', category: 'Resources', categoryKey: 'search.categories.resources', path: '/(onboarding)/assessment', icon: 'assignment', iconBg: '#7B6DC9', isPremium: true },
];

/* ─── Category chips metadata ─── */
const CATEGORIES: { label: SearchCategory; labelKey: string; icon: string }[] = [
  { label: 'Sleep', labelKey: 'search.categories.sleep', icon: 'bedtime' },
  { label: 'Mood', labelKey: 'search.categories.mood', icon: 'mood' },
  { label: 'Meditation', labelKey: 'search.categories.meditation', icon: 'self-improvement' },
  { label: 'Journal', labelKey: 'search.categories.journal', icon: 'edit-note' },
  { label: 'Community', labelKey: 'search.categories.community', icon: 'people' },
  { label: 'Home', labelKey: 'search.categories.home', icon: 'home' },
  { label: 'AI Chatbot', labelKey: 'search.categories.aiChatbot', icon: 'smart-toy' },
  { label: 'Resources', labelKey: 'search.categories.resources', icon: 'more-horiz' },
];

type SortMode = 'Newest' | 'Oldest' | 'A-Z';

/* ═══════════════════════════════════════════════
   Main Search Screen
   ═══════════════════════════════════════════════ */
export default function Search() {
  const { t } = useTranslation();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { hasFullAccess } = useSubscription();
  const insets = useSafeAreaInsets();

  /* ── state ── */
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('Newest');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Filter modal
  const [filterVisible, setFilterVisible] = useState(false);
  const [filterCategories, setFilterCategories] = useState<SearchCategory[]>([]);
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [filterLimitMin] = useState(20);
  const [filterLimitMax] = useState(50);

  // Applied filters
  const [appliedCategories, setAppliedCategories] = useState<SearchCategory[]>([]);

  const inputRef = useRef<TextInput>(null);

  /* ── Loading dots animation ── */
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isSearching) return;
    const makeDot = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -12, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      );
    const a1 = makeDot(dot1, 0);
    const a2 = makeDot(dot2, 150);
    const a3 = makeDot(dot3, 300);
    a1.start();
    a2.start();
    a3.start();
    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [isSearching]);

  /* ── Simulate brief loading on query change ── */
  useEffect(() => {
    if (!query.trim()) {
      setHasSearched(false);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const t = setTimeout(() => {
      setIsSearching(false);
      setHasSearched(true);
    }, 600);
    return () => clearTimeout(t);
  }, [query]);

  /* ── Autocomplete suggestions ── */
  const suggestions = useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s || s.length < 2) return [];
    return SEARCH_ITEMS.filter((i) => t(i.titleKey).toLowerCase().includes(s))
      .slice(0, 5)
      .map((i) => t(i.titleKey));
  }, [query, t]);

  /* ── Filtered & sorted results ── */
  const results = useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s) return [];
    let items = SEARCH_ITEMS.filter((i) =>
      (t(i.titleKey) + ' ' + t(i.subtitleKey) + ' ' + t(i.categoryKey)).toLowerCase().includes(s),
    );
    if (appliedCategories.length > 0) {
      items = items.filter((i) => appliedCategories.includes(i.category));
    }
    if (sortMode === 'A-Z') items.sort((a, b) => t(a.titleKey).localeCompare(t(b.titleKey)));
    else if (sortMode === 'Oldest') items = [...items].reverse();
    return items;
  }, [query, appliedCategories, sortMode, t]);

  const activeFilterCount = appliedCategories.length + (filterDate ? 1 : 0);

  /* ── Callbacks ── */
  const handleItemPress = useCallback(
    (item: SearchItem) => {
      Keyboard.dismiss();
      if (item.isPremium && !hasFullAccess) {
        showAlert(t('search.premiumFeature'), t('search.premiumMessage'), [
          { text: t('search.cancel'), style: 'cancel' },
          { text: t('search.upgrade'), onPress: () => router.push('/(utils)/trial-upgrade' as any) },
        ]);
        return;
      }
      router.push(item.path as any);
    },
    [hasFullAccess],
  );

  const handleSuggestionPress = useCallback((s: string) => {
    setQuery(s);
    setIsFocused(false);
    Keyboard.dismiss();
  }, []);

  const applyFilters = useCallback(() => {
    setAppliedCategories([...filterCategories]);
    setFilterVisible(false);
  }, [filterCategories]);

  const toggleFilterCat = useCallback((cat: SearchCategory) => {
    setFilterCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  }, []);

  /* ── View states ── */
  const showLoading = isSearching && query.trim().length > 0;
  const showSuggestions = isFocused && suggestions.length > 0 && !hasSearched && !isSearching;
  const showNotFound =
    hasSearched && !isSearching && results.length === 0 && query.trim().length > 0;
  const showResults = hasSearched && !isSearching && results.length > 0;

  /* ═══════════════════════════════
     RENDER
     ═══════════════════════════════ */
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* ────── Header ────── */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: UI.spacing.xl,
          paddingBottom: UI.spacing.md,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
              ...UI.shadow.sm,
            })}
          >
            <MaterialIcons
              name="arrow-back-ios"
              size={16}
              color={colors.text}
              style={{ marginLeft: 4 }}
            />
          </Pressable>
          <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>{t('search.title')}</Text>
        </View>
      </View>

      {/* ────── Search Bar ────── */}
      <View style={{ paddingHorizontal: UI.spacing.xl, marginBottom: 4, zIndex: 20 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.card,
            borderRadius: UI.radius.xl,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 14,
            height: 50,
            ...UI.shadow.sm,
          }}
        >
          <MaterialIcons name="search" size={22} color={colors.mutedText} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder={t('search.placeholder')}
            placeholderTextColor={colors.placeholder}
            style={{ flex: 1, marginLeft: 10, fontSize: 15, color: colors.text }}
            returnKeyType="search"
          />
          <Pressable
            onPress={() => {
              setFilterCategories([...appliedCategories]);
              setFilterVisible(true);
            }}
            style={({ pressed }) => ({ padding: 6, opacity: pressed ? 0.6 : 1 })}
          >
            <MaterialIcons
              name="tune"
              size={22}
              color={activeFilterCount > 0 ? '#8B6B47' : colors.mutedText}
            />
            {activeFilterCount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: '#8B6B47',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>
                  {activeFilterCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* ── Autocomplete Dropdown ── */}
        {showSuggestions && (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: UI.radius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              marginTop: 4,
              ...UI.shadow.md,
            }}
          >
            {suggestions.map((s, i) => (
              <Pressable
                key={s}
                onPress={() => handleSuggestionPress(s)}
                style={({ pressed }) => ({
                  paddingHorizontal: 16,
                  paddingVertical: 13,
                  borderBottomWidth: i < suggestions.length - 1 ? 1 : 0,
                  borderBottomColor: colors.divider,
                  backgroundColor: pressed ? colors.inputBg : 'transparent',
                })}
              >
                <Text style={{ fontSize: 15, color: colors.text }}>{s}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* ────── Loading State ────── */}
      {showLoading && (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 100 }}
        >
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            {[dot1, dot2, dot3].map((dot, i) => (
              <Animated.View
                key={i}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  backgroundColor: i === 0 ? '#5B8A5A' : i === 1 ? '#8B6B47' : '#7B6DC9',
                  transform: [{ translateY: dot }],
                }}
              />
            ))}
          </View>
          <Text style={{ color: colors.mutedText, fontSize: 15 }}>{t('search.loading')}</Text>
        </View>
      )}

      {/* ────── Not Found State ────── */}
      {showNotFound && (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: 80,
            paddingHorizontal: 40,
          }}
        >
          <View
            style={{
              width: 160,
              height: 160,
              borderRadius: 80,
              backgroundColor: colors.inputBg,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
            }}
          >
            <MaterialIcons name="search-off" size={72} color={colors.mutedText} />
          </View>
          <Text
            style={{
              fontSize: 22,
              fontWeight: '800',
              color: colors.text,
              textAlign: 'center',
              marginBottom: 10,
            }}
          >
            {t('search.notFoundTitle')} {'\uD83D\uDE22'}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.mutedText,
              textAlign: 'center',
              lineHeight: 21,
            }}
          >
            {t('search.notFoundMessage')}
          </Text>
        </View>
      )}

      {/* ────── Results ────── */}
      {showResults && (
        <View style={{ flex: 1 }}>
          {/* Results count + sort */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: UI.spacing.xl,
              paddingVertical: 10,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.mutedText }}>
              {t('search.resultsFound', { count: results.length })}
            </Text>
            <Pressable
              onPress={() => setShowSortMenu(!showSortMenu)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <MaterialIcons name="sort" size={16} color={colors.mutedText} />
              <Text style={{ fontSize: 13, color: colors.mutedText }}>{sortMode === 'Newest' ? t('search.sortNewest') : sortMode === 'Oldest' ? t('search.sortOldest') : t('search.sortAZ')}</Text>
              <MaterialIcons name="expand-more" size={16} color={colors.mutedText} />
            </Pressable>
          </View>

          {/* Sort dropdown */}
          {showSortMenu && (
            <View
              style={{
                position: 'absolute',
                right: UI.spacing.xl,
                top: 40,
                zIndex: 20,
                backgroundColor: colors.card,
                borderRadius: UI.radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                ...UI.shadow.md,
              }}
            >
              {(['Newest', 'Oldest', 'A-Z'] as SortMode[]).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => {
                    setSortMode(m);
                    setShowSortMenu(false);
                  }}
                  style={({ pressed }) => ({
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    backgroundColor:
                      sortMode === m ? colors.inputBg : pressed ? colors.inputBg : 'transparent',
                  })}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: sortMode === m ? '#8B6B47' : colors.text,
                      fontWeight: sortMode === m ? '700' : '400',
                    }}
                  >
                    {m === 'Newest' ? t('search.sortNewest') : m === 'Oldest' ? t('search.sortOldest') : t('search.sortAZ')}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Category chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: UI.spacing.xl, gap: 8, paddingBottom: 10 }}
          >
            {CATEGORIES.map((cat) => {
              const active = appliedCategories.includes(cat.label);
              return (
                <Pressable
                  key={cat.label}
                  onPress={() => {
                    setAppliedCategories((prev) =>
                      prev.includes(cat.label)
                        ? prev.filter((c) => c !== cat.label)
                        : [...prev, cat.label],
                    );
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: UI.radius.pill,
                    backgroundColor: active ? '#8B6B47' : colors.card,
                    borderWidth: 1,
                    borderColor: active ? '#8B6B47' : colors.border,
                  }}
                >
                  <MaterialIcons
                    name={cat.icon as any}
                    size={16}
                    color={active ? '#fff' : colors.mutedText}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: active ? '#fff' : colors.text,
                    }}
                  >
                    {t(cat.labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Result items */}
          <FlatList
            data={results}
            keyExtractor={(i) => i.key}
            contentContainerStyle={{ paddingHorizontal: UI.spacing.xl, paddingBottom: 100 }}
            ItemSeparatorComponent={() => (
              <View style={{ height: 1, backgroundColor: colors.divider, marginVertical: 2 }} />
            )}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleItemPress(item)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                  gap: 14,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: item.iconBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons name={item.icon as any} size={22} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 15, fontWeight: '700', color: colors.text }}
                    numberOfLines={1}
                  >
                    {t(item.titleKey)}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.mutedText, marginTop: 2 }}>
                    {t(item.subtitleKey)}
                  </Text>
                </View>
                {item.isPremium && !hasFullAccess ? (
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: UI.radius.pill,
                      backgroundColor: 'rgba(139,107,71,0.12)',
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#8B6B47' }}>PRO</Text>
                  </View>
                ) : (
                  <MaterialIcons name="chevron-right" size={22} color={colors.mutedText} />
                )}
              </Pressable>
            )}
          />
        </View>
      )}

      {/* ────── Default state (no query) ────── */}
      {!query.trim() && !isSearching && (
        <View style={{ flex: 1, paddingHorizontal: UI.spacing.xl, paddingTop: 10 }}>
          <Text
            style={{ fontSize: 14, fontWeight: '700', color: colors.mutedText, marginBottom: 12 }}
          >
            {t('search.quickAccess')}
          </Text>
          <FlatList
            data={SEARCH_ITEMS.slice(0, 12)}
            keyExtractor={(i) => i.key}
            contentContainerStyle={{ paddingBottom: 100, gap: 2 }}
            ItemSeparatorComponent={() => (
              <View style={{ height: 1, backgroundColor: colors.divider }} />
            )}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleItemPress(item)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                  gap: 14,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: item.iconBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons name={item.icon as any} size={22} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 15, fontWeight: '700', color: colors.text }}
                    numberOfLines={1}
                  >
                    {t(item.titleKey)}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.mutedText, marginTop: 2 }}>
                    {t(item.subtitleKey)}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={colors.mutedText} />
              </Pressable>
            )}
          />
        </View>
      )}

      {/* ═══════════════════════════════════
          Filter Modal
         ═══════════════════════════════════ */}
      <Modal visible={filterVisible} transparent animationType="slide">
        <Pressable
          style={{ flex: 1, backgroundColor: colors.overlay }}
          onPress={() => setFilterVisible(false)}
        />
        <View
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: UI.radius.xxl,
            borderTopRightRadius: UI.radius.xxl,
            padding: UI.spacing.xl,
            paddingBottom: Platform.OS === 'ios' ? 44 : 24,
            maxHeight: Dimensions.get('window').height * 0.65,
          }}
        >
          {/* Handle bar */}
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.border,
              alignSelf: 'center',
              marginBottom: 20,
            }}
          />

          {/* Title row */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>
              {t('search.filterTitle')}
            </Text>
            <Pressable onPress={() => setFilterVisible(false)}>
              <MaterialIcons name="close" size={22} color={colors.mutedText} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Search Category */}
            <Text
              style={{ fontSize: 14, fontWeight: '700', color: colors.mutedText, marginBottom: 12 }}
            >
              {t('search.searchCategory')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
              {(['Journal', 'Sleep', 'Community', 'Mood', 'Meditation'] as SearchCategory[]).map(
                (cat) => {
                  const sel = filterCategories.includes(cat);
                  const meta = CATEGORIES.find((c) => c.label === cat);
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => toggleFilterCat(cat)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: UI.radius.pill,
                        backgroundColor: sel ? '#8B6B47' : colors.card,
                        borderWidth: 1,
                        borderColor: sel ? '#8B6B47' : colors.border,
                      }}
                    >
                      <MaterialIcons
                        name={(meta?.icon || 'label') as any}
                        size={16}
                        color={sel ? '#fff' : colors.mutedText}
                      />
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '600',
                          color: sel ? '#fff' : colors.text,
                        }}
                      >
                        {meta ? t(meta.labelKey) : cat}
                      </Text>
                    </Pressable>
                  );
                },
              )}
            </View>

            {/* Search Date */}
            <Text
              style={{ fontSize: 14, fontWeight: '700', color: colors.mutedText, marginBottom: 12 }}
            >
              {t('search.searchDate')}
            </Text>
            <Pressable
              onPress={() => setFilterDate(filterDate ? null : new Date().toISOString())}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderRadius: UI.radius.lg,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                marginBottom: 28,
              }}
            >
              <MaterialIcons name="event" size={20} color={colors.mutedText} />
              <Text
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: filterDate ? colors.text : colors.placeholder,
                }}
              >
                {filterDate
                  ? new Date(filterDate).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : t('search.selectDate')}
              </Text>
              <MaterialIcons name="expand-more" size={20} color={colors.mutedText} />
            </Pressable>

            {/* Search Limit */}
            <Text
              style={{ fontSize: 14, fontWeight: '700', color: colors.mutedText, marginBottom: 12 }}
            >
              {t('search.searchLimit')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 32 }}>
              <Text style={{ fontSize: 14, color: colors.mutedText, width: 24 }}>
                {filterLimitMin}
              </Text>
              <View
                style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.inputBg }}
              >
                <View
                  style={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#5B8A5A',
                    width: `${((filterLimitMax - filterLimitMin) / 80) * 100}%`,
                    marginLeft: `${(filterLimitMin / 100) * 100}%`,
                  }}
                />
              </View>
              <Text style={{ fontSize: 14, color: colors.mutedText, width: 24 }}>
                {filterLimitMax}
              </Text>
            </View>
          </ScrollView>

          {/* Apply Button */}
          <Pressable
            onPress={applyFilters}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: '#8B6B47',
              borderRadius: UI.radius.xl,
              paddingVertical: 16,
              opacity: pressed ? 0.9 : 1,
              ...UI.shadow.md,
            })}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>
              {t('search.filterButton', { count: filterCategories.length > 0 ? results.length : SEARCH_ITEMS.length })}
            </Text>
            <MaterialIcons name="tune" size={18} color="#fff" />
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}
