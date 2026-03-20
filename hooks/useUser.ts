import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/supabase/supabase';

const AUTH_USER_KEY = ['auth-user'] as const;

/**
 * Cached auth hook — calls supabase.auth.getUser() once and shares
 * the result across every hook that depends on it.
 *
 * staleTime: 5 min  → won't refetch on re-mount within that window
 * gcTime:   10 min  → keeps the cached user in memory after unmount
 * refetchOnWindowFocus: false → avoids unnecessary calls on app foreground
 */
export const useUser = () => {
  return useQuery({
    queryKey: AUTH_USER_KEY,
    queryFn: async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) throw new Error(error.message);
      return user;
    },
    staleTime: 5 * 60 * 1000,        // 5 minutes
    gcTime: 10 * 60 * 1000,           // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
};

/** Imperatively invalidate the cached user (call on sign-out / sign-in) */
export const useInvalidateUser = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: AUTH_USER_KEY });
};
