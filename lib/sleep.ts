import { SleepEntry } from './types';

/**
 * @deprecated Use useActivityStore().sleepEntries or useActivityStore().fetchSleepEntries()
 */
export async function listSleepEntries(): Promise<SleepEntry[]> {
  return [];
}

/**
 * @deprecated Use useActivityStore().addSleepEntry()
 */
export async function addSleepEntry(
  input: Omit<SleepEntry, 'id' | 'createdAtISO'> & Partial<Pick<SleepEntry, 'id' | 'createdAtISO'>>,
): Promise<SleepEntry> {
  throw new Error('Deprecated. Use useActivityStore().addSleepEntry() instead.');
}

/**
 * @deprecated Use useActivityStore().deleteSleepEntry()
 */
export async function deleteSleepEntry(id: string): Promise<boolean> {
  throw new Error('Deprecated. Use useActivityStore().deleteSleepEntry() instead.');
}
