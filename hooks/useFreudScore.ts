import { useState, useCallback } from 'react';
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

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export const useFreudScore = (opts?: { lazy?: boolean }) => {
  const lazy = opts?.lazy ?? false;
  const queryClient = useQueryClient();
  const { data: user } = useUser();

  const scoreKey = queryKeys.freudScore.list(user?.id);
  const suggestionsKey = queryKeys.suggestions.list(user?.id);
  const statsKey = queryKeys.activityStats.list(user?.id);

  /* ---- local score override: set after activity completion to immediately reflect bump ---- */
  const [scoreOverride, setScoreOverride] = useState<number | null>(null);
  const clearScoreOverride = useCallback(() => setScoreOverride(null), []);

  /* ---- pull all tracking data needed for the score ---- */
  const { moodCheckIns, isLoading: isMoodLoading } = useMood();
  const { journalEntries, isLoading: isJournalLoading } = useJournal();
  const { sleepEntries, isLoading: isSleepLoading } = useSleep();
  const { mindfulnessHistory, isLoading: isMindfulnessLoading } = useMindfulness();
  const { stressHistory, isLoading: isStressLoading } = useStress();

  /* ---- combined loading state for all source data ---- */
  const isDataLoading =
    isMoodLoading || isJournalLoading || isSleepLoading || isMindfulnessLoading || isStressLoading;

  /* ---- live-calculated score (client-side) ---- */
  const liveScore: FreudScoreResult = isDataLoading
    ? { score: 0, label: 'Critically Low', breakdown: { mood: 0, sleep: 0, stress: 0, mindfulness: 0, consistency: 0, journal: 0 } }
    : calculateFreudScore({
        moodCheckIns,
        journalEntries,
        sleepEntries,
        mindfulnessHistory,
        stressHistory,
      });

  /* ---- saved score history from DB (skipped in lazy mode) ---- */
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

  /* ---- display score: use higher of live calc vs latest saved DB score vs local override ---- */
  const latestSaved = historyQuery.data?.[0];
  const currentScore: FreudScoreResult = (() => {
    // Determine the best known score from all sources
    const savedScore = latestSaved?.score ?? 0;
    const overrideScore = scoreOverride ?? 0;
    const bestScore = Math.max(liveScore.score, savedScore, overrideScore);

    if (isDataLoading && !scoreOverride) return liveScore;

    // If the override or saved score is higher than the live calculation,
    // use that score (activity completion bonuses aren't reflected in live calc)
    if (bestScore > liveScore.score) {
      const breakdown = latestSaved?.breakdown ?? liveScore.breakdown;
      const mergedBreakdown: FreudBreakdown = {
        mood: Math.max(breakdown.mood ?? 0, liveScore.breakdown.mood),
        sleep: Math.max(breakdown.sleep ?? 0, liveScore.breakdown.sleep),
        stress: Math.max(breakdown.stress ?? 0, liveScore.breakdown.stress),
        mindfulness: Math.max(breakdown.mindfulness ?? 0, liveScore.breakdown.mindfulness),
        consistency: Math.max(breakdown.consistency ?? 0, liveScore.breakdown.consistency),
        journal: Math.max(breakdown.journal ?? 0, liveScore.breakdown.journal),
      };
      return {
        score: bestScore,
        label: getFreudLabel(bestScore),
        breakdown: mergedBreakdown,
      };
    }

    return liveScore;
  })();

  /* ---- save a new score snapshot (+ optionally auto-generate suggestions) ---- */
  const saveMutation = useMutation({
    mutationFn: async (opts?: { result?: FreudScoreResult; generateSuggestions?: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      const r = opts?.result ?? liveScore;
      const shouldGenerate = opts?.generateSuggestions ?? true;

      // Check if a higher score already exists today (e.g. from activity completion)
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

      // If today already has a higher score, skip saving
      if (existing && existing.score >= r.score) {
        return existing;
      }

      // Always INSERT a new record (UPDATE is blocked by RLS policy).
      // The history query sorts by created_at DESC, so the newest record wins.
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
      queryClient.invalidateQueries({ queryKey: suggestionsKey });
    },
  });

  /* ---- AI suggestions (skipped in lazy mode) ---- */
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

  /* ---- complete a suggestion (+ log activity + bump score) ---- */
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

      // Log the activity (non-blocking)
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

      // Bump the score — ensure points defaults to 5 if null/undefined
      const rawPoints = data.points ?? 5;
      const bonusPoints = Math.max(1, Math.min(rawPoints, 5));

      // Fetch the latest score directly from DB to avoid stale closure values
      const { data: latestFromDb, error: fetchErr } = await supabase
        .from('freud_scores')
        .select('id, score, label, breakdown, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchErr) console.warn('[FreudScore] Failed to fetch latest score:', fetchErr);

      const baseScore = latestFromDb?.score ?? liveScore.score;
      const baseBreakdown: FreudBreakdown = {
        ...(latestFromDb?.breakdown
          ? (latestFromDb.breakdown as unknown as FreudBreakdown)
          : liveScore.breakdown),
      };

      // Bump the relevant breakdown metric based on the suggestion category
      const categoryMetricMap: Record<string, keyof FreudBreakdown> = {
        mindfulness: 'mindfulness',
        physical: 'stress',       // physical activity reduces stress
        social: 'mood',           // social connection improves mood
        professional: 'consistency', // professional support builds consistency
      };
      const metricKey = categoryMetricMap[data.category];
      if (metricKey) {
        const metricBonus = Math.min(15, bonusPoints * 3); // meaningful bump (3-15 pts)
        baseBreakdown[metricKey] = Math.min(100, (baseBreakdown[metricKey] ?? 0) + metricBonus);
      }

      const newScore = Math.min(100, baseScore + bonusPoints);
      const newLabel = getFreudLabel(newScore);

      // Always INSERT a new score record (UPDATE is blocked by RLS policy).
      // The history query sorts by created_at DESC, so the newest record wins.
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

      console.log('[FreudScore] Score bumped:', baseScore, '->', newScore, '(+' + bonusPoints + ')', metricKey ? `[${metricKey} +${Math.min(15, bonusPoints * 3)}]` : '');
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

      // Immediately set the local score override — this triggers a React state update
      // which guarantees a re-render with the new score, bypassing React Query cache timing
      if (result.newScore) {
        console.log('[FreudScore] Setting score override to:', result.newScore);
        setScoreOverride(result.newScore);

        // Also update the query cache so other screens pick it up (including updated breakdown)
        const updatedBreakdown = result.breakdown ?? liveScore.breakdown;
        queryClient.setQueryData<FreudScoreRecord[]>(scoreKey, (old) => {
          if (!old || old.length === 0) {
            return [{
              id: 'optimistic',
              score: result.newScore,
              label: getFreudLabel(result.newScore),
              breakdown: updatedBreakdown,
              source: 'activity_completion',
              createdAt: new Date().toISOString(),
            }];
          }
          const updated = [...old];
          updated[0] = { ...updated[0], score: result.newScore, label: getFreudLabel(result.newScore), breakdown: updatedBreakdown, source: 'activity_completion' };
          return updated;
        });
      }
    },
    onSettled: () => {
      // Invalidate suggestions and stats immediately
      queryClient.invalidateQueries({ queryKey: suggestionsKey });
      queryClient.invalidateQueries({ queryKey: statsKey });
      // Delay score refetch so the optimistic update has time to show in the UI
      // before being potentially overwritten by the refetch
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: scoreKey });
      }, 2000);
    },
  });

  /* ---- add a suggestion manually ---- */
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

  /* ---- generate suggestions on demand ---- */
  const generateSuggestionsMutation = useMutation({
    mutationFn: async (opts?: { maxSuggestions?: number; category?: string }) => {
      if (!user) throw new Error('Not authenticated');

      const latestScore = historyQuery.data?.[0];
      const score = latestScore?.score ?? currentScore.score;
      const breakdown = latestScore?.breakdown ?? currentScore.breakdown;

      return generateSuggestionsForUser({
        userId: user.id,
        score,
        breakdown,
        freudScoreId: latestScore?.id,
        maxSuggestions: opts?.maxSuggestions ?? 6,
        category: opts?.category,
      });
    },
    onSuccess: (_data, opts) => {
      setTimeout(() => notifyNewSuggestions(opts?.maxSuggestions ?? 6), 600);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: suggestionsKey });
    },
  });

  /* ---- activity stats (skipped in lazy mode) ---- */
  const activityStatsQuery = useQuery({
    queryKey: statsKey,
    enabled: !!user && !lazy,
    staleTime: STALE.medium,
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      return getActivityStats(user.id);
    },
  });

  return {
    // Live score
    currentScore,
    liveScore,
    isDataLoading,

    // History
    scoreHistory: historyQuery.data ?? [],
    isLoadingHistory: historyQuery.isLoading,

    // Save (now auto-generates suggestions)
    saveScore: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,

    // AI suggestions
    suggestions: suggestionsQuery.data ?? [],
    isLoadingSuggestions: suggestionsQuery.isLoading,
    completeSuggestion: completeSuggestionMutation.mutateAsync,
    addSuggestion: addSuggestionMutation.mutateAsync,
    isCompleting: completeSuggestionMutation.isPending,

    // Generate suggestions on demand
    generateSuggestions: generateSuggestionsMutation.mutateAsync,
    isGenerating: generateSuggestionsMutation.isPending,

    // Activity stats
    activityStats: activityStatsQuery.data as ActivityStats | undefined,
    isLoadingStats: activityStatsQuery.isLoading,

    // Score override management
    clearScoreOverride,
  };
};
