import { JournalEntry } from './types';

/**
 * @deprecated Use useActivityStore().journalEntries or useActivityStore().fetchJournalEntries()
 */
export async function listJournalEntries(): Promise<JournalEntry[]> {
  return [];
}

/**
 * @deprecated Use useActivityStore().journalEntries.find()
 */
export async function getJournalEntry(id: string): Promise<JournalEntry | null> {
  return null;
}

/**
 * @deprecated Use useActivityStore().createJournalEntry()
 */
export async function createJournalEntry(
  input: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'> &
    Partial<Pick<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<JournalEntry> {
  throw new Error('Deprecated. Use useActivityStore().createJournalEntry() instead.');
}

/**
 * @deprecated Use useActivityStore().upsertJournalEntry()
 */
export async function upsertJournalEntry(input: JournalEntry): Promise<JournalEntry> {
  throw new Error('Deprecated. Use useActivityStore().upsertJournalEntry() instead.');
}

/**
 * @deprecated Use useActivityStore().deleteJournalEntry()
 */
export async function deleteJournalEntry(id: string): Promise<boolean> {
  throw new Error('Deprecated. Use useActivityStore().deleteJournalEntry() instead.');
}
