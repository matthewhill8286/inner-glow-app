import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/supabase/supabase';
import { StressKit, StressCompletion, DEFAULT_KIT } from '@/lib/types';
import { useUser } from './useUser';
import { queryKeys, STALE } from '@/lib/queryKeys';

export const useStress = (opts?: { lazy?: boolean }) => {
  const lazy = opts?.lazy ?? false;
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const kitKey = queryKeys.stress.kit(user?.id);
  const historyKey = queryKeys.stress.history(user?.id);

  const stressKitQuery = useQuery({
    queryKey: kitKey,
    enabled: !!user,
    staleTime: STALE.long,
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('stress_kits')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const kit: StressKit = {
          quickPhrase: data.quick_phrase || undefined,
          triggers: (data.triggers as string[]) || [],
          helpfulActions: (data.helpful_actions as string[]) || [],
          people: (data.people as string[]) || [],
          notes: data.notes || undefined,
          level: data.level || undefined,
          lastCheckIn: data.last_check_in || undefined,
        };
        return kit;
      }
      return DEFAULT_KIT;
    },
  });

  const stressHistoryQuery = useQuery({
    queryKey: historyKey,
    enabled: !!user && !lazy,
    staleTime: STALE.short,
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('stress_histories')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      const items: StressCompletion[] = (data || []).map((d) => ({
        id: d.id,
        exerciseId: d.exercise_id || '',
        title: d.title || '',
        date: d.date || d.created_at,
      }));

      return items;
    },
  });

  const saveStressKitMutation = useMutation({
    mutationFn: async (kit: StressKit) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('stress_kits')
        .upsert({
          user_id: user.id,
          quick_phrase: kit.quickPhrase,
          triggers: kit.triggers,
          helpful_actions: kit.helpfulActions,
          people: kit.people,
          notes: kit.notes,
          level: kit.level,
          last_check_in: kit.lastCheckIn,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      const updated: StressKit = {
        quickPhrase: data.quick_phrase || undefined,
        triggers: (data.triggers as string[]) || [],
        helpfulActions: (data.helpful_actions as string[]) || [],
        people: (data.people as string[]) || [],
        notes: data.notes || undefined,
        level: data.level || undefined,
        lastCheckIn: data.last_check_in || undefined,
      };

      return updated;
    },
    onMutate: async (kit) => {
      await queryClient.cancelQueries({ queryKey: kitKey });
      const previous = queryClient.getQueryData<StressKit>(kitKey);
      queryClient.setQueryData<StressKit>(kitKey, kit);
      return { previous };
    },
    onError: (_err, _kit, context) => {
      if (context?.previous) queryClient.setQueryData(kitKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: kitKey });
    },
  });

  const addStressCompletionMutation = useMutation({
    mutationFn: async ({ exerciseId, title }: { exerciseId: string; title: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('stress_histories')
        .insert({
          user_id: user.id,
          exercise_id: exerciseId,
          title: title,
          date: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      const item: StressCompletion = {
        id: data.id,
        exerciseId: data.exercise_id || '',
        title: data.title || '',
        date: data.date || data.created_at,
      };

      return item;
    },
    onMutate: async ({ exerciseId, title }) => {
      await queryClient.cancelQueries({ queryKey: historyKey });
      const previous = queryClient.getQueryData<StressCompletion[]>(historyKey);

      const optimistic: StressCompletion = {
        id: `temp-${Date.now()}`,
        exerciseId,
        title,
        date: new Date().toISOString(),
      };
      queryClient.setQueryData<StressCompletion[]>(historyKey, (old) => [
        optimistic,
        ...(old || []),
      ]);

      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) queryClient.setQueryData(historyKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: historyKey });
    },
  });

  return {
    stressKit: stressKitQuery.data || null,
    stressHistory: stressHistoryQuery.data || [],
    isLoading: stressKitQuery.isLoading || (!lazy && stressHistoryQuery.isLoading),
    isError: stressKitQuery.isError || stressHistoryQuery.isError,
    error: stressKitQuery.error || stressHistoryQuery.error,
    saveStressKit: saveStressKitMutation.mutateAsync,
    addStressCompletion: (exerciseId: string, title: string) =>
      addStressCompletionMutation.mutateAsync({ exerciseId, title }),
    isSavingKit: saveStressKitMutation.isPending,
    isAddingHistory: addStressCompletionMutation.isPending,
  };
};
