import { notifyMindfulnessSession } from '@/lib/notificationStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/supabase/supabase';
import { MindfulEntry } from '@/lib/types';
import type { Json } from '@/types/database.types';
import { useUser } from './useUser';
import { queryKeys, STALE } from '@/lib/queryKeys';

/** A practice session (07 §5): `practice` is set by the new players; older screens send only seconds and a note. */
export type SessionInput = {
  seconds: number;
  note?: string;
  practice?: {
    id: string;
    category: string;
    completed: boolean;
    plannedSeconds: number;
    options?: Record<string, string | number | boolean>;
  };
};

export const useMindfulness = () => {
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const key = queryKeys.mindfulness.list(user?.id);

  const mindfulnessQuery = useQuery({
    queryKey: key,
    enabled: !!user,
    staleTime: STALE.short,
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('mindfulness')
        .select('*')
        .eq('user_id', user.id)
        .order('date_iso', { ascending: false });

      if (error) throw error;

      const items: MindfulEntry[] = (data || []).map((d) => ({
        id: d.id,
        seconds: d.seconds || 0,
        dateISO: d.date_iso || d.created_at,
        note: d.note || undefined,
        practiceId: d.practice_id,
        category: d.category,
        completed: d.completed ?? true,
        plannedSeconds: d.planned_seconds,
      }));

      return items;
    },
  });

  const addMindfulnessMutation = useMutation({
    mutationFn: async ({ seconds, note, practice }: SessionInput) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('mindfulness')
        .insert({
          user_id: user.id,
          seconds,
          note,
          date_iso: new Date().toISOString(),
          ...(practice
            ? {
                practice_id: practice.id,
                category: practice.category,
                completed: practice.completed,
                planned_seconds: practice.plannedSeconds,
                options: (practice.options ?? {}) as Json,
              }
            : {}),
        })
        .select()
        .single();

      if (error) throw error;

      const item: MindfulEntry = {
        id: data.id,
        seconds: data.seconds || 0,
        dateISO: data.date_iso || data.created_at,
        note: data.note || undefined,
      };

      return item;
    },
    onSuccess: (item) => notifyMindfulnessSession(Math.round(item.seconds / 60)),
    onMutate: async ({ seconds, note, practice }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<MindfulEntry[]>(key);

      const optimistic: MindfulEntry = {
        id: `temp-${Date.now()}`,
        seconds,
        dateISO: new Date().toISOString(),
        note,
        practiceId: practice?.id,
        category: practice?.category,
        completed: practice?.completed ?? true,
        plannedSeconds: practice?.plannedSeconds,
      };
      queryClient.setQueryData<MindfulEntry[]>(key, (old) => [optimistic, ...(old || [])]);

      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  return {
    mindfulnessHistory: mindfulnessQuery.data || [],
    isLoading: mindfulnessQuery.isLoading,
    isFetching: mindfulnessQuery.isFetching,
    isError: mindfulnessQuery.isError,
    error: mindfulnessQuery.error,
    addMindfulMinutes: (seconds: number, note?: string) =>
      addMindfulnessMutation.mutateAsync({ seconds, note }),
    addSession: addMindfulnessMutation.mutateAsync,
    isAdding: addMindfulnessMutation.isPending,
  };
};
