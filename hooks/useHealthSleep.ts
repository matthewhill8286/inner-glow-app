import { useEffect } from 'react';
import { AppState } from 'react-native';
import { create } from 'zustand';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { supabase } from '@/supabase/supabase';
import { queryKeys } from '@/lib/queryKeys';
import { useUser } from './useUser';
import {
  IMPORT_DAYS,
  healthProvider,
  isHealthAvailable,
  loadHealthConnection,
  planImport,
  readSleepSamples,
  requestSleepAccess,
  saveHealthConnection,
  type HealthConnection,
} from '@/lib/health-sleep';

const DAY_MS = 24 * 60 * 60 * 1000;

export type ConnectResult = { status: 'ok' | 'unavailable' | 'denied' | 'error'; imported: number };
/** Foreground syncs closer together than this are skipped. */
const MIN_SYNC_GAP_MS = 15 * 60 * 1000;

type HealthSleepState = HealthConnection & {
  loaded: boolean;
  available: boolean;
  syncing: boolean;
  lastImported: number | null;
  error: string | null;
};

const useHealthSleepStore = create<HealthSleepState>(() => ({
  connected: false,
  lastSyncISO: null,
  loaded: false,
  available: false,
  syncing: false,
  lastImported: null,
  error: null,
}));

let loading: Promise<void> | null = null;
function ensureLoaded() {
  loading ??= Promise.all([loadHealthConnection(), isHealthAvailable()]).then(([connection, available]) => {
    useHealthSleepStore.setState({ ...connection, available, loaded: true });
  });
  return loading;
}

async function persist(patch: Partial<HealthConnection>) {
  const { connected, lastSyncISO } = { ...useHealthSleepStore.getState(), ...patch };
  useHealthSleepStore.setState(patch);
  await saveHealthConnection({ connected, lastSyncISO });
}

/** Reads the last 30 nights, drops ones already saved and inserts the rest. Returns the number imported. */
async function syncSleep(userId: string, queryClient: QueryClient): Promise<number> {
  const state = useHealthSleepStore.getState();
  if (state.syncing || !state.connected) return 0;
  useHealthSleepStore.setState({ syncing: true, error: null });
  try {
    const now = Date.now();
    const since = now - (IMPORT_DAYS + 1) * DAY_MS;
    const samples = await readSleepSamples(since, now);

    const { data: existing, error: readError } = await supabase
      .from('sleep')
      .select('start_iso, end_iso')
      .eq('user_id', userId)
      .gte('end_iso', new Date(since - DAY_MS).toISOString());
    if (readError) throw readError;

    const toSave = planImport(
      samples,
      (existing ?? []).map((e) => ({ startISO: e.start_iso ?? '', endISO: e.end_iso ?? '' })),
      now,
    );
    if (toSave.length) {
      const { error } = await supabase.from('sleep').insert(
        toSave.map((e) => ({
          user_id: userId,
          start_iso: e.startISO,
          end_iso: e.endISO,
          // `sleep.duration` is an integer column read as hours; start/end keep the exact span.
          duration: e.duration == null ? null : Math.round(e.duration),
          awakenings: e.awakenings ?? null,
          created_at: e.endISO,
        })),
      );
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: queryKeys.sleep.all });
    }
    await persist({ lastSyncISO: new Date().toISOString() });
    useHealthSleepStore.setState({ lastImported: toSave.length });
    return toSave.length;
  } catch (e: any) {
    console.warn('[health-sleep] sync failed', e);
    useHealthSleepStore.setState({ error: e?.message ?? String(e) });
    return 0;
  } finally {
    useHealthSleepStore.setState({ syncing: false });
  }
}

/** Connection state and actions for the Sleep empty state and Connected apps screen. */
export function useHealthSleep() {
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const state = useHealthSleepStore();

  useEffect(() => {
    void ensureLoaded();
  }, []);

  /**
   * Shows the permission sheet, then imports. Screens keep rendering while this
   * runs and read `syncing` for progress.
   */
  const connect = async (): Promise<ConnectResult> => {
    await ensureLoaded();
    if (!useHealthSleepStore.getState().available) return { status: 'unavailable', imported: 0 };
    try {
      if (!(await requestSleepAccess())) return { status: 'denied', imported: 0 };
    } catch (e) {
      console.warn('[health-sleep] permission request failed', e);
      return { status: 'denied', imported: 0 };
    }
    await persist({ connected: true });
    if (!user) return { status: 'ok', imported: 0 };
    const imported = await syncSleep(user.id, queryClient);
    return { status: useHealthSleepStore.getState().error ? 'error' : 'ok', imported };
  };

  /** Stops importing. Entries already saved stay; the system permission is managed in Health settings. */
  const disconnect = async () => {
    await persist({ connected: false, lastSyncISO: null });
  };

  const syncNow = async (): Promise<ConnectResult> => {
    if (!user) return { status: 'ok', imported: 0 };
    const imported = await syncSleep(user.id, queryClient);
    return { status: useHealthSleepStore.getState().error ? 'error' : 'ok', imported };
  };

  return { ...state, provider: healthProvider(), connect, disconnect, syncNow };
}

/** Mounted once in the tabs layout: imports on launch and whenever the app returns to the foreground. */
export function useHealthSleepAutoSync() {
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const userId = user?.id;

  useEffect(() => {
    if (!userId || !healthProvider()) return;
    const run = async () => {
      await ensureLoaded();
      const { connected, lastSyncISO } = useHealthSleepStore.getState();
      if (!connected) return;
      if (lastSyncISO && Date.now() - Date.parse(lastSyncISO) < MIN_SYNC_GAP_MS) return;
      void syncSleep(userId, queryClient);
    };
    void run();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void run();
    });
    return () => sub.remove();
  }, [userId, queryClient]);
}
