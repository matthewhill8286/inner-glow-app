import { AppState, AppStateStatus } from 'react-native';

/**
 * Heuristic wake detection (Option A).
 *
 * When the app becomes active after being sent to the background, if the user previously started
 * sleep mode and the elapsed time looks like a real sleep session, we set a suggested
 * wake time ("now").
 */
export function setupWakeDetection(params: {
  getSleepStartISO: () => string | null | undefined;
  setSuggestedWake: (wakeISO: string) => void;
  minHours?: number;
  maxHours?: number;
}) {
  const { getSleepStartISO, setSuggestedWake, minHours = 3, maxHours = 14 } = params;

  let current: AppStateStatus = AppState.currentState;

  const sub = AppState.addEventListener('change', (next) => {
    const becameActive = current.match(/inactive|background/) && next === 'active';
    current = next;

    if (!becameActive) return;

    const startISO = getSleepStartISO();
    if (!startISO) return;

    const startMs = new Date(startISO).getTime();
    const nowMs = Date.now();
    const hours = (nowMs - startMs) / (1000 * 60 * 60);

    if (hours >= minHours && hours <= maxHours) {
      setSuggestedWake(new Date(nowMs).toISOString());
    }
  });

  return () => sub.remove();
}
