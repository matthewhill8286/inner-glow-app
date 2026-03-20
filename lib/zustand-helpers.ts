import { StateCreator } from 'zustand/vanilla';
import { create } from 'zustand';

// Lightweight helpers to standardize Zustand usage across the app
// - Slice pattern: define small focused slices + compose in a single store
// - Selector hooks: prefer component-level selectors to avoid re-renders
// - Vanilla store option for non-React modules (e.g., background services)

export type SliceCreator<T, S extends object = object> = StateCreator<T & S, [], [], T>;

// Compose multiple slices into a single store shape
export function composeSlices<Slices extends Record<string, any>>(
  ...slices: StateCreator<Slices, [], []>[]
) {
  return create<Slices>()((...args) => Object.assign({}, ...slices.map((s) => s(...args))));
}

// Convenience selector factory: const useX = selectBy((s) => s.x)
export const selectBy =
  <T>() =>
  <U>(fn: (s: T) => U) =>
    fn;

// Example slice creators (usage patterns):
//
// type AlertState = { alert: Alert; setAlert: (a: Alert) => void };
// const createAlertSlice: SliceCreator<AlertState> = (set) => ({
//   alert: DEFAULT_ALERT,
//   setAlert: (a) => set({ alert: a }),
// });
//
// type AuthState = { token: string | null; setToken: (t: string | null) => void };
// const createAuthSlice: SliceCreator<AuthState> = (set) => ({
//   token: null,
//   setToken: (t) => set({ token: t }),
// });
//
// export const useAppStore = composeSlices<AlertState & AuthState>(
//   createAlertSlice as any,
//   createAuthSlice as any,
// );
//
// // In components:
// // const token = useAppStore((s) => s.token);
// // const setToken = useAppStore((s) => s.setToken);
