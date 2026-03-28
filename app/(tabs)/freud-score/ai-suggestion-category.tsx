import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, UI } from '@/constants/theme';
import { useFreudScore } from '@/hooks/useFreudScore';
import type { AISuggestion } from '@/lib/freudScore';
import ScreenHeader from '@/components/ScreenHeader';
import MoodCheckInModal from '@/components/MoodCheckInModal';
import type { MoodValue } from '@/components/MoodCheckInModal';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

/* ------------------------------------------------------------------ */
/*  Category config                                                    */
/* ------------------------------------------------------------------ */

const CATEGORY_CONFIG: Record<string, { emoji: string; color: string; icon: string; bgEmoji: string }> = {
  mindfulness: { emoji: '🧘', color: '#5AAF8B', icon: 'self-improvement', bgEmoji: '🌿' },
  physical: { emoji: '🏃', color: '#FF9800', icon: 'directions-run', bgEmoji: '💪' },
  social: { emoji: '💬', color: '#42A5F5', icon: 'forum', bgEmoji: '🤝' },
  professional: { emoji: '🩺', color: '#7E57C2', icon: 'medical-services', bgEmoji: '🧠' },
};

/* ------------------------------------------------------------------ */
/*  Completion celebration modal                                       */
/* ------------------------------------------------------------------ */

function CompletionModal({
  visible,
  onClose,
  suggestion,
  accentColor,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  suggestion: AISuggestion | null;
  accentColor: string;
  colors: (typeof Colors)['light'] | (typeof Colors)['dark'];
}) {
  const { t } = useTranslation();
  if (!suggestion) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.completionCard, { backgroundColor: colors.card }]}>
          <View style={[styles.completionIconWrap, { backgroundColor: accentColor + '15' }]}>
            <Text style={{ fontSize: 40 }}>🎉</Text>
          </View>
          <Text style={[styles.completionTitle, { color: colors.text }]}>
            {t('aiSuggestions.suggestionCompleted')}
          </Text>
          <Text style={[styles.completionActivityName, { color: accentColor }]}>
            {suggestion.title}
          </Text>

          {/* Points earned */}
          <View style={[styles.pointsEarned, { backgroundColor: '#F59E0B18' }]}>
            <MaterialIcons name="star" size={16} color="#F59E0B" />
            <Text style={styles.pointsEarnedText}>
              +{suggestion.points} {t('aiSuggestions.points')}
            </Text>
          </View>

          <Text style={[styles.completionSubtext, { color: colors.mutedText }]}>
            {t('aiSuggestions.activityCompletedBody')}
          </Text>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.completionBtn,
              { backgroundColor: accentColor, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={styles.completionBtnText}>{t('aiSuggestions.greatThanks')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  Rich suggestion card                                               */
/* ------------------------------------------------------------------ */

function SuggestionCard({
  suggestion,
  accentColor,
  colors,
  onComplete,
  isCompleting,
}: {
  suggestion: AISuggestion;
  accentColor: string;
  colors: (typeof Colors)['light'] | (typeof Colors)['dark'];
  onComplete: () => void;
  isCompleting: boolean;
}) {
  const { t } = useTranslation();
  const isDone = suggestion.completed;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: isDone ? accentColor + '30' : colors.border,
        },
        isDone && { opacity: 0.75 },
      ]}
    >
      {/* Top row: icon + title + action */}
      <View style={styles.cardHeader}>
        <View style={[styles.cardBadge, { backgroundColor: accentColor + '14' }]}>
          <Text style={{ fontSize: 22 }}>
            {CATEGORY_CONFIG[suggestion.category]?.emoji ?? '✨'}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text
              style={[
                styles.cardTitle,
                { color: colors.text, flex: 1 },
                isDone && { textDecorationLine: 'line-through', opacity: 0.7 },
              ]}
              numberOfLines={2}
            >
              {suggestion.title}
            </Text>
          </View>
          {/* Meta row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
            {suggestion.duration && (
              <View style={[styles.metaChip, { backgroundColor: colors.background }]}>
                <Text style={{ color: colors.mutedText, fontSize: 11 }}>⏱ {suggestion.duration}</Text>
              </View>
            )}
            {suggestion.difficulty && (
              <View
                style={[
                  styles.metaChip,
                  {
                    backgroundColor:
                      suggestion.difficulty === 'easy'
                        ? '#5AAF8B12'
                        : suggestion.difficulty === 'hard'
                          ? '#EF444412'
                          : colors.background,
                  },
                ]}
              >
                <Text
                  style={{
                    color:
                      suggestion.difficulty === 'easy'
                        ? '#5AAF8B'
                        : suggestion.difficulty === 'hard'
                          ? '#EF4444'
                          : colors.mutedText,
                    fontSize: 11,
                    fontWeight: '700',
                  }}
                >
                  {suggestion.difficulty.charAt(0).toUpperCase() + suggestion.difficulty.slice(1)}
                </Text>
              </View>
            )}
            {!suggestion.templateId && (
              <View style={styles.aiBadge}>
                <MaterialIcons name="auto-awesome" size={10} color="#8B5CF6" />
                <Text style={styles.aiBadgeText}>AI</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action button */}
        {!isDone ? (
          <Pressable
            onPress={onComplete}
            disabled={isCompleting}
            style={({ pressed }) => [
              styles.completeBtn,
              { backgroundColor: accentColor, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            {isCompleting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialIcons name="check" size={20} color="#fff" />
            )}
          </Pressable>
        ) : (
          <View style={[styles.completedBadge, { backgroundColor: accentColor + '15' }]}>
            <MaterialIcons name="check-circle" size={16} color={accentColor} />
          </View>
        )}
      </View>

      {/* Description */}
      {suggestion.description ? (
        <Text style={{ color: colors.mutedText, fontSize: 13, lineHeight: 20, marginTop: 12 }}>
          {suggestion.description}
        </Text>
      ) : null}

      {/* Footer */}
      <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
        <View style={[styles.pointsTag, { backgroundColor: accentColor + '12' }]}>
          <MaterialIcons name="star" size={12} color={accentColor} />
          <Text style={{ color: accentColor, fontSize: 12, fontWeight: '800' }}>
            +{suggestion.points} pts
          </Text>
        </View>
        {suggestion.completedAt && (
          <Text style={{ color: colors.mutedText, fontSize: 11 }}>
            {new Date(suggestion.completedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        )}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Screen                                                             */
/* ------------------------------------------------------------------ */

export default function AISuggestionCategoryScreen() {
  const { t } = useTranslation();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ category: string }>();
  const category = params.category ?? 'mindfulness';

  const config = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.mindfulness;

  const {
    suggestions,
    isLoadingSuggestions,
    completeSuggestion,
    isCompleting,
    generateSuggestions,
    isGenerating,
    activityStats,
  } = useFreudScore();

  const [showCompletion, setShowCompletion] = useState(false);
  const [showMoodCheckIn, setShowMoodCheckIn] = useState(false);
  const [completedSuggestion, setCompletedSuggestion] = useState<AISuggestion | null>(null);
  const [pendingSuggestion, setPendingSuggestion] = useState<AISuggestion | null>(null);

  const categorySuggestions = suggestions.filter((s) => s.category === category);
  const pending = categorySuggestions.filter((s) => !s.completed);
  const completed = categorySuggestions.filter((s) => s.completed);

  const catStats = activityStats?.byCategory[category];
  const totalCatPoints = catStats?.points ?? 0;
  const totalCatActivities = catStats?.count ?? 0;
  const streak = activityStats?.streak ?? 0;

  const handleComplete = (suggestion: AISuggestion) => {
    if (suggestion.completed || isCompleting) return;
    setPendingSuggestion(suggestion);
    setShowMoodCheckIn(true);
  };

  const handleMoodComplete = async (moods: { moodBefore: MoodValue; moodAfter: MoodValue }) => {
    if (!pendingSuggestion) return;
    setShowMoodCheckIn(false);
    try {
      const result = await completeSuggestion({
        suggestionId: pendingSuggestion.id,
        moodBefore: moods.moodBefore,
        moodAfter: moods.moodAfter,
      });
      setCompletedSuggestion(pendingSuggestion);
      setShowCompletion(true);
    } catch (e) {
      console.warn('[AISuggestionCategory] Failed to complete:', e);
    }
    setPendingSuggestion(null);
  };

  const handleMoodSkip = async () => {
    if (!pendingSuggestion) return;
    setShowMoodCheckIn(false);
    try {
      const result = await completeSuggestion({ suggestionId: pendingSuggestion.id });
      setCompletedSuggestion(pendingSuggestion);
      setShowCompletion(true);
    } catch (e) {
      console.warn('[AISuggestionCategory] Failed to complete:', e);
    }
    setPendingSuggestion(null);
  };

  const handleGenerate = async () => {
    try {
      await generateSuggestions({ maxSuggestions: 4, category });
    } catch {
      // silent
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader title={t(`aiSuggestions.${category}`)} subtitle={t('aiSuggestions.title')} />

        {/* ── Hero card ── */}
        <View
          style={[
            styles.hero,
            { backgroundColor: config.color + '0A', borderColor: config.color + '20' },
          ]}
        >
          {/* Background decorative emoji */}
          <Text style={styles.heroBgEmoji}>{config.bgEmoji}</Text>

          <View style={[styles.heroIcon, { backgroundColor: config.color + '18' }]}>
            <Text style={{ fontSize: 40 }}>{config.emoji}</Text>
          </View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            {t(`aiSuggestions.${category}`)}
          </Text>

          {/* Count pills */}
          <View style={styles.heroCounts}>
            <View style={[styles.heroCountPill, { backgroundColor: config.color + '18' }]}>
              <View style={[styles.countDot, { backgroundColor: config.color }]} />
              <Text style={{ color: config.color, fontSize: 13, fontWeight: '700' }}>
                {pending.length} {t('aiSuggestions.pendingLabel')}
              </Text>
            </View>
            <View style={[styles.heroCountPill, { backgroundColor: colors.text + '08' }]}>
              <MaterialIcons name="check-circle" size={13} color={colors.mutedText} />
              <Text style={{ color: colors.mutedText, fontSize: 13, fontWeight: '700' }}>
                {completed.length} {t('aiSuggestions.completedLabel')}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Stats row ── */}
        <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <View style={[styles.statIconWrap, { backgroundColor: config.color + '12' }]}>
              <MaterialIcons name="check-circle-outline" size={18} color={config.color} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{totalCatActivities}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedText }]}>
              {t('aiSuggestions.activitiesDone')}
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <View style={[styles.statIconWrap, { backgroundColor: '#F59E0B12' }]}>
              <MaterialIcons name="star" size={18} color="#F59E0B" />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{totalCatPoints}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedText }]}>
              {t('aiSuggestions.pointsEarned')}
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <View style={[styles.statIconWrap, { backgroundColor: '#EC407A12' }]}>
              <Text style={{ fontSize: 14 }}>🔥</Text>
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{streak}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedText }]}>
              {t('aiSuggestions.dayStreak')}
            </Text>
          </View>
        </View>

        {isLoadingSuggestions && (
          <ActivityIndicator size="small" color={config.color} style={{ marginTop: 24 }} />
        )}

        {/* ── Pending suggestions ── */}
        {pending.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t('aiSuggestions.suggestedActivity')}
              </Text>
              <View style={[styles.sectionCount, { backgroundColor: config.color + '14' }]}>
                <Text style={{ color: config.color, fontSize: 12, fontWeight: '800' }}>
                  {pending.length}
                </Text>
              </View>
            </View>
            {pending.map((s) => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                accentColor={config.color}
                colors={colors}
                onComplete={() => handleComplete(s)}
                isCompleting={isCompleting}
              />
            ))}
          </View>
        )}

        {/* Generate more */}
        {!isLoadingSuggestions && pending.length < 3 && (
          <Pressable
            onPress={handleGenerate}
            disabled={isGenerating}
            style={({ pressed }) => [
              styles.generateBtn,
              {
                backgroundColor: config.color,
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialIcons name="auto-awesome" size={20} color="#fff" />
            )}
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700', marginLeft: 8 }}>
              {t('aiSuggestions.generateMore')}
            </Text>
          </Pressable>
        )}

        {/* ── Completed suggestions ── */}
        {completed.length > 0 && (
          <View style={{ marginTop: 28 }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.mutedText }]}>
                {t('aiSuggestions.completed')}
              </Text>
              <View style={[styles.sectionCount, { backgroundColor: colors.text + '0A' }]}>
                <Text style={{ color: colors.mutedText, fontSize: 12, fontWeight: '800' }}>
                  {completed.length}
                </Text>
              </View>
            </View>
            {completed.map((s) => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                accentColor={config.color}
                colors={colors}
                onComplete={() => {}}
                isCompleting={false}
              />
            ))}
          </View>
        )}

        {/* ── Empty state ── */}
        {!isLoadingSuggestions && categorySuggestions.length === 0 && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconWrap, { backgroundColor: config.color + '12' }]}>
              <Text style={{ fontSize: 48 }}>{config.emoji}</Text>
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No suggestions yet
            </Text>
            <Text
              style={{ color: colors.mutedText, fontSize: 14, marginTop: 6, textAlign: 'center', lineHeight: 20 }}
            >
              {t('aiSuggestions.noCategorySuggestions')}
            </Text>
            <Pressable
              onPress={handleGenerate}
              disabled={isGenerating}
              style={({ pressed }) => [
                styles.generateBtn,
                {
                  backgroundColor: config.color,
                  opacity: pressed ? 0.8 : 1,
                  marginTop: 20,
                },
              ]}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialIcons name="auto-awesome" size={20} color="#fff" />
              )}
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700', marginLeft: 8 }}>
                {t('aiSuggestions.generateSuggestions')}
              </Text>
            </Pressable>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <MoodCheckInModal
        visible={showMoodCheckIn}
        accentColor={config.color}
        activityTitle={pendingSuggestion?.title ?? ''}
        onComplete={handleMoodComplete}
        onSkip={handleMoodSkip}
      />

      <CompletionModal
        visible={showCompletion}
        onClose={() => setShowCompletion(false)}
        suggestion={completedSuggestion}
        accentColor={config.color}
        colors={colors}
      />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  scroll: { paddingBottom: 120 },

  /* Hero */
  hero: {
    borderRadius: 28,
    padding: 28,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
    ...UI.shadow.sm,
  },
  heroBgEmoji: {
    position: 'absolute',
    top: -10,
    right: -10,
    fontSize: 100,
    opacity: 0.06,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroTitle: { fontSize: 24, fontWeight: '900' },
  heroCounts: { flexDirection: 'row', gap: 10, marginTop: 16 },
  heroCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
  },
  countDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  /* Stats */
  statsRow: {
    flexDirection: 'row',
    borderRadius: 22,
    padding: 18,
    marginTop: 14,
    borderWidth: 1,
    ...UI.shadow.sm,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: { fontSize: 20, fontWeight: '900' },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statDivider: { width: 1, height: '70%', alignSelf: 'center' },

  /* Section headers */
  sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: 14 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionCount: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Suggestion cards */
  card: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    ...UI.shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  metaChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF618',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  aiBadgeText: { color: '#8B5CF6', fontSize: 10, fontWeight: '800' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  pointsTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  completeBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...UI.shadow.sm,
  },
  completedBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Generate button */
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 18,
    marginTop: 16,
    ...UI.shadow.sm,
  },

  /* Empty state */
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
  },

  /* Completion modal */
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
  completionIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  completionTitle: { fontSize: 22, fontWeight: '900', textAlign: 'center' },
  completionActivityName: { fontSize: 15, fontWeight: '700', marginTop: 8, textAlign: 'center' },
  pointsEarned: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    marginTop: 14,
  },
  pointsEarnedText: { color: '#F59E0B', fontSize: 16, fontWeight: '800' },
  completionSubtext: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 20,
  },
  completionBtn: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...UI.shadow.sm,
  },
  completionBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
