import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useSubscription } from '@/hooks/useSubscription';
import { useUser } from '@/hooks/useUser';

const key = (userId: string) => `pro:had-access:v1:${userId}`;

/**
 * Pro has ended (`6809:7083`) shows once. While Pro or the trial is active the app remembers it,
 * and the first time Home sees that access has expired it opens the screen and forgets the mark.
 */
export function useProEnded() {
  const { data: user } = useUser();
  const { hasFullAccess, isExpired, isLoading } = useSubscription();
  const userId = user?.id;
  useEffect(() => {
    if (!userId || isLoading) return;
    if (hasFullAccess) {
      void AsyncStorage.setItem(key(userId), '1').catch(() => undefined);
      return;
    }
    if (!isExpired) return;
    void (async () => {
      if ((await AsyncStorage.getItem(key(userId)).catch(() => null)) !== '1') return;
      await AsyncStorage.removeItem(key(userId)).catch(() => undefined);
      router.push('/(utils)/pro-ended');
    })();
  }, [userId, hasFullAccess, isExpired, isLoading]);
}
