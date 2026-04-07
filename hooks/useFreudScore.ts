import { useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/supabase/supabase';
import { useUser } from './useUser';
import { useMood } from './useMood';
import { useJournal } from './useJournal';
import { useSleep } from './useSleep';
import { useMindfulness } from './useMindfulness';
import { useStress } from './useStress';
import {
  calculateFreudScore,
  getFreudLabel,
  type FreudScoreResult,
  type FreudScoreRecord,
  type AISuggestion,
  type FreudBreakdown,
} from '@/lib/freudScore';
import { notifySuggestionCompleted, notifyNewSuggestions } from '@/lib/notificationStore';
import { useSuggestionBonusStore } from '@/lib/suggestionBonusStore';
import {
  generateSuggestionsForUser,
  logActivityCompletion,
  getActivityStats,
} from '@/lib/suggestionEngine';
import { queryKeys, STALE } from '@/lib/queryKeys';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ActivityStats = {
  totalActivities: number;
  totalPoints: number;
  thisWeekActivities: number;
  thisWeekPoints: number;
  streak: number;
  byCategory: Record<string, { count: number; points: number }>;
};

const EMPTY_SCORE: FreudScoreResult = {
  score: 0,
  label: getFreudLabel(0),
  breakdown: { mood: 0, sleep: 0, stress: 0, mindfulness: 0, consistency: 0, journal: 0 },
};

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export const useFreudScore = (opts?: { lazy?: boolean }) => {
  const lazy = opts?.lazy ?? false;
  const queryClient = useQueryClient();
  const { data: user } = useUser();

  const scoreKey = queryKeys.freudScore.list(user?.id);
  const todayBestKey = queryKeys.freudScore.todayBest(user?.id);
  const suggestionsKey = queryKeys.suggestions.list(user?.id);
  const statsKey = queryKeys.activityStats.list(user?.id);

  /* ═══════════════════════════════════════════════════════════════════
   *  SOURCE DATA — the 5 tracking hooks that feed the score
   * ═══════════════════════════════════════════════════════════════════ */
  const { moodCheckIns, isLoading: isMoodLoading } = useMood();
  const { journalEntries, isLoading: isJournalLoading } = useJournal();
  const { sleepEntries, isLoading: isSleepLoading } = useSleep();
  const { mindfulnessHistory, isLoading: isMindfulnessLoading } = useMindfulness();
  const { stressHistory, isLoading: isStressLoading } = useStress();

  /* ── True ONLY on cold start (no cached data at all yet) ── */
  const isDataLoading =
    isMoodLoading || isJournalLoading || isSleepLoading || isMindfulnessLoading || isStressLoading;

  /* ═══════════════════════════════════════════════════════════════════
   *  LIVE SCORE — pure derivation from current data
   *
   *  Rules:
   *  • On cold start (isLoading, no cache) → show loading placeholder
   *  • Otherwise → ALWAYS calculate from current cached data
   *  • During background refetches, cached data is still valid and
   *    gets updated as each query completes — the score simply
   *    recalculates on each render, converging to the correct value
   *  • No DB history, no overrides, no Math.max tricks
   * ═══════════════════════════════════════════════════════════════════ */
  const hasEverLoaded = useRef(false);
  if (!isDataLoading) hasEverLoaded.current = true;

  /* ── Suggestion bonus: gamification points from completing AI suggestions ── */
  /* Shared via Zustand so ALL useFreudScore() instances see the same bonus */
  const suggestionBonus = useSuggestionBonusStore((s) => s.scoreBonus);
  const breakdownBonus = useSuggestionBonusStore((s) => s.breakdownBonus);

  /* ── Today's best saved score — persists suggestion bonuses across reloads ── */
  const todayBestQuery = useQuery({
    queryKey: todayBestKey,
    enabled: !!user,
    staleTime: STALE.short,
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('freud_scores')
        .select('score, breakdown')
        .eq('user_id', user.id)
        .gte('created_at', todayStart.toISOString())
        .order('score', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data
        ? { score: data.score as number, breakdown: data.breakdown as unknown as FreudBreakdown }
        : null;
    },
  });

  const todayBest = todayBestQuery.data ?? null;

  const rawScore: FreudScoreResult = (isDataLoading && !hasEverLoaded.current)
    ? EMPTY_SCORE
    : calculateFreudScore({
        moodCheckIns,
        journalEntries,
        sleepEntries,
        mindfulnessHistory,
        stressHistory,
      });

  /* ── Final score: max of (live calc + session bonus) vs (today's best from DB) ──
   *
   *  • Session bonus (Zustand): gives instant feedback when completing suggestions
   *  • Today's best (DB): persists bonuses across app restarts
   *  • We take the higher of the two so progress is never lost
   *  • Only compares against TODAY's saved scores, not historical ones,
   *    so the score can naturally go down day-to-day based on real metrics
   */
  const liveWithBonus = Math.min(100, rawScore.score + suggestionBonus);
  const dbScore = todayBest?.score ?? 0;
  const finalScore = Math.max(liveWithBonus, dbScore);

  const currentScore: FreudScoreResult = finalScore > rawScore.score
    ? {
        ...rawScore,
        score: finalScore,
        label: getFreudLabel(finalScore),
        breakdown: {
          mood: Math.min(100, Math.max(rawScore.breakdown.mood, todayBest?.breakdown?.mood ?? 0) + (breakdownBonus.mood ?? 0)),
          sleep: Math.min(100, Math.max(rawScore.breakdown.sleep, todayBest?.breakdown?.sleep ?? 0) + (breakdownBonus.sleep ?? 0)),
          stress: Math.min(100, Math.max(rawScore.breakdown.stress, todayBest?.breakdown?.stress ?? 0) + (breakdownBonus.stress ?? 0)),
          mindfulness: Math.min(100, Math.max(rawScore.breakdown.mindfulness, todayBest?.breakdown?.mindfulness ?? 0) + (breakdownBonus.mindfulness ?? 0)),
          consistency: Math.min(100, Math.max(rawScore.breakdown.consistency, todayBest?.breakdown?.consistency ?? 0) + (breakdownBonus.consistency ?? 0)),
          journal: Math.min(100, Math.max(rawScore.breakdown.journal, todayBest?.breakdown?.journal ?? 0) + (breakdownBonus.journal ?? 0)),
        },
      }
    : rawScore;

  /* ═══════════════════════════════════════════════════════════════════
   *  SCORE HISTORY (DB) — for the chart on the detail screen
   *  Skipped in lazy mode (home screen doesn't need it)
   * ═══════════════════════════════════════════════════════════════════ */
  const historyQuery = useQuery({
    queryKey: scoreKey,
    enabled: !!user && !lazy,
    staleTime: STALE.medium,
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('freud_scores')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(90);

      if (error) throw error;

      return (data ?? []).map(
        (d): FreudScoreRecord => ({
          id: d.id,
          score: d.score,
          label: d.label,
          breakdown: d.breakdown as unknown as FreudBreakdown,
          source: d.source ?? 'auto',
          createdAt: d.created_at,
        }),
      );
    },
  });

  /* ═══════════════════════════════════════════════════════════════════
   *  SAVE SCORE SNAPSHOT
   * ═══════════════════════════════════════════════════════════════════ */
  const saveMutation = useMutation({
    mutationFn: async (saveOpts?: { result?: FreudScoreResult; generateSuggestions?: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      const r = saveOpts?.result ?? currentScore;
      const shouldGenerate = saveOpts?.generateSuggestions ?? true;

      // Don't save empty/loading scores
      if (r.score === 0) return null;

      // Check if a score already exists today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: existing } = await supabase
        .from('freud_scores')
        .select('id, score')
        .eq('user_id', user.id)
        .gte('created_at', todayStart.toISOString())
        .order('score', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing && existing.score >= r.score) {
        return existing;
      }

      const { data: inserted, error } = await supabase
        .from('freud_scores')
        .insert({
          user_id: user.id,
          score: r.score,
          label: r.label,
          breakdown: r.breakdown as any,
          source: 'auto',
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      const data = inserted ?? existing;

      if (shouldGenerate) {
        try {
          await generateSuggestionsForUser({
            userId: user.id,
            score: r.score,
            breakdown: r.breakdown,
            freudScoreId: data?.id,
            maxSuggestions: 6,
          });
        } catch {
          console.warn('[FreudScore] Failed to auto-generate suggestions');
        }
      }

      return data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: scoreKey });
      queryClient.invalidateQueries({ queryKey: todayBestKey });
      queryClient.invalidateQueries({ queryKey: suggestionsKey });
    },
  });

  /* ═══════════════════════════════════════════════════════════════════
   *  AI SUGGESTIONS (skipped in lazy mode)
   * ═══════════════════════════════════════════════════════════════════ */
  const suggestionsQuery = useQuery({
    queryKey: suggestionsKey,
    enabled: !!user && !lazy,
    staleTime: STALE.short,
    placeholderData: (prev) => prev,
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ai_suggestions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data ?? []).map(
        (d): AISuggestion => ({
          id: d.id,
          freudScoreId: d.freud_score_id,
          templateId: d.template_id,
          category: d.category as AISuggestion['category'],
          title: d.title,
          description: d.description,
          duration: d.duration,
          completed: d.completed,
          completedAt: d.completed_at,
          points: d.points,
          difficulty: d.difficulty,
          createdAt: d.created_at,
        }),
      );
    },
  });

  /* ═══════════════════════════════════════════════════════════════════
   *  COMPLETE A SUGGESTION (+ log activity + save bumped score)
   * ═══════════════════════════════════════════════════════════════════ */
  const completeSuggestionMutation = useMutation({
    mutationFn: async (input: {
      suggestionId: string;
      moodBefore?: string;
      moodAfter?: string;
    }): Promise<{ suggestion: any; newScore: number; breakdown: FreudBreakdown }> => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ai_suggestions')
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq('id', input.suggestionId)
        .eq('user_id', user.id)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Suggestion not found');

      // Log the activity
      try {
        const durationStr = data.duration ?? '';
        const durationMinutes = parseInt(durationStr) || undefined;
        await logActivityCompletion({
          userId: user.id,
          suggestionId: data.id,
          category: data.category,
          title: data.title,
          description: data.description ?? undefined,
          durationMinutes,
          pointsEarned: data.points,
          moodBefore: input.moodBefore,
          moodAfter: input.moodAfter,
        });
      } catch {
        console.warn('[FreudScore] Failed to log activity');
      }

      // Bump score based on points
      const rawPoints = data.points ?? 5;
      const bonusPoints = Math.max(1, Math.min(rawPoints, 5));
      const baseScore = currentScore.score;
      const baseBreakdown: FreudBreakdown = { ...currentScore.breakdown };

      const categoryMetricMap: Record<string, keyof FreudBreakdown> = {
        mindfulness: 'mindfulness',
        physical: 'stress',
        social: 'mood',
        professional: 'consistency',
      };
      const metricKey = categoryMetricMap[data.category];
      if (metricKey) {
        const metricBonus = Math.min(15, bonusPoints * 3);
        baseBreakdown[metricKey] = Math.min(100, (baseBreakdown[metricKey] ?? 0) + metricBonus);
      }

      const newScore = Math.min(100, baseScore + bonusPoints);
      const newLabel = getFreudLabel(newScore);

      // Save the bumped score to DB
      const { error: insertErr } = await supabase
        .from('freud_scores')
        .insert({
          user_id: user.id,
          score: newScore,
          label: newLabel,
          breakdown: baseBreakdown as any,
          source: 'activity_completion',
        });

      if (insertErr) {
        console.warn('[FreudScore] Failed to insert bumped score:', insertErr);
      }

      return { suggestion: data, newScore, breakdown: baseBreakdown };
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: suggestionsKey });
      const previous = queryClient.getQueryData<AISuggestion[]>(suggestionsKey);

      queryClient.setQueryData<AISuggestion[]>(
        suggestionsKey,
        (old) =>
          old?.map((s) =>
            s.id === input.suggestionId
              ? { ...s, completed: true, completedAt: new Date().toISOString() }
              : s,
          ) ?? [],
      );

      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) queryClient.setQueryData(suggestionsKey, context.previous);
    },
    onSuccess: (result, input) => {
      const suggestion = (suggestionsQuery.data ?? []).find((s) => s.id === input.suggestionId);
      if (suggestion) {
        notifySuggestionCompleted(suggestion.title, suggestion.points, suggestion.category);
      }

      /* ── Update suggestion bonus so currentScore reflects the bump immediately ── */
      /* Uses shared Zustand store so ALL useFreudScore() instances update */
      const bonusPoints = Math.max(1, Math.min(result.suggestion?.points ?? 5, 5));
      const categoryMetricMap: Record<string, keyof FreudBreakdown> = {
        mindfulness: 'mindfulness',
        physical: 'stress',
        social: 'mood',
        professional: 'consistency',
      };
      const metricKey = categoryMetricMap[result.suggestion?.category];
      const metricBonus = metricKey ? Math.min(15, bonusPoints * 3) : undefined;
      useSuggestionBonusStore.getState().addBonus(bonusPoints, metricKey, metricBonus);
    },
    onSettled: () => {
      // Invalidate everything so live score recalculates on next render
      queryClient.invalidateQueries({ queryKey: suggestionsKey });
      queryClient.invalidateQueries({ queryKey: statsKey });
      queryClient.invalidateQueries({ queryKey: scoreKey });
      queryClient.invalidateQueries({ queryKey: todayBestKey });
      // Also invalidate source data so the live calc picks up the new activity
      queryClient.invalidateQueries({ queryKey: queryKeys.mood.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stress.allHistory });
      queryClient.invalidateQueries({ queryKey: queryKeys.mindfulness.all });
    },
  });

  /* ═══════════════════════════════════════════════════════════════════
   *  ADD SUGGESTION MANUALLY
   * ═══════════════════════════════════════════════════════════════════ */
  const addSuggestionMutation = useMutation({
    mutationFn: async (input: {
      category: AISuggestion['category'];
      title: string;
      description?: string;
      duration?: string;
      points?: number;
      freudScoreId?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ai_suggestions')
        .insert({
          user_id: user.id,
          freud_score_id: input.freudScoreId ?? null,
          category: input.category,
          title: input.title,
          description: input.description ?? null,
          duration: input.duration ?? null,
          points: input.points ?? 5,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: suggestionsKey });
    },
  });

  /* ═══════════════════════════════════════════════════════════════════
   *  GENERATE SUGGESTIONS ON DEMAND
   * ═══════════════════════════════════════════════════════════════════ */
  const generateSuggestionsMutation = useMutation({
    mutationFn: async (genOpts?: { maxSuggestions?: number; category?: string }) => {
      if (!user) throw new Error('Not authenticated');

      return generateSuggestionsForUser({
        userId: user.id,
        score: currentScore.score,
        breakdown: currentScore.breakdown,
        freudScoreId: historyQuery.data?.[0]?.id,
        maxSuggestions: genOpts?.maxSuggestions ?? 6,
        category: genOpts?.category,
      });
    },
    onSuccess: (_data, genOpts) => {
      setTimeout(() => notifyNewSuggestions(genOpts?.maxSuggestions ?? 6), 600);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: suggestionsKey });
    },
  });

  /* ═══════════════════════════════════════════════════════════════════
   *  ACTIVITY STATS (skipped in lazy mode)
   * ═══════════════════════════════════════════════════════════════════ */
  const activityStatsQuery = useQuery({
    queryKey: statsKey,
    enabled: !!user && !lazy,
    staleTime: STALE.medium,
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      return getActivityStats(user.id);
    },
  });

  /* ═══════════════════════════════════════════════════════════════════
   *  RETURN — clean, predictable API
   * ═══════════════════════════════════════════════════════════════════ */
  return {
    // Score — ONLY live-calculated, never from DB or overrides
    currentScore,
    isDataLoading,

    // History (for charts)
    scoreHistory: historyQuery.data ?? [],
    isLoadingHistory: historyQuery.isLoading,

    // Save
    saveScore: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,

    // AI suggestions
    suggestions: suggestionsQuery.data ?? [],
    isLoadingSuggestions: suggestionsQuery.isLoading,
    completeSuggestion: completeSuggestionMutation.mutateAsync,
    addSuggestion: addSuggestionMutation.mutateAsync,
    isCompleting: completeSuggestionMutation.isPending,

    // Generate suggestions
    generateSuggestions: generateSuggestionsMutation.mutateAsync,
    isGenerating: generateSuggestionsMutation.isPending,

    // Activity stats
    activityStats: activityStatsQuery.data as ActivityStats | undefined,
    isLoadingStats: activityStatsQuery.isLoading,
  };
};
