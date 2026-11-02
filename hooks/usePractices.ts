import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/supabase/supabase';
import { useUser } from '@/hooks/useUser';
import { useProfile } from '@/hooks/useProfile';
import { useMindfulness } from '@/hooks/useMindfulness';
import { DEFAULT_GOAL, minutesTodayAndYesterday, nextNudge } from '@/lib/practices';
import { goalNudgeEnabled, setGoalNudge } from '@/lib/notifications';

const favouritesKey = (userId?: string) => ['practiceFavourites', userId] as const;

/** Favourite practices, most recent first (10 §3.5–3.6). */
export function useFavourites() {
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const key = favouritesKey(user?.id);
  const query = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('practice_favourites')
        .select('practice_id, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => r.practice_id);
    },
  });
  const toggle = useMutation({
    mutationFn: async ({ id, on }: { id: string; on: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = on
        ? await supabase.from('practice_favourites').insert({ user_id: user.id, practice_id: id })
        : await supabase
            .from('practice_favourites')
            .delete()
            .eq('user_id', user.id)
            .eq('practice_id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, on }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<string[]>(key);
      queryClient.setQueryData<string[]>(key, (old = []) =>
        on ? [id, ...old.filter((x) => x !== id)] : old.filter((x) => x !== id),
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => ctx?.previous && queryClient.setQueryData(key, ctx.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
  const ids = query.data ?? [];
  return {
    ids,
    isFavourite: (id: string) => ids.includes(id),
    setFavourite: (id: string, on: boolean) => toggle.mutateAsync({ id, on }),
  };
}

/** Today's minutes against the daily goal, and a refresh for the goal nudge after a session. */
export function useDailyGoal() {
  const { t } = useTranslation();
  const { profile, updateProfile } = useProfile({ lazy: true });
  const { mindfulnessHistory } = useMindfulness();
  const goal = profile?.mindfulGoalMinutes ?? DEFAULT_GOAL;
  const { today, yesterday } = minutesTodayAndYesterday(mindfulnessHistory);
  const refreshNudge = useCallback(
    async (todayMinutes = today, goalMinutes = goal, enabled?: boolean) => {
      const on = enabled ?? (await goalNudgeEnabled());
      await setGoalNudge(on, nextNudge(todayMinutes, goalMinutes), {
        title: t('practices.goal.nudgeTitle'),
        body: t('practices.goal.nudgeBody', { minutes: goalMinutes }),
      });
    },
    [today, goal, t],
  );
  return {
    goal,
    today,
    yesterday,
    setGoal: (minutes: number) => updateProfile({ mindfulGoalMinutes: minutes }),
    refreshNudge,
  };
}
