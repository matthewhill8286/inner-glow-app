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
  const currentScore: FreudScoreResult = isDataLoading
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

  /* ---- save a new score snapshot (+ optionally auto-generate suggestions) ---- */
  const saveMutation = useMutation({
    mutationFn: async (opts?: { result?: FreudScoreResult; generateSuggestions?: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      const r = opts?.result ?? currentScore;
      const shouldGenerate = opts?.generateSuggestions ?? true;

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: existing } = await supabase
        .from('freud_scores')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', todayStart.toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let data;

      if (existing) {
        const { data: updated, error } = await supabase
          .from('freud_scores')
          .update({
            score: r.score,
            label: r.label,
            breakdown: r.breakdown as any,
            source: 'auto',
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        data = updated;
      } else {
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
          .single();

        if (error) throw error;
        data = inserted;
      }

      if (shouldGenerate) {
        try {
          await generateSuggestionsForUser({
            userId: user.id,
            score: r.score,
            breakdown: r.breakdown,
            freudScoreId: data.id,
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
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ai_suggestions')
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq('id', input.suggestionId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

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

      try {
        const bonusPoints = Math.min(data.points, 5);
        const latestScore = historyQuery.data?.[0];
        const baseScore = latestScore?.score ?? currentScore.score;
        const newScore = Math.min(100, baseScore + bonusPoints);

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const { data: existingToday } = await supabase
          .from('freud_scores')
          .select('id')
          .eq('user_id', user.id)
          .gte('created_at', todayStart.toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingToday) {
          await supabase
            .from('freud_scores')
            .update({
              score: newScore,
              label: currentScore.label,
              breakdown: currentScore.breakdown as any,
              source: 'activity_completion',
            })
            .eq('id', existingToday.id);
        } else {
          await supabase.from('freud_scores').insert({
            user_id: user.id,
            score: newScore,
            label: currentScore.label,
            breakdown: currentScore.breakdown as any,
            source: 'activity_completion',
          });
        }
      } catch {
        console.warn('[FreudScore] Failed to save activity score bump');
      }

      return data;
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
    onSuccess: (_data, input) => {
      const suggestion = (suggestionsQuery.data ?? []).find((s) => s.id === input.suggestionId);
      if (suggestion) {
        notifySuggestionCompleted(suggestion.title, suggestion.points, suggestion.category);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: suggestionsKey });
      queryClient.invalidateQueries({ queryKey: scoreKey });
      queryClient.invalidateQueries({ queryKey: statsKey });
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
        .single();

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
  };
};
