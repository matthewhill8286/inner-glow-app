import { useCallback } from 'react';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/supabase/supabase';
import { useSubscription } from '@/hooks/useSubscription';
import { useUser } from '@/hooks/useUser';
import { queryKeys, STALE } from '@/lib/queryKeys';
import { showAlert } from '@/lib/state';
import { FREE_TALKS_PER_WEEK, usageWeekStart } from '@/lib/talks';

/** Free plan talks used this week (UTC Monday start, as in `claim_glow_ai_chat`). Null for Premium or until loaded. */
export function useGlowAiUsage() {
  const { data: user } = useUser();
  const { hasFullAccess, isLoading: accessLoading } = useSubscription();
  const query = useQuery({
    queryKey: queryKeys.chat.usage(user?.id),
    enabled: !!user && !accessLoading && !hasFullAccess,
    staleTime: STALE.short,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('glow_ai_usage')
        .select('chat_key', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('week_start', usageWeekStart());
      if (error) throw error;
      return count ?? 0;
    },
  });
  if (hasFullAccess || accessLoading)
    return { used: null, limit: FREE_TALKS_PER_WEEK, left: null, refresh: query.refetch };
  // Unknown until loaded: the gate then lets the talk start and the chat function decides.
  const used = query.data ?? null;
  return {
    used,
    limit: FREE_TALKS_PER_WEEK,
    left: used === null ? null : Math.max(0, FREE_TALKS_PER_WEEK - used),
    refresh: query.refetch,
  };
}

/**
 * Starting a talk (05 §3.1, §3.6). Premium users go straight in. Free users go in while they have
 * talks left this week, and otherwise see the Free limit screen. The chat function enforces the same
 * limit. Returns `canStartTalk()`, which is false when the action must stop.
 */
export function useGlowAiGate() {
  const { hasFullAccess, isLoading, error, refresh } = useSubscription();
  const { left } = useGlowAiUsage();
  const canStartTalk = useCallback((): boolean => {
    if (hasFullAccess) return true;
    if (isLoading || error) {
      showAlert(
        'Check your access',
        isLoading
          ? 'Your access is being checked. Please try again in a moment.'
          : 'We could not verify your access. Refresh it or restore your Apple purchase in Profile.',
        [
          { text: 'Close', style: 'cancel' },
          { text: 'Refresh access', onPress: () => void refresh() },
          { text: 'Restore purchases', onPress: () => router.navigate('/(tabs)/profile') },
        ],
      );
      return false;
    }
    if (left === 0) {
      router.push('/(tabs)/chat/free-limit');
      return false;
    }
    return true;
  }, [hasFullAccess, isLoading, error, refresh, left]);
  return { canStartTalk, hasFullAccess };
}
