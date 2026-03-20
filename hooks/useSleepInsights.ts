import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/supabase/supabase';
import { useSleep } from './useSleep';
import { SleepEntry } from '@/lib/types';

/* ── Types ── */

export type SleepSuggestion = {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  color: string;
};

export type SleepInsightsResult = {
  summary: string;
  suggestions: SleepSuggestion[];
};

/* ── Helpers ── */

function getEntryDuration(entry: SleepEntry): number {
  if (entry.duration) return entry.duration;
  return Math.max(
    0,
    (new Date(entry.endISO).getTime() - new Date(entry.startISO).getTime()) / (1000 * 60 * 60),
  );
}

function computeIrregularity(entries: SleepEntry[]): number {
  if (entries.length < 2) return 0;
  const bedtimeHours = entries.map((e) => {
    const d = new Date(e.startISO);
    let h = d.getHours() + d.getMinutes() / 60;
    if (h < 12) h += 24; // normalize late nights
    return h;
  });
  const avg = bedtimeHours.reduce((a, b) => a + b, 0) / bedtimeHours.length;
  const stdDev = Math.sqrt(
    bedtimeHours.reduce((a, b) => a + (b - avg) ** 2, 0) / bedtimeHours.length,
  );
  return Math.min(100, Math.round(stdDev * 20));
}

/* ── Hook ── */

/**
 * Fetches AI-powered sleep insights based on the user's recent sleep data.
 * Results are cached for 10 minutes and only re-fetched when sleep data changes.
 */
export const useSleepInsights = () => {
  const { sleepEntries, isLoading: isSleepLoading } = useSleep();

  const insightsQuery = useQuery<SleepInsightsResult>({
    queryKey: ['sleepInsights', sleepEntries.length, sleepEntries[0]?.id],
    enabled: !isSleepLoading && sleepEntries.length > 0,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    queryFn: async () => {
      const entries = sleepEntries.slice(0, 30).map((e) => ({
        startISO: e.startISO,
        endISO: e.endISO,
        duration: getEntryDuration(e),
        quality: e.quality,
        awakenings: e.awakenings,
        notes: e.notes,
      }));

      const avgDuration =
        entries.length > 0
          ? entries.reduce((a, e) => a + e.duration, 0) / entries.length
          : 0;

      const qualityEntries = entries.filter((e) => e.quality);
      const avgQuality =
        qualityEntries.length > 0
          ? qualityEntries.reduce((a, e) => a + (e.quality || 0), 0) / qualityEntries.length
          : 0;

      const irregularity = computeIrregularity(sleepEntries.slice(0, 30));

      const { data, error } = await supabase.functions.invoke('sleep-insights', {
        body: { sleepEntries: entries, irregularity, avgDuration, avgQuality },
      });

      if (error) throw new Error(error.message ?? 'Failed to generate sleep insights');

      return {
        summary: data?.summary ?? '',
        suggestions: (data?.suggestions ?? []) as SleepSuggestion[],
      };
    },
  });

  return {
    suggestions: insightsQuery.data?.suggestions ?? [],
    summary: insightsQuery.data?.summary ?? '',
    isLoading: insightsQuery.isLoading || isSleepLoading,
    isFetching: insightsQuery.isFetching,
    isError: insightsQuery.isError,
    error: insightsQuery.error,
    refetch: insightsQuery.refetch,
    hasData: sleepEntries.length > 0,
  };
};
