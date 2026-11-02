import { notifyJournalEntry } from '@/lib/notificationStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/supabase/supabase';
import { JournalEntry } from '@/lib/types';
import { useUser } from './useUser';
import { queryKeys, STALE } from '@/lib/queryKeys';
import { removeJournalAudio } from '@/lib/journal-audio';

export const useJournal = () => {
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const key = queryKeys.journal.list(user?.id);

  const journalQuery = useQuery({
    queryKey: key,
    enabled: !!user,
    staleTime: STALE.short,
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('journal_entries')
        .select('*, mood_log:mood_logs(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const items: JournalEntry[] = (data || []).map((d) => ({
        id: d.id,
        createdAt: d.created_at,
        updatedAt: d.created_at,
        title: d.title ?? '',
        tags: d.tags ?? [],
        mood: d.mood ?? d.mood_log?.mood_score.toString() ?? '',
        content: d.body,
        promptId: d.prompt_id,
        topicContext: d.topic_context || undefined,
        isVoiceEntry: d.is_voice_entry ?? false,
        audioUrl: d.audio_url ?? undefined,
        recordingDurationMs: d.recording_duration_ms ?? undefined,
        reflection: d.reflection ?? null,
        reflectionPracticeId: d.reflection_practice_id ?? null,
      }));

      return items;
    },
  });

  const createJournalMutation = useMutation({
    mutationFn: async (
      input: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'> &
        Partial<Pick<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>>,
    ) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          title: input.title || null,
          body: input.content,
          mood: input.mood || null,
          tags: input.tags?.length ? input.tags : null,
          topic_context: input.topicContext || null,
          prompt_id: input.promptId,
          created_at: input.createdAt || new Date().toISOString(),
          is_voice_entry: input.isVoiceEntry ?? false,
          audio_url: input.audioUrl || null,
          recording_duration_ms: input.recordingDurationMs || null,
          mood_log_id: input.moodLogId ?? null,
        })
        .select()
        .single();

      if (error) throw error;

      const entry: JournalEntry = {
        id: data.id,
        createdAt: data.created_at,
        updatedAt: data.created_at,
        title: data.title ?? input.title,
        content: data.body,
        mood: data.mood ?? input.mood,
        tags: data.tags ?? input.tags,
        promptId: data.prompt_id,
        topicContext: data.topic_context || undefined,
        isVoiceEntry: data.is_voice_entry ?? false,
        audioUrl: data.audio_url ?? undefined,
        recordingDurationMs: data.recording_duration_ms ?? undefined,
      };

      return entry;
    },
    onSuccess: (item) => notifyJournalEntry(item.title),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<JournalEntry[]>(key);

      const optimistic: JournalEntry = {
        id: `temp-${Date.now()}`,
        createdAt: input.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        title: input.title || 'Untitled',
        content: input.content,
        mood: input.mood,
        tags: input.tags,
        promptId: input.promptId,
        topicContext: input.topicContext,
        isVoiceEntry: input.isVoiceEntry,
        audioUrl: input.audioUrl,
        recordingDurationMs: input.recordingDurationMs,
      };
      queryClient.setQueryData<JournalEntry[]>(key, (old) => [optimistic, ...(old || [])]);

      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  const upsertJournalMutation = useMutation({
    mutationFn: async (entry: JournalEntry) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('journal_entries')
        .upsert({
          id: entry.id,
          user_id: user.id,
          title: entry.title || null,
          body: entry.content,
          mood: entry.mood || null,
          tags: entry.tags?.length ? entry.tags : null,
          topic_context: entry.topicContext || null,
          prompt_id: entry.promptId,
        })
        .select()
        .single();

      if (error) throw error;

      const item: JournalEntry = {
        id: data.id,
        createdAt: data.created_at,
        updatedAt: data.created_at,
        title: data.title ?? entry.title,
        content: data.body,
        mood: data.mood ?? entry.mood,
        tags: data.tags ?? entry.tags,
        promptId: data.prompt_id,
        topicContext: data.topic_context || undefined,
      };

      return item;
    },
    onMutate: async (entry) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<JournalEntry[]>(key);
      queryClient.setQueryData<JournalEntry[]>(key, (old) =>
        (old || []).map((j) => (j.id === entry.id ? { ...j, ...entry } : j)),
      );
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  /** Change date on the entry options sheet (10 §3.11) moves `created_at`. */
  const changeDateMutation = useMutation({
    mutationFn: async ({ id, createdAt }: { id: string; createdAt: string }) => {
      const { error } = await supabase
        .from('journal_entries')
        .update({ created_at: createdAt })
        .eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, createdAt }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<JournalEntry[]>(key);
      queryClient.setQueryData<JournalEntry[]>(key, (old) =>
        (old || [])
          .map((j) => (j.id === id ? { ...j, createdAt } : j))
          .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
      );
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  /** Voice entry (04 J4): the recording is uploaded after the entry exists, then its path is stored. */
  const attachAudioMutation = useMutation({
    mutationFn: async ({ id, path }: { id: string; path: string }) => {
      const { error } = await supabase
        .from('journal_entries')
        .update({ audio_url: path })
        .eq('id', id);
      if (error) throw error;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  /** Stores the reflection the journal-reflection function returned, without a refetch. */
  const setReflection = (id: string, reflection: string, practiceId: string | null) =>
    queryClient.setQueryData<JournalEntry[]>(key, (old) =>
      (old || []).map((j) =>
        j.id === id ? { ...j, reflection, reflectionPracticeId: practiceId } : j,
      ),
    );

  const deleteJournalMutation = useMutation({
    mutationFn: async (id: string) => {
      const audio = queryClient
        .getQueryData<JournalEntry[]>(key)
        ?.find((j) => j.id === id)?.audioUrl;
      const { error } = await supabase.from('journal_entries').delete().eq('id', id);
      if (error) throw error;
      // The recording goes too; a failure here only leaves a file the account deletion clears.
      await removeJournalAudio(audio).catch(() => undefined);
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<JournalEntry[]>(key);
      queryClient.setQueryData<JournalEntry[]>(key, (old) =>
        (old || []).filter((j) => j.id !== id),
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
    journalEntries: journalQuery.data || [],
    isLoading: journalQuery.isLoading,
    isFetching: journalQuery.isFetching,
    isError: journalQuery.isError,
    error: journalQuery.error,
    createJournalEntry: createJournalMutation.mutateAsync,
    upsertJournalEntry: upsertJournalMutation.mutateAsync,
    deleteJournalEntry: deleteJournalMutation.mutateAsync,
    attachJournalAudio: attachAudioMutation.mutateAsync,
    setReflection,
    changeJournalDate: changeDateMutation.mutateAsync,
    isCreating: createJournalMutation.isPending,
    isUpserting: upsertJournalMutation.isPending,
    isDeleting: deleteJournalMutation.isPending,
  };
};
