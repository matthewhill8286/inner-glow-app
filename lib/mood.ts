import { MoodCheckIn } from './types';

/**
 * @deprecated Use useActivityStore().moodCheckIns or useActivityStore().fetchMoodCheckIns()
 */
export async function listMoodCheckIns(): Promise<MoodCheckIn[]> {
  return [];
}

/**
 * @deprecated Use useActivityStore().addMoodCheckIn()
 */
export async function addMoodCheckIn(
  input: Omit<MoodCheckIn, 'id' | 'createdAt'> & Partial<Pick<MoodCheckIn, 'id' | 'createdAt'>>,
): Promise<MoodCheckIn> {
  throw new Error('Deprecated. Use useActivityStore().addMoodCheckIn() instead.');
}

/**
 * @deprecated Use useActivityStore().deleteMoodCheckIn()
 */
export async function deleteMoodCheckIn(id: string): Promise<boolean> {
  throw new Error('Deprecated. Use useActivityStore().deleteMoodCheckIn() instead.');
}
