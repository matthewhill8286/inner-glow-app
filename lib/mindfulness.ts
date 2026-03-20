import { MindfulEntry } from './types';

/**
 * @deprecated Use useActivityStore().mindfulnessHistory or useActivityStore().fetchMindfulnessHistory()
 */
export async function listMindfulnessHistory(): Promise<MindfulEntry[]> {
  return [];
}

/**
 * @deprecated Use useActivityStore().addMindfulMinutes()
 */
export async function addMindfulMinutes(seconds: number, note?: string): Promise<MindfulEntry> {
  throw new Error('Deprecated. Use useActivityStore().addMindfulMinutes() instead.');
}
