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
  title: string;
  subtitle: string;
  category: SearchCategory;
  path: string;
  isPremium?: boolean;
  icon: string;
  iconBg: string;
};

const SEARCH_ITEMS: SearchItem[] = [
  // ── Home ──
  {
    key: 'home',
    title: 'Home & Score',
    subtitle: 'In Dashboard',
    category: 'Home',
    path: '/(tabs)/home',
    icon: 'home',
    iconBg: '#8B6B47',
  },

  // ── Mood ──
  {
    key: 'mood-history',
    title: 'My Mood History',
    subtitle: 'In Mood & Emotions',
    category: 'Mood',
    path: '/(tabs)/mood',
    icon: 'mood',
    iconBg: '#E8985A',
  },
  {
    key: 'mood-improvements',
    title: 'Mood Improvements',
    subtitle: 'In Resources & Videos',
    category: 'Mood',
    path: '/(tabs)/mood',
    icon: 'trending-up',
    iconBg: '#5B8A5A',
  },
  {
    key: 'mood-journals',
    title: 'Mood Journals',
    subtitle: 'In Mental Health Journal',
    category: 'Mood',
    path: '/(tabs)/journal',
    icon: 'menu-book',
    iconBg: '#5B8A5A',
  },
  {
    key: 'mood-ai',
    title: 'AI Chatbot Mood Suggestions',
    subtitle: 'In AI Therapy Chatbot',
    category: 'Mood',
    path: '/(tabs)/chat',
    icon: 'smart-toy',
    iconBg: '#7B6DC9',
    isPremium: true,
  },
  {
    key: 'my-mood',
    title: 'My Current Mood',
    subtitle: 'In Mood & Emotions',
    category: 'Mood',
    path: '/(tabs)/mood',
    icon: 'emoji-emotions',
    iconBg: '#E8985A',
  },

  // ── Sleep ──
  {
    key: 'sleep-quality',
    title: 'Sleep Quality',
    subtitle: 'In Sleep Tracker',
    category: 'Sleep',
    path: '/(tabs)/sleep',
    icon: 'bedtime',
    iconBg: '#5A3E7A',
  },
  {
    key: 'sleep-history',
    title: 'Sleep History',
    subtitle: 'In Sleep Tracker',
    category: 'Sleep',
    path: '/(tabs)/sleep/history',
    icon: 'history',
    iconBg: '#5A3E7A',
  },
  {
    key: 'sleep-insights',
    title: 'Sleep Insights',
    subtitle: 'In Sleep Analytics',
    category: 'Sleep',
    path: '/(tabs)/sleep/insights',
    icon: 'insights',
    iconBg: '#7B6DC9',
  },
  {
    key: 'sleep-schedule',
    title: 'Sleep Schedule',
    subtitle: 'In Sleep Tracker',
    category: 'Sleep',
    path: '/(tabs)/sleep/schedule',
    icon: 'schedule',
    iconBg: '#5A3E7A',
  },
  {
    key: 'sleep-start',
    title: 'Start Sleeping',
    subtitle: 'In Sleep Tracker',
    category: 'Sleep',
    path: '/(tabs)/sleep/start',
    icon: 'nightlight-round',
    iconBg: '#2A1A3E',
  },

  // ── Meditation ──
  {
    key: 'meditation',
    title: 'Meditation Practice',
    subtitle: 'In Mindful Hours',
    category: 'Meditation',
    path: '/(tabs)/mindful',
    icon: 'self-improvement',
    iconBg: '#5B8A5A',
  },
  {
    key: 'meditation-schedule',
    title: 'Meditation Schedule',
    subtitle: 'In Mindful Hours',
    category: 'Meditation',
    path: '/(tabs)/mindful',
    icon: 'event',
    iconBg: '#5B8A5A',
  },
  {
    key: 'meditation-ai',
    title: 'Meditation AI Suggestion',
    subtitle: 'In AI Therapy Chatbot',
    category: 'Meditation',
    path: '/(tabs)/chat',
    icon: 'auto-awesome',
    iconBg: '#7B6DC9',
    isPremium: true,
  },
  {
    key: 'my-meditation',
    title: 'My Meditation',
    subtitle: 'In Mindful Hours',
    category: 'Meditation',
    path: '/(tabs)/mindful',
    icon: 'spa',
    iconBg: '#5B8A5A',
  },

  // ── Journal ──
  {
    key: 'journal',
    title: 'Mental Health Journal',
    subtitle: 'In Journal & Writing',
    category: 'Journal',
    path: '/(tabs)/journal',
    icon: 'edit-note',
    iconBg: '#8B6B47',
  },
  {
    key: 'journal-prompts',
    title: 'Journal Prompts',
    subtitle: 'In Journal & Writing',
    category: 'Journal',
    path: '/(tabs)/journal',
    icon: 'lightbulb',
    iconBg: '#E8985A',
  },

  // ── Community ──
  {
    key: 'community',
    title: 'Community Support',
    subtitle: 'In Peer Support',
    category: 'Community',
    path: '/(tabs)/community',
    icon: 'people',
    iconBg: '#5B8A5A',
  },

  // ── AI Chatbot ──
  {
    key: 'chatbot',
    title: 'AI Therapy Chatbot',
    subtitle: 'In AI Chatbot',
    category: 'AI Chatbot',
    path: '/(tabs)/chat',
    icon: 'smart-toy',
    iconBg: '#7B6DC9',
    isPremium: true,
  },

  // ── Resources ──
  {
    key: 'stress',
    title: 'Stress Management',
    subtitle: 'In Wellness Tools',
    category: 'Resources',
    path: '/(tabs)/stress',
    icon: 'psychology',
    iconBg: '#E8985A',
  },
  {
    key: 'notifications',
    title: 'Smart Notifications',
    subtitle: 'In Settings',
    category: 'Resources',
    path: '/(tabs)/notifications',
    icon: 'notifications',
    iconBg: '#8B6B47',
  },
  {
    key: 'profile',
    title: 'Profile & Settings',
    subtitle: 'In Settings',
    category: 'Resources',
    path: '/(tabs)/profile',
    icon: 'person',
    iconBg: '#8B6B47',
  },
  {
    key: 'help',
    title: 'Help Center',
    subtitle: 'In Support',
    category: 'Resources',
    path: '/(utils)/help-center',
    icon: 'help',
    iconBg: '#5A8FB5',
  },
  {
    key: 'assessment',
    title: 'Mental Health Assessment',
    subtitle: 'In Wellness Tools',
    category: 'Resources',
    path: '/(onboarding)/assessment',
    icon: 'assignment',
    iconBg: '#7B6DC9',
    isPremium: true,
  },
];

/* ─── Category chips metadata ─── */
const CATEGORIES: { label: SearchCategory; icon: string }[] = [
  { label: 'Sleep', icon: 'bedtime' },
  { label: 'Mood', icon: 'mood' },
  { label: 'Meditation', icon: 'self-improvement' },
  { label: 'Journal', icon: 'edit-note' },
  { label: 'Community', icon: 'people' },
  { label: 'Home', icon: 'home' },
  { label: 'AI Chatbot', icon: 'smart-toy' },
  { label: 'Resources', icon: 'more-horiz' },
];

type SortMode = 'Newest' | 'Oldest' | 'A-Z';

/* ═══════════════════════════════════════════════
   Main Search Screen
   ═══════════════════════════════════════════════ */
export default function Search() {
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
    return SEARCH_ITEMS.filter((i) => i.title.toLowerCase().includes(s))
      .slice(0, 5)
      .map((i) => i.title);
  }, [query]);

  /* ── Filtered & sorted results ── */
  const results = useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s) return [];
    let items = SEARCH_ITEMS.filter((i) =>
      (i.title + ' ' + i.subtitle + ' ' + i.category).toLowerCase().includes(s),
    );
    if (appliedCategories.length > 0) {
      items = items.filter((i) => appliedCategories.includes(i.category));
    }
    if (sortMode === 'A-Z') items.sort((a, b) => a.title.localeCompare(b.title));
    else if (sortMode === 'Oldest') items = [...items].reverse();
    return items;
  }, [query, appliedCategories, sortMode]);

  const activeFilterCount = appliedCategories.length + (filterDate ? 1 : 0);

  /* ── Callbacks ── */
  const handleItemPress = useCallback(
    (item: SearchItem) => {
      Keyboard.dismiss();
      if (item.isPremium && !hasFullAccess) {
        showAlert('Premium Feature', 'Upgrade to lifetime access to use this feature.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/(utils)/trial-upgrade' as any) },
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
          <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>Search</Text>
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
            placeholder="Search freud.ai..."
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
          <Text style={{ color: colors.mutedText, fontSize: 15 }}>Loading...</Text>
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
            Not Found {'\uD83D\uDE22'}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.mutedText,
              textAlign: 'center',
              lineHeight: 21,
            }}
          >
            Unfortunately, the key you entered cannot be found 404 Error, please try another keyword
            or check again.
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
              {results.length} Results Found
            </Text>
            <Pressable
              onPress={() => setShowSortMenu(!showSortMenu)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <MaterialIcons name="sort" size={16} color={colors.mutedText} />
              <Text style={{ fontSize: 13, color: colors.mutedText }}>{sortMode}</Text>
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
                    {m}
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
                    {cat.label}
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
                    {item.title}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.mutedText, marginTop: 2 }}>
                    {item.subtitle}
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
            Quick Access
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
                    {item.title}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.mutedText, marginTop: 2 }}>
                    {item.subtitle}
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
              Filter Search Result
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
              Search Category
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
                        {cat}
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
              Search Date
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
                  : 'Select date...'}
              </Text>
              <MaterialIcons name="expand-more" size={20} color={colors.mutedText} />
            </Pressable>

            {/* Search Limit */}
            <Text
              style={{ fontSize: 14, fontWeight: '700', color: colors.mutedText, marginBottom: 12 }}
            >
              Search Limit
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
              Filter Search Results (
              {filterCategories.length > 0 ? results.length : SEARCH_ITEMS.length})
            </Text>
            <MaterialIcons name="tune" size={18} color="#fff" />
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}
