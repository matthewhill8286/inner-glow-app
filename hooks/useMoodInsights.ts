import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/supabase/supabase';
import { useMood } from './useMood';

/* ── Types ── */

export type MoodInsight = {
  id: string;
  title: string;
  description: string;
  category: 'pattern' | 'suggestion' | 'affirmation' | 'warning';
  icon: string;
  color: string;
  actionLabel: string;
};

export type MoodInsightsResult = {
  summary: string;
  insights: MoodInsight[];
};

/* ── Hook ── */

/**
 * Fetches AI-powered mood insights based on the user's recent mood check-ins.
 * Results are cached for 10 minutes and only re-fetched when mood data changes.
 */
export const useMoodInsights = () => {
  const { moodCheckIns, isLoading: isMoodLoading } = useMood();

  const insightsQuery = useQuery<MoodInsightsResult>({
    queryKey: ['moodInsights', moodCheckIns.length, moodCheckIns[0]?.id],
    enabled: !isMoodLoading && moodCheckIns.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // keep in cache 30 minutes
    retry: 1,
    queryFn: async () => {
      // Send up to 30 most recent entries
      const entries = moodCheckIns.slice(0, 30).map((m) => ({
        mood: m.mood,
        energy: m.energy,
        stress: m.stress,
        note: m.note,
        tags: m.tags,
        createdAt: m.createdAt,
      }));

      const { data, error } = await supabase.functions.invoke('mood-insights', {
        body: { moodEntries: entries },
      });

      if (error) throw new Error(error.message ?? 'Failed to generate insights');

      return {
        summary: data?.summary ?? '',
        insights: (data?.insights ?? []) as MoodInsight[],
      };
    },
  });

  return {
    insights: insightsQuery.data?.insights ?? [],
    summary: insightsQuery.data?.summary ?? '',
    isLoading: insightsQuery.isLoading || isMoodLoading,
    isFetching: insightsQuery.isFetching,
    isError: insightsQuery.isError,
    error: insightsQuery.error,
    refetch: insightsQuery.refetch,
    hasData: moodCheckIns.length > 0,
  };
};
