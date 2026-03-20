import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/supabase/supabase';
import { SleepEntry } from '@/lib/types';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from './useUser';
import { queryKeys, STALE } from '@/lib/queryKeys';

interface SleepModeState {
  sleepModeStartISO: string | null;
  suggestedWakeISO: string | null;
  autoDetectionEnabled: boolean;
}

const SLEEP_MODE_STORAGE_KEY = 'sleep-mode-storage';

export const useSleep = () => {
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const key = queryKeys.sleep.list(user?.id);

  const [sleepMode, setSleepModeState] = useState<SleepModeState>({
    sleepModeStartISO: null,
    suggestedWakeISO: null,
    autoDetectionEnabled: false,
  });

  useEffect(() => {
    const loadSleepMode = async () => {
      try {
        const stored = await AsyncStorage.getItem(SLEEP_MODE_STORAGE_KEY);
        if (stored) {
          setSleepModeState(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Failed to load sleep mode', e);
      }
    };
    loadSleepMode();
  }, []);

  const setSleepMode = async (mode: Partial<SleepModeState>) => {
    const nextMode = { ...sleepMode, ...mode };
    setSleepModeState(nextMode);
    try {
      await AsyncStorage.setItem(SLEEP_MODE_STORAGE_KEY, JSON.stringify(nextMode));
    } catch (e) {
      console.error('Failed to save sleep mode', e);
    }
  };

  const sleepQuery = useQuery({
    queryKey: key,
    enabled: !!user,
    staleTime: STALE.short,
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('sleep')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const items: SleepEntry[] = (data || []).map((d) => ({
        id: d.id,
        startISO: d.start_iso || '',
        endISO: d.end_iso || '',
        quality: (d.quality as any) || undefined,
        awakenings: d.awakenings || undefined,
        duration: d.duration || undefined,
        notes: d.notes || undefined,
        createdAtISO: d.created_at,
      }));

      return items;
    },
  });

  const addSleepMutation = useMutation({
    mutationFn: async (
      input: Omit<SleepEntry, 'id' | 'createdAtISO'> &
        Partial<Pick<SleepEntry, 'id' | 'createdAtISO'>>,
    ) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('sleep')
        .insert({
          user_id: user.id,
          start_iso: input.startISO,
          end_iso: input.endISO,
          quality: input.quality,
          awakenings: input.awakenings,
          duration: input.duration,
          notes: input.notes,
          created_at: input.createdAtISO || new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      const item: SleepEntry = {
        id: data.id,
        startISO: data.start_iso || '',
        endISO: data.end_iso || '',
        quality: (data.quality as any) || undefined,
        awakenings: data.awakenings || undefined,
        duration: data.duration || undefined,
        notes: data.notes || undefined,
        createdAtISO: data.created_at,
      };

      return item;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<SleepEntry[]>(key);

      const optimistic: SleepEntry = {
        id: `temp-${Date.now()}`,
        startISO: input.startISO,
        endISO: input.endISO,
        quality: input.quality,
        awakenings: input.awakenings,
        duration: input.duration,
        notes: input.notes,
        createdAtISO: input.createdAtISO || new Date().toISOString(),
      };
      queryClient.setQueryData<SleepEntry[]>(key, (old) => [optimistic, ...(old || [])]);

      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  const deleteSleepMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sleep').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<SleepEntry[]>(key);
      queryClient.setQueryData<SleepEntry[]>(key, (old) =>
        (old || []).filter((s) => s.id !== id),
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
    sleepEntries: sleepQuery.data || [],
    sleepMode,
    isLoading: sleepQuery.isLoading,
    isError: sleepQuery.isError,
    error: sleepQuery.error,
    addSleepEntry: addSleepMutation.mutateAsync,
    deleteSleepEntry: deleteSleepMutation.mutateAsync,
    setSleepMode,
    isAdding: addSleepMutation.isPending,
    isDeleting: deleteSleepMutation.isPending,
  };
};
