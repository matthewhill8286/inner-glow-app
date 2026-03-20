import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Switch, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors, UI } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { CATEGORIES, type PostCategory } from '@/lib/community';

const getPostTypeOptions = (t: any) =>
  [
    { key: 'story', label: t('communityFilter.postTypes.story'), emoji: '📝' },
    { key: 'audio', label: t('communityFilter.postTypes.audio'), emoji: '🎙️' },
  ] as const;

/* ── safe back navigation helper ────────────────── */
function goBack(from?: string) {
  if (from) {
    router.replace(from as any);
  } else {
    router.back();
  }
}

export default function CommunityFilterScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const { from } = useLocalSearchParams<{ from?: string }>();
  const postTypeOptions = getPostTypeOptions(t);

  const [selectedCategories, setSelectedCategories] = useState<Set<PostCategory>>(new Set());
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [hasVideo, setHasVideo] = useState(false);
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [similarPosts, setSimilarPosts] = useState(false);

  const toggleCategory = (key: PostCategory) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleType = (key: string) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const activeFilters =
    selectedCategories.size + selectedTypes.size + (hasVideo ? 1 : 0) + (similarPosts ? 1 : 0);

  const resetAll = () => {
    setSelectedCategories(new Set());
    setSelectedTypes(new Set());
    setHasVideo(false);
    setDateFilter(null);
    setSimilarPosts(false);
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background, paddingTop: insets.top + 6 }]}>
      {/* ── Header ─────────────────────────────── */}
      <View style={[s.header, { marginTop: insets.top + 20 }]}>
        <Pressable
          onPress={() => goBack(from)}
          style={({ pressed }) => [
            s.backBtn,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <MaterialIcons
            name={Platform.OS === 'ios' ? 'arrow-back-ios-new' : 'arrow-back'}
            size={18}
            color={colors.text}
          />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, { color: colors.text }]}>{t('communityFilter.title')}</Text>
          <Text style={[s.headerSub, { color: colors.mutedText }]}>
            {t('communityFilter.subtitle')}
          </Text>
        </View>
        {activeFilters > 0 && (
          <Pressable onPress={resetAll}>
            <Text style={s.resetText}>{t('communityFilter.resetButton')}</Text>
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Post Type ────────────────────────── */}
        <Text style={[s.sectionLabel, { color: colors.mutedText }]}>
          {t('communityFilter.postTypeLabel')}
        </Text>
        <View style={s.typeRow}>
          {postTypeOptions.map((opt) => {
            const active = selectedTypes.has(opt.key);
            return (
              <Pressable
                key={opt.key}
                onPress={() => toggleType(opt.key)}
                style={({ pressed }) => [
                  s.typeBtn,
                  {
                    backgroundColor: active ? '#8B6B47' : colors.card,
                    borderColor: active ? '#8B6B47' : colors.border,
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                  },
                ]}
              >
                <Text style={{ fontSize: 16 }}>{opt.emoji}</Text>
                <Text style={[s.typeText, { color: active ? '#FFF' : colors.text }]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Categories ──────────────────────── */}
        <Text style={[s.sectionLabel, { color: colors.mutedText, marginTop: 22 }]}>
          {t('communityFilter.topicsLabel')}
        </Text>
        <View style={s.catGrid}>
          {CATEGORIES.map((cat) => {
            const active = selectedCategories.has(cat.key);
            return (
              <Pressable
                key={cat.key}
                onPress={() => toggleCategory(cat.key)}
                style={({ pressed }) => [
                  s.catChip,
                  {
                    backgroundColor: active ? cat.tint + '20' : colors.card,
                    borderColor: active ? cat.tint : colors.border,
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                  },
                ]}
              >
                <Text style={{ fontSize: 14 }}>{cat.emoji}</Text>
                <Text style={[s.catChipText, { color: active ? cat.tint : colors.text }]}>
                  {cat.label}
                </Text>
                {active && <MaterialIcons name="check-circle" size={14} color={cat.tint} />}
              </Pressable>
            );
          })}
        </View>

        {/* ── Toggles ─────────────────────────── */}
        <View style={{ gap: 10, marginTop: 22 }}>
          <View style={[s.toggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[s.toggleIcon, { backgroundColor: '#7B6DC915' }]}>
              <Text style={{ fontSize: 16 }}>🎬</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.toggleLabel, { color: colors.text }]}>
                {t('communityFilter.videoToggleLabel')}
              </Text>
              <Text style={[s.toggleSub, { color: colors.mutedText }]}>
                {t('communityFilter.videoToggleSubtitle')}
              </Text>
            </View>
            <Switch
              value={hasVideo}
              onValueChange={setHasVideo}
              trackColor={{
                false: theme === 'light' ? '#E0DCD6' : '#3A3A3A',
                true: '#7B6DC9',
              }}
              thumbColor="#FFF"
            />
          </View>

          <View style={[s.toggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[s.toggleIcon, { backgroundColor: '#5A8FB515' }]}>
              <Text style={{ fontSize: 16 }}>🔗</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.toggleLabel, { color: colors.text }]}>Similar Posts</Text>
              <Text style={[s.toggleSub, { color: colors.mutedText }]}>
                Show posts similar to yours.
              </Text>
            </View>
            <Switch
              value={similarPosts}
              onValueChange={setSimilarPosts}
              trackColor={{
                false: theme === 'light' ? '#E0DCD6' : '#3A3A3A',
                true: '#5A8FB5',
              }}
              thumbColor="#FFF"
            />
          </View>
        </View>

        {/* ── Apply button ────────────────────── */}
        <Pressable
          onPress={() => goBack(from)}
          style={({ pressed }) => [s.applyBtn, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
        >
          <MaterialIcons name="filter-list" size={18} color="#FFF" />
          <Text style={s.applyText}>Filter Posts ({activeFilters}) →</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

/* ── Styles ──────────────────────────────────────── */
const s = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: UI.spacing.xl,
    paddingTop: 0,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 26,
    marginBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: '900' },
  headerSub: { fontSize: 14, marginTop: 2 },
  resetText: { color: '#C45B5B', fontSize: 14, fontWeight: '700' },

  scrollContent: { paddingTop: 20, paddingBottom: 100 },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },

  /* type row */
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: UI.radius.lg,
    borderWidth: 1.5,
  },
  typeText: { fontSize: 14, fontWeight: '700' },

  /* category chips */
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: UI.radius.lg,
    borderWidth: 1.5,
  },
  catChipText: { fontSize: 13, fontWeight: '700' },

  /* toggle */
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: UI.radius.xl,
    borderWidth: 1,
  },
  toggleIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleLabel: { fontSize: 14, fontWeight: '700' },
  toggleSub: { fontSize: 12, marginTop: 1 },

  /* apply */
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8B6B47',
    paddingVertical: 16,
    borderRadius: UI.radius.lg,
    marginTop: 28,
    ...UI.shadow.sm,
  },
  applyText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
