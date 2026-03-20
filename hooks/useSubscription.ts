import { useEffect, useMemo } from 'react';
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/supabase/supabase';

/* ── Types ──────────────────────────────────────── */

export type SubscriptionPlan = 'trial' | 'monthly' | 'lifetime';
export type SubscriptionStatus =
  | 'pending'
  | 'active'
  | 'past_due'
  | 'canceling'
  | 'canceled'
  | 'expired';

export type Subscription = {
  type: SubscriptionPlan;
  status: SubscriptionStatus;
  expiryDate?: string | null;
  stripeCustomerId?: string | null;
  /** True when checkout was initiated but webhook hasn't confirmed yet */
  pending?: boolean;
};

const STORAGE_KEY = 'auth:subscription:v1';

/* ── Zustand store (single shared instance) ────── */

interface SubscriptionStore {
  subscription: Subscription | null;
  isLoading: boolean;
  /** Deduplication: holds the in-flight promise so concurrent callers share one fetch */
  _inflight: Promise<void> | null;
  load: () => Promise<void>;
  refresh: () => Promise<void>;
}

const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
  subscription: null,
  isLoading: true,
  _inflight: null,

  load: async () => {
    // Deduplicate: if a fetch is already in flight, reuse it
    if (get()._inflight) {
      await get()._inflight;
      return;
    }

    const doFetch = async () => {
      try {
        // 1. Load local cache first for instant UI
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        let local: Subscription | null = null;
        if (raw) {
          try {
            local = JSON.parse(raw);
          } catch {
            local = null;
          }
        }
        if (local) set({ subscription: local });

        // 2. Sync with Supabase (source of truth)
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user?.id) {
          try {
            const { data: dbSub, error: dbErr } = await supabase
              .from('subscriptions')
              .select('plan, status, current_period_end, trial_end, stripe_customer_id')
              .eq('user_id', session.user.id)
              .maybeSingle();

            // Gracefully handle table not existing yet (PGRST205) or other DB errors
            if (dbErr) {
              console.warn('[useSubscription] DB query error (table may not exist yet):', dbErr.code);
            } else if (dbSub) {
              const synced: Subscription = {
                type: dbSub.plan as SubscriptionPlan,
                status: dbSub.status as SubscriptionStatus,
                expiryDate: dbSub.current_period_end || dbSub.trial_end || null,
                stripeCustomerId: dbSub.stripe_customer_id || null,
              };

              // Check if server status upgraded from pending
              if (local?.pending && dbSub.status === 'active') {
                synced.pending = false;
              }

              set({ subscription: synced });
              // Update local cache
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(synced));
            }
          } catch (subErr) {
            console.warn('[useSubscription] subscriptions query failed:', subErr);
          }
        }
      } catch (err) {
        console.warn('[useSubscription] sync error:', err);
      } finally {
        set({ isLoading: false, _inflight: null });
      }
    };

    const promise = doFetch();
    set({ _inflight: promise });
    await promise;
  },

  refresh: async () => {
    set({ isLoading: true, _inflight: null });
    await get().load();
  },
}));

/* ── Public hook (drop-in replacement) ─────────── */

export function useSubscription() {
  const { subscription, isLoading, load, refresh } = useSubscriptionStore();

  // Load once on first mount across the entire app
  useEffect(() => {
    load();
  }, [load]);

  /* ── Derived state ────────────────────────────── */

  return useMemo(() => {
    const isExpired =
      subscription != null &&
      subscription.expiryDate != null &&
      new Date(subscription.expiryDate) < new Date() &&
      subscription.type !== 'lifetime';

    const isLifetime = subscription?.type === 'lifetime' && subscription?.status === 'active';

    const isMonthlyActive =
      subscription?.type === 'monthly' && subscription?.status === 'active' && !isExpired;

    const isTrialActive =
      subscription?.type === 'trial' && subscription?.status === 'active' && !isExpired;

    const isCanceling = subscription?.status === 'canceling';
    const isPastDue = subscription?.status === 'past_due';
    const isPending = subscription?.pending === true;

    // Full access: lifetime, active monthly, or active trial
    const hasFullAccess = !!(isLifetime || isMonthlyActive || isTrialActive);

    // Days remaining in trial (null if not on trial)
    const trialDaysLeft =
      isTrialActive && subscription?.expiryDate
        ? Math.max(0, Math.ceil((new Date(subscription.expiryDate).getTime() - Date.now()) / 86400000))
        : null;

    return {
      subscription,
      isLoading,
      isExpired,
      isLifetime,
      isMonthlyActive,
      isTrialActive,
      isCanceling,
      isPastDue,
      isPending,
      hasFullAccess,
      trialDaysLeft,
      refresh,
    };
  }, [subscription, isLoading, refresh]);
}
