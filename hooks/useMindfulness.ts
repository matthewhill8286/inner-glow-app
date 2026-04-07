import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/supabase/supabase';
import { MindfulEntry } from '@/lib/types';
import { useUser } from './useUser';
import { queryKeys, STALE } from '@/lib/queryKeys';

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
      }));

      return items;
    },
  });

  const addMindfulnessMutation = useMutation({
    mutationFn: async ({ seconds, note }: { seconds: number; note?: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('mindfulness')
        .insert({
          user_id: user.id,
          seconds,
          note,
          date_iso: new Date().toISOString(),
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
    onMutate: async ({ seconds, note }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<MindfulEntry[]>(key);

      const optimistic: MindfulEntry = {
        id: `temp-${Date.now()}`,
        seconds,
        dateISO: new Date().toISOString(),
        note,
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
    isAdding: addMindfulnessMutation.isPending,
  };
};
