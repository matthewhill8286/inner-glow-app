import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/supabase/supabase';
import { SleepEntry } from '@/lib/types';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from './useUser';
import { queryKeys, STALE } from '@/lib/queryKeys';

export interface SleepModeState {
  sleepModeStartISO: string | null;
  suggestedWakeISO: string | null;
  autoDetectionEnabled: boolean;
}

export interface SleepScheduleState {
  sleepHour: number;
  sleepMin: number;
  wakeHour: number;
  wakeMin: number;
  snoozeCount: number;
  selectedDays: string[];
  autoDisplayStats: boolean;
  autoSetAlarm: boolean;
  bedtimeReminder: boolean;
  /** ISO string of when this schedule was last saved */
  savedAt: string | null;
}

export const DEFAULT_SCHEDULE: SleepScheduleState = {
  sleepHour: 22,
  sleepMin: 0,
  wakeHour: 6,
  wakeMin: 0,
  snoozeCount: 1,
  selectedDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  autoDisplayStats: true,
  autoSetAlarm: false,
  bedtimeReminder: true,
  savedAt: null,
};

const SLEEP_MODE_STORAGE_KEY = 'sleep-mode-storage';
const SLEEP_SCHEDULE_STORAGE_KEY = 'sleep-schedule-storage';

export const useSleep = () => {
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const key = queryKeys.sleep.list(user?.id);

  const [sleepMode, setSleepModeState] = useState<SleepModeState>({
    sleepModeStartISO: null,
    suggestedWakeISO: null,
    autoDetectionEnabled: false,
  });

  const [schedule, setScheduleState] = useState<SleepScheduleState>(DEFAULT_SCHEDULE);

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

    const loadSchedule = async () => {
      try {
        const stored = await AsyncStorage.getItem(SLEEP_SCHEDULE_STORAGE_KEY);
        if (stored) {
          setScheduleState({ ...DEFAULT_SCHEDULE, ...JSON.parse(stored) });
        }
      } catch (e) {
        console.error('Failed to load sleep schedule', e);
      }
    };

    loadSleepMode();
    loadSchedule();
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

  const saveSchedule = async (updates: Partial<SleepScheduleState>) => {
    const nextSchedule = { ...schedule, ...updates, savedAt: new Date().toISOString() };
    setScheduleState(nextSchedule);
    try {
      await AsyncStorage.setItem(SLEEP_SCHEDULE_STORAGE_KEY, JSON.stringify(nextSchedule));
    } catch (e) {
      console.error('Failed to save sleep schedule', e);
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
    schedule,
    isLoading: sleepQuery.isLoading,
    isFetching: sleepQuery.isFetching,
    isError: sleepQuery.isError,
    error: sleepQuery.error,
    addSleepEntry: addSleepMutation.mutateAsync,
    deleteSleepEntry: deleteSleepMutation.mutateAsync,
    setSleepMode,
    saveSchedule,
    isAdding: addSleepMutation.isPending,
    isDeleting: deleteSleepMutation.isPending,
  };
};
