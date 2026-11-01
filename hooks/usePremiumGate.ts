import { useCallback } from 'react';
import { router } from 'expo-router';
import { useSubscription } from '@/hooks/useSubscription';
import { showAlert } from '@/lib/state';

/**
 * Glow AI is a Premium feature. Returns `requirePremium()`, which shows the access or upgrade alert
 * and returns true when the action must stop. (Moved from the old Glow AI home so the new home and
 * the new-chat screen share it; the design's free tier with a weekly quota is not decided yet.)
 */
export function usePremiumGate() {
  const { hasFullAccess, isLoading, error, refresh } = useSubscription();
  const requirePremium = useCallback((): boolean => {
    if (hasFullAccess) return false;
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
      return true;
    }
    showAlert('Trial or premium access', 'Start your free trial, choose a plan, or restore an existing purchase.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Upgrade', onPress: () => router.push('/(utils)/trial-upgrade') },
    ]);
    return true;
  }, [hasFullAccess, isLoading, error, refresh]);
  return { requirePremium, hasFullAccess };
}
