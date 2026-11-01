import type { SleepEntry, SleepStageKind } from './types';

export const STAGE_ORDER: SleepStageKind[] = ['light', 'deep', 'rem', 'awake'];

export type StageSummary = {
  /** Nights that had a stage breakdown. */
  nights: number;
  /** Average minutes per night in each stage, over those nights only. */
  avgMinutes: Record<SleepStageKind, number>;
  /** Share of all staged time in each stage, 0–1. */
  share: Record<SleepStageKind, number>;
};

const zero = (): Record<SleepStageKind, number> => ({ light: 0, deep: 0, rem: 0, awake: 0 });

/**
 * Real stage totals across the given nights. Returns null when none of them has stages,
 * so screens hide the stage UI instead of showing made-up splits (06 §6 item 6).
 */
export function summariseStages(entries: Pick<SleepEntry, 'stages'>[]): StageSummary | null {
  const totals = zero();
  let nights = 0;
  for (const entry of entries) {
    if (!entry.stages?.length) continue;
    nights++;
    for (const s of entry.stages) {
      const minutes = (Date.parse(s.endISO) - Date.parse(s.startISO)) / 60000;
      if (Number.isFinite(minutes) && minutes > 0) totals[s.stage] += minutes;
    }
  }
  const all = STAGE_ORDER.reduce((sum, k) => sum + totals[k], 0);
  if (!nights || all <= 0) return null;

  const avgMinutes = zero();
  const share = zero();
  for (const k of STAGE_ORDER) {
    avgMinutes[k] = totals[k] / nights;
    share[k] = totals[k] / all;
  }
  return { nights, avgMinutes, share };
}
