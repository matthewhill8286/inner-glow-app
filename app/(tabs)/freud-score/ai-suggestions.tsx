import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import { useFreudScore } from '@/hooks/useFreudScore';
import type { AISuggestion } from '@/lib/freudScore';
import MoodCheckInModal from '@/components/MoodCheckInModal';
import type { MoodValue } from '@/components/MoodCheckInModal';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const BROWN = '#8B6B47';

/* ------------------------------------------------------------------ */
/*  Category config                                                    */
/* ------------------------------------------------------------------ */

type CategoryConfig = {
  key: 'mindfulness' | 'physical' | 'social' | 'professional';
  label: string;
  fallbackSubtitle: string;
  color: string;
  icons: { emoji: string; bg: string }[];
};

const CATEGORIES: CategoryConfig[] = [
  {
    key: 'mindfulness',
    label: 'Mindfulness Activities',
    fallbackSubtitle: 'Breathing, Relax',
    color: '#5AAF8B',
    icons: [
      { emoji: '🧘', bg: '#5AAF8B' },
      { emoji: '🌬️', bg: '#7DC8A8' },
      { emoji: '🎵', bg: '#A3D9C0' },
    ],
  },
  {
    key: 'physical',
    label: 'Physical Activities',
    fallbackSubtitle: 'Jogging, Running, Swimming',
    color: '#FF9800',
    icons: [
      { emoji: '🏃', bg: '#FF9800' },
      { emoji: '🏋️', bg: '#FFB74D' },
      { emoji: '🏊', bg: '#FFCC80' },
    ],
  },
  {
    key: 'social',
    label: 'Social Connection',
    fallbackSubtitle: 'Party, Binge Watching',
    color: '#7E57C2',
    icons: [
      { emoji: '💬', bg: '#7E57C2' },
      { emoji: '🤝', bg: '#9575CD' },
      { emoji: '📱', bg: '#B39DDB' },
    ],
  },
  {
    key: 'professional',
    label: 'Professional Support',
    fallbackSubtitle: 'Psychiatrist, Hotline',
    color: '#FF9800',
    icons: [
      { emoji: '🩺', bg: '#5AAF8B' },
      { emoji: '📋', bg: '#FF9800' },
      { emoji: '📞', bg: '#FF9800' },
    ],
  },
];

/* ── Helpers to derive dynamic subtitle + duration from real data ── */

/** Extract short keywords from suggestion titles (first word of each, up to 3) */
function deriveCategorySubtitle(items: AISuggestion[], fallback: string): string {
  if (items.length === 0) return fallback;
  const keywords = items
    .slice(0, 3)
    .map((s) => {
      // Take the first meaningful word (skip very short ones)
      const words = s.title.split(/\s+/).filter((w) => w.length > 2);
      return words[0] ?? s.title.split(/\s+/)[0];
    })
    .filter(Boolean);
  const unique = [...new Set(keywords)];
  return unique.length > 0 ? unique.join(', ') : fallback;
}

/** Parse a duration string like "15 min" or "1 hour" into minutes */
function parseDurationMinutes(d: string | null): number | null {
  if (!d) return null;
  const lower = d.toLowerCase();
  const hourMatch = lower.match(/(\d+(?:\.\d+)?)\s*h/);
  const minMatch = lower.match(/(\d+)\s*m/);
  let mins = 0;
  if (hourMatch) mins += parseFloat(hourMatch[1]) * 60;
  if (minMatch) mins += parseInt(minMatch[1], 10);
  if (mins === 0 && /\d/.test(lower)) {
    const num = parseInt(lower.replace(/\D/g, ''), 10);
    if (num > 0) return num;
  }
  return mins > 0 ? mins : null;
}

/** Build a human-readable duration range from suggestion durations */
function deriveDurationRange(items: AISuggestion[]): string {
  const mins = items
    .map((s) => parseDurationMinutes(s.duration))
    .filter((m): m is number => m !== null);
  if (mins.length === 0) return '';
  const minVal = Math.min(...mins);
  const maxVal = Math.max(...mins);
  const fmt = (m: number) => (m >= 60 ? `${Math.round(m / 60)}hr` : `${m}min`);
  return minVal === maxVal ? fmt(minVal) : `${fmt(minVal)}-${fmt(maxVal)}`;
}

/* ------------------------------------------------------------------ */
/*  Overlapping icon circles                                           */
/* ------------------------------------------------------------------ */

function OverlappingIcons({
  icons,
  count,
}: {
  icons: { emoji: string; bg: string }[];
  count: number;
}) {
  return (
    <View style={iconStyles.row}>
      {icons.map((ic, i) => (
        <View
          key={i}
          style={[
            iconStyles.circle,
            {
              backgroundColor: ic.bg,
              zIndex: icons.length - i,
              marginLeft: i > 0 ? -10 : 0,
            },
          ]}
        >
          <Text style={{ fontSize: 16 }}>{ic.emoji}</Text>
        </View>
      ))}
      {count > 0 && (
        <View style={[iconStyles.countBadge, { marginLeft: -6, zIndex: 0 }]}>
          <Text style={iconStyles.countText}>{count}+</Text>
        </View>
      )}
    </View>
  );
}

const iconStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFF',
  },
  countBadge: {
    height: 26,
    minWidth: 26,
    borderRadius: 13,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  countText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
});

/* ------------------------------------------------------------------ */
/*  Category list card                                                 */
/* ------------------------------------------------------------------ */

function CategoryListCard({
  category,
  count,
  subtitle,
  duration,
  colors,
  onPress,
}: {
  category: CategoryConfig;
  count: number;
  subtitle: string;
  duration: string;
  colors: (typeof Colors)['light'] | (typeof Colors)['dark'];
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.catCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <OverlappingIcons icons={category.icons} count={count} />

      <View style={s.catInfo}>
        <Text style={[s.catLabel, { color: colors.text }]}>{category.label}</Text>
        <Text style={[s.catSub, { color: colors.mutedText }]}>
          {subtitle}{duration ? `  ·  ${duration}` : ''}
        </Text>
      </View>

      <View style={[s.catChevron, { backgroundColor: colors.background }]}>
        <MaterialIcons name="chevron-right" size={20} color={colors.mutedText} />
      </View>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/*  Completion celebration modal                                       */
/* ------------------------------------------------------------------ */

function CompletionModal({
  visible,
  onClose,
  points,
  newScore,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  points: number;
  newScore: number;
  colors: (typeof Colors)['light'] | (typeof Colors)['dark'];
}) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={[s.completionCard, { backgroundColor: colors.card }]}>
          <View style={s.celebrationEmoji}>
            <Text style={{ fontSize: 48 }}>🎉</Text>
          </View>
          <Text style={[s.completionTitle, { color: colors.text }]}>
            {t('aiSuggestions.suggestionCompleted')}
          </Text>
          <View style={s.pointsBadge}>
            <MaterialIcons name="star" size={18} color="#F59E0B" />
            <Text style={s.pointsBadgeText}>+{points} points</Text>
          </View>
          <Text style={[s.completionSubtext, { color: colors.mutedText }]}>
            {t('aiSuggestions.scoreIncreased', { score: newScore })}
          </Text>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [s.completionBtn, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={s.completionBtnText}>{t('aiSuggestions.greatThanks')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  Screen                                                             */
/* ------------------------------------------------------------------ */

export default function AISuggestionsScreen() {
  const { t } = useTranslation();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const {
    currentScore,
    suggestions,
    isLoadingSuggestions,
    completeSuggestion,
    isCompleting,
    generateSuggestions,
    isGenerating,
  } = useFreudScore();

  const [sortBy, setSortBy] = useState<'all' | 'newest'>('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showMoodCheckIn, setShowMoodCheckIn] = useState(false);
  const [completedPoints, setCompletedPoints] = useState(5);
  const [pendingSuggestion, setPendingSuggestion] = useState<AISuggestion | null>(null);
  const autoGenerated = useRef(false);

  useEffect(() => {
    if (
      !isLoadingSuggestions &&
      suggestions.length === 0 &&
      !autoGenerated.current &&
      !isGenerating
    ) {
      autoGenerated.current = true;
      generateSuggestions({ maxSuggestions: 6 }).catch(() => {});
    }
  }, [isLoadingSuggestions, suggestions.length, isGenerating]);

  const totalSuggestions = suggestions.filter((s) => !s.completed).length;

  const grouped = useMemo(() => {
    const result: Record<string, AISuggestion[]> = {
      mindfulness: [],
      physical: [],
      social: [],
      professional: [],
    };
    const list =
      sortBy === 'newest'
        ? [...suggestions].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        : suggestions;
    for (const s of list) {
      if (result[s.category]) {
        result[s.category].push(s);
      }
    }
    return result;
  }, [suggestions, sortBy]);

  const handleComplete = (suggestion: AISuggestion) => {
    if (suggestion.completed || isCompleting) return;
    setPendingSuggestion(suggestion);
    setShowMoodCheckIn(true);
  };

  const [newScoreValue, setNewScoreValue] = useState(0);

  const handleMoodComplete = async (moods: { moodBefore: MoodValue; moodAfter: MoodValue }) => {
    if (!pendingSuggestion) return;
    setShowMoodCheckIn(false);
    try {
      const result = await completeSuggestion({
        suggestionId: pendingSuggestion.id,
        moodBefore: moods.moodBefore,
        moodAfter: moods.moodAfter,
      });
      setCompletedPoints(pendingSuggestion.points);
      setNewScoreValue(result.newScore);
      setShowCompletion(true);
    } catch (e) {
      console.warn('[AISuggestions] Failed to complete suggestion:', e);
    }
    setPendingSuggestion(null);
  };

  const handleMoodSkip = async () => {
    if (!pendingSuggestion) return;
    setShowMoodCheckIn(false);
    try {
      const result = await completeSuggestion({ suggestionId: pendingSuggestion.id });
      setCompletedPoints(pendingSuggestion.points);
      setNewScoreValue(result.newScore);
      setShowCompletion(true);
    } catch (e) {
      console.warn('[AISuggestions] Failed to complete suggestion:', e);
    }
    setPendingSuggestion(null);
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Brown hero header ────────────────────── */}
        <View style={[s.hero, { paddingTop: insets.top + 12 }]}>
          {/* Decorative circles */}
          <View style={[s.heroCircle1, { backgroundColor: 'rgba(255,255,255,0.06)' }]} />
          <View style={[s.heroCircle2, { backgroundColor: 'rgba(255,255,255,0.04)' }]} />

          {/* Back button */}
          <Pressable
            onPress={() => router.replace('/(tabs)/home')}
            style={({ pressed }) => [s.heroBackBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <MaterialIcons
              name={Platform.OS === 'ios' ? 'arrow-back-ios-new' : 'arrow-back'}
              size={18}
              color="#FFF"
            />
          </Pressable>

          {/* Title */}
          <Text style={s.heroTitle}>{t('aiSuggestions.title')}</Text>

          {/* Meta row */}
          <View style={s.heroMeta}>
            <View style={s.heroMetaPill}>
              <Text style={{ fontSize: 12 }}>💡</Text>
              <Text style={s.heroMetaText}>{totalSuggestions} Total</Text>
            </View>
            <Text style={s.heroMetaDot}>·</Text>
            <View style={s.heroMetaPill}>
              <Text style={{ fontSize: 12 }}>🤖</Text>
              <Text style={s.heroMetaText}>GPT-5</Text>
            </View>
          </View>
        </View>

        {/* ── Content area ──────────────────────────── */}
        <View style={s.content}>
          {/* All Suggestions + Sort */}
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>
              {t('aiSuggestions.allSuggestions')}
            </Text>

            <Pressable
              onPress={() => setShowSortMenu(!showSortMenu)}
              style={[s.sortBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={{ fontSize: 12 }}>🔽</Text>
              <Text style={[s.sortBtnText, { color: colors.text }]}>
                {sortBy === 'newest' ? t('aiSuggestions.newest') : t('aiSuggestions.allSuggestions')}
              </Text>
              <MaterialIcons name="expand-more" size={16} color={colors.mutedText} />
            </Pressable>
          </View>

          {/* Sort dropdown */}
          {showSortMenu && (
            <View
              style={[s.sortDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              {(['newest', 'all'] as const).map((opt) => (
                <Pressable
                  key={opt}
                  onPress={() => {
                    setSortBy(opt);
                    setShowSortMenu(false);
                  }}
                  style={[
                    s.sortOption,
                    sortBy === opt && { backgroundColor: BROWN + '10' },
                  ]}
                >
                  <Text
                    style={[
                      s.sortOptionText,
                      { color: sortBy === opt ? BROWN : colors.text },
                    ]}
                  >
                    {opt === 'newest' ? t('aiSuggestions.newest') : t('aiSuggestions.allSuggestions')}
                  </Text>
                  {sortBy === opt && (
                    <MaterialIcons name="check" size={16} color={BROWN} />
                  )}
                </Pressable>
              ))}
            </View>
          )}

          {/* Loading */}
          {(isGenerating || isLoadingSuggestions) && (
            <View style={s.loadingWrap}>
              <View
                style={[s.loadingCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <ActivityIndicator size="small" color={BROWN} />
                <Text style={{ color: colors.mutedText, fontSize: 13, marginLeft: 10 }}>
                  {isGenerating ? t('aiSuggestions.generating') : t('aiSuggestions.loading')}
                </Text>
              </View>
            </View>
          )}

          {/* ── Category list cards ──────────────────── */}
          <View style={s.catList}>
            {CATEGORIES.map((cat) => {
              const items = grouped[cat.key] ?? [];
              const pendingCount = items.filter((x) => !x.completed).length;
              const dynamicSub = deriveCategorySubtitle(items, cat.fallbackSubtitle);
              const dynamicDur = deriveDurationRange(items);
              return (
                <CategoryListCard
                  key={cat.key}
                  category={cat}
                  count={pendingCount}
                  subtitle={dynamicSub}
                  duration={dynamicDur}
                  colors={colors}
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/freud-score/ai-suggestion-category' as any,
                      params: { category: cat.key },
                    })
                  }
                />
              );
            })}
          </View>

          {/* ── Generate more button ──────────────────── */}
          {!isLoadingSuggestions && !isGenerating && (
            <Pressable
              onPress={() => generateSuggestions({ maxSuggestions: 4 }).catch(() => {})}
              style={({ pressed }) => [
                s.generateBtn,
                {
                  backgroundColor: BROWN,
                  opacity: pressed ? 0.8 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <MaterialIcons name="auto-awesome" size={20} color="#fff" />
              <Text style={s.generateBtnText}>{t('aiSuggestions.generateMore')}</Text>
            </Pressable>
          )}

          {/* Why mindful section */}
          <View
            style={[s.whySection, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={s.whyHeader}>
              <Text style={{ fontSize: 20 }}>🌿</Text>
              <Text style={[s.whyTitle, { color: colors.text }]}>
                {t('aiSuggestions.whyMindful')}
              </Text>
            </View>
            <Text style={[s.whyBody, { color: colors.mutedText }]}>
              {t('aiSuggestions.whyMindfulBody')}
            </Text>
            <View style={s.tagRow}>
              <View style={[s.tag, { backgroundColor: '#5AAF8B14' }]}>
                <Text style={{ fontSize: 12 }}>🌿</Text>
                <Text style={{ color: '#5AAF8B', fontSize: 12, fontWeight: '600' }}>
                  {t('aiSuggestions.reduceStress')}
                </Text>
              </View>
              <View style={[s.tag, { backgroundColor: '#42A5F514' }]}>
                <Text style={{ fontSize: 12 }}>💚</Text>
                <Text style={{ color: '#42A5F5', fontSize: 12, fontWeight: '600' }}>
                  {t('aiSuggestions.improveHealth')}
                </Text>
              </View>
              <View style={[s.tag, { backgroundColor: '#7E57C214' }]}>
                <Text style={{ fontSize: 12 }}>🧠</Text>
                <Text style={{ color: '#7E57C2', fontSize: 12, fontWeight: '600' }}>Focus</Text>
              </View>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      <MoodCheckInModal
        visible={showMoodCheckIn}
        accentColor="#5AAF8B"
        activityTitle={pendingSuggestion?.title ?? ''}
        onComplete={handleMoodComplete}
        onSkip={handleMoodSkip}
      />

      <CompletionModal
        visible={showCompletion}
        onClose={() => setShowCompletion(false)}
        points={completedPoints}
        newScore={newScoreValue || Math.min(100, currentScore.score + completedPoints)}
        colors={colors}
      />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */
const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 120 },

  /* ── Hero header ── */
  hero: {
    backgroundColor: BROWN,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  heroCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -60,
    right: -40,
  },
  heroCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    bottom: -40,
    left: -20,
  },
  heroBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  heroMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroMetaText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '700',
  },
  heroMetaDot: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
  },

  /* ── Content ── */
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  /* Section header */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
  },

  /* Sort */
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  sortBtnText: { fontSize: 13, fontWeight: '700' },
  sortDropdown: {
    position: 'absolute',
    right: 20,
    top: 52,
    zIndex: 10,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    ...UI.shadow.md,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 140,
  },
  sortOptionText: { fontSize: 14, fontWeight: '600' },

  /* ── Category list cards ── */
  catList: { gap: 12, zIndex: -1 },
  catCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
    ...UI.shadow.sm,
  },
  catInfo: { flex: 1 },
  catLabel: { fontSize: 16, fontWeight: '800', marginBottom: 3 },
  catSub: { fontSize: 13 },
  catChevron: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Generate button ── */
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 18,
    marginTop: 20,
    ...UI.shadow.sm,
  },
  generateBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  /* ── Loading ── */
  loadingWrap: { alignItems: 'center', marginBottom: 16, zIndex: -1 },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },

  /* ── Why section ── */
  whySection: {
    borderRadius: 22,
    padding: 20,
    marginTop: 24,
    borderWidth: 1,
    ...UI.shadow.sm,
  },
  whyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  whyTitle: { fontSize: 17, fontWeight: '800', flex: 1 },
  whyBody: { fontSize: 14, lineHeight: 22, marginTop: 12 },
  tagRow: { flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },

  /* ── Completion modal ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  completionCard: {
    width: '100%',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    ...UI.shadow.lg,
  },
  celebrationEmoji: { marginBottom: 16 },
  completionTitle: { fontSize: 22, fontWeight: '900', textAlign: 'center' },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F59E0B18',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    marginTop: 14,
  },
  pointsBadgeText: { color: '#F59E0B', fontSize: 16, fontWeight: '800' },
  completionSubtext: { fontSize: 14, marginTop: 12, textAlign: 'center', lineHeight: 20 },
  completionBtn: {
    marginTop: 24,
    backgroundColor: BROWN,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 18,
    ...UI.shadow.sm,
  },
  completionBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
