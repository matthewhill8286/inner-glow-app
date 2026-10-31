import { useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/supabase/supabase';
import { userScopedKey } from '@/lib/storage';
import { recordDiagnostic } from '@/lib/diagnostics';
import configureRevenueCat, { getCustomerInfo } from '@/lib/revenuecat';
import {
  parseSubscriptionCache,
  subscriptionHasAccess,
  subscriptionFromEntitlement,
  type Subscription,
} from '@/lib/subscription-state';

export type { Subscription, SubscriptionPlan, SubscriptionStatus } from '@/lib/subscription-state';
const STORAGE_KEY = 'auth:subscription:v2';
let generation = 0;
let receiptRevision = 0;

interface SubscriptionStore {
  subscription: Subscription | null;
  userId: string | null;
  isLoading: boolean;
  _inflight: Promise<void> | null;
  error: string | null;
  checkedAt: number | null;
  load: () => Promise<void>;
  refresh: () => Promise<void>;
}

const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
  subscription: null,
  userId: null,
  isLoading: true,
  _inflight: null,
  error: null,
  checkedAt: null,
  load: async () => {
    if (get()._inflight) return get()._inflight!;
    const requestGeneration = generation;
    const requestReceipt = receiptRevision;
    const task = (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (requestGeneration !== generation) return;
        const userId = session?.user.id ?? null;
        if (get().userId !== userId) set({ subscription: null, userId });
        if (!userId) return;
        const key = userScopedKey(STORAGE_KEY, userId);
        const raw = await AsyncStorage.getItem(key);
        let cached: Subscription | null = null;
        try {
          cached = parseSubscriptionCache(raw);
        } catch {
          /* discard invalid cache */
        }
        if (requestGeneration !== generation) return;
        if (!get().subscription) set({ subscription: cached });

        const { data, error } = await supabase
          .from('subscriptions')
          .select('plan, status, current_period_end, trial_end, stripe_customer_id, provider')
          .eq('user_id', userId)
          .maybeSingle();
        if (error) recordDiagnostic('billing_refresh', 'BILLING_UNAVAILABLE');
        let subscription: Subscription | null = error
          ? (get().subscription ?? cached)
          : data
            ? {
                type: data.plan as Subscription['type'],
                status: data.status as Subscription['status'],
                expiryDate: data.current_period_end || data.trial_end,
                stripeCustomerId: data.stripe_customer_id,
              }
            : null;

        if (Platform.OS === 'ios') {
          try {
            await configureRevenueCat(userId);
            const info = await getCustomerInfo();
            if (!info) throw new Error('Receipt verification unavailable');
            if (info) {
              const appleSubscription = subscriptionFromEntitlement(
                info.entitlements.active.premium,
              );
              // The native receipt is available immediately after purchase/restore.
              // Never replace it with a delayed or stale RevenueCat webhook row.
              if (appleSubscription) subscription = appleSubscription;
              else if (data?.provider === 'revenuecat') subscription = null;
            }
          } catch (err) {
            if (subscriptionHasAccess(get().subscription)) subscription = get().subscription;
            recordDiagnostic('billing_refresh', 'BILLING_UNAVAILABLE');
            set({ error: 'Unable to verify Apple access. Your current access is preserved.' });
          }
        }
        if (
          requestGeneration !== generation ||
          get().userId !== userId ||
          requestReceipt !== receiptRevision
        )
          return;
        set({
          subscription,
          checkedAt: Date.now(),
          ...(error ? { error: 'Unable to refresh access. Please try again.' } : {}),
        });
        if (subscription)
          await AsyncStorage.setItem(
            key,
            JSON.stringify({ ...subscription, storeVerifiedUntil: undefined }),
          );
        else await AsyncStorage.removeItem(key);
      } catch (err) {
        recordDiagnostic('billing_refresh', 'BILLING_UNAVAILABLE');
        if (requestGeneration === generation)
          set({ error: 'Unable to refresh access. Please try again.' });
      } finally {
        if (requestGeneration === generation) set({ isLoading: false, _inflight: null });
      }
    })();
    set({ _inflight: task });
    return task;
  },
  refresh: async () => {
    if (get()._inflight) await get()._inflight;
    set({ isLoading: true, error: null });
    await get().load();
  },
}));

export function resetSubscription() {
  generation++;
  useSubscriptionStore.setState({
    subscription: null,
    userId: null,
    isLoading: false,
    _inflight: null,
    error: null,
    checkedAt: null,
  });
}

export function refreshSubscription() {
  return useSubscriptionStore.getState().refresh();
}

export function useSubscription() {
  const { subscription, isLoading, load, refresh, error, checkedAt } = useSubscriptionStore();
  useEffect(() => {
    if (!useSubscriptionStore.getState().checkedAt) void load();
  }, [load]);
  return useMemo(() => {
    const hasFullAccess = subscriptionHasAccess(subscription);
    const isExpired =
      !hasFullAccess &&
      (subscription?.status === 'expired' ||
        subscription?.status === 'canceled' ||
        (!!subscription?.expiryDate &&
          Date.parse(subscription.expiryDate) <= Date.now() &&
          subscription.type !== 'lifetime'));
    const isTrialActive = subscription?.type === 'trial' && hasFullAccess;
    return {
      subscription,
      isLoading,
      error,
      checkedAt,
      refresh,
      hasFullAccess,
      isExpired,
      isLifetime: subscription?.type === 'lifetime' && hasFullAccess,
      isMonthlyActive: subscription?.type === 'monthly' && hasFullAccess,
      isTrialActive,
      isCanceling: subscription?.status === 'canceling',
      isPastDue: subscription?.status === 'past_due',
      isPending: subscription?.pending === true || subscription?.status === 'pending',
      trialDaysLeft:
        isTrialActive && subscription?.expiryDate
          ? Math.max(0, Math.ceil((Date.parse(subscription.expiryDate) - Date.now()) / 86400000))
          : null,
    };
  }, [subscription, isLoading, refresh, error, checkedAt]);
}

/** Publish the verified receipt before waiting for webhook/database propagation. */
export async function applyPurchaseInfo(
  info: import('react-native-purchases').CustomerInfo,
  expectedUserId: string,
) {
  const startGeneration = generation;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session || session.user.id !== expectedUserId || startGeneration !== generation)
    return false;
  const store = useSubscriptionStore.getState();
  if (store.userId && store.userId !== session.user.id) return false;
  const subscription = subscriptionFromEntitlement(info.entitlements.active.premium);
  receiptRevision++;
  useSubscriptionStore.setState({
    subscription,
    userId: session.user.id,
    isLoading: false,
    error: null,
    checkedAt: Date.now(),
  });
  return true;
}
