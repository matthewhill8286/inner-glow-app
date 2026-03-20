import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/supabase/supabase';
import { MoodCheckIn } from '@/lib/types';
import { useUser } from './useUser';
import { queryKeys, STALE } from '@/lib/queryKeys';

export const useMood = () => {
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const key = queryKeys.mood.list(user?.id);

  const moodQuery = useQuery({
    queryKey: key,
    enabled: !!user,
    staleTime: STALE.short,
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('mood_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false });

      if (error) throw error;

      const items: MoodCheckIn[] = (data || []).map((d) => ({
        id: d.id,
        createdAt: d.logged_at,
        mood:
          d.mood_score === 5
            ? 'Great'
            : d.mood_score === 4
              ? 'Good'
              : d.mood_score === 3
                ? 'Okay'
                : d.mood_score === 2
                  ? 'Low'
                  : 'Bad',
        energy: d.energy_score as any,
        stress: d.stress_score as any,
        note: d.note || undefined,
        tags: d.emotions || undefined,
        topicContext: d.topic_context || undefined,
      }));

      return items;
    },
  });

  const addMoodMutation = useMutation({
    mutationFn: async (
      input: Omit<MoodCheckIn, 'id' | 'createdAt'> & Partial<Pick<MoodCheckIn, 'id' | 'createdAt'>>,
    ) => {
      if (!user) throw new Error('Not authenticated');

      const moodScoreMap: Record<string, number> = {
        Great: 5,
        Good: 4,
        Okay: 3,
        Low: 2,
        Bad: 1,
      };

      const { data, error } = await supabase
        .from('mood_logs')
        .insert({
          user_id: user.id,
          mood_score: moodScoreMap[input.mood] || 3,
          energy_score: input.energy,
          stress_score: input.stress,
          note: input.note,
          emotions: input.tags,
          topic_context: input.topicContext || null,
          logged_at: input.createdAt || new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      const item: MoodCheckIn = {
        id: data.id,
        createdAt: data.logged_at,
        mood: input.mood,
        energy: data.energy_score as any,
        stress: data.stress_score as any,
        note: data.note || undefined,
        tags: data.emotions || undefined,
        topicContext: data.topic_context || undefined,
      };

      return item;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<MoodCheckIn[]>(key);

      // Optimistic: prepend a placeholder entry
      const optimistic: MoodCheckIn = {
        id: `temp-${Date.now()}`,
        createdAt: input.createdAt || new Date().toISOString(),
        mood: input.mood,
        energy: input.energy,
        stress: input.stress,
        note: input.note,
        tags: input.tags,
        topicContext: input.topicContext,
      };
      queryClient.setQueryData<MoodCheckIn[]>(key, (old) => [optimistic, ...(old || [])]);

      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  const deleteMoodMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('mood_logs').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<MoodCheckIn[]>(key);
      queryClient.setQueryData<MoodCheckIn[]>(key, (old) =>
        (old || []).filter((m) => m.id !== id),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  return {
    moodCheckIns: moodQuery.data || [],
    isLoading: moodQuery.isLoading,
    isError: moodQuery.isError,
    error: moodQuery.error,
    addMoodCheckIn: addMoodMutation.mutateAsync,
    deleteMoodCheckIn: deleteMoodMutation.mutateAsync,
    isAdding: addMoodMutation.isPending,
    isDeleting: deleteMoodMutation.isPending,
  };
};
