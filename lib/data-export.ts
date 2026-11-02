/**
 * "Download my data" (06 §P6, §P14): the account's own rows from each table, as one JSON file.
 * Kept free of app imports so it is unit tested; `lib/data-export-run.ts` fetches and shares it.
 */

/** Tables with the user's own data, and the column that holds their id. */
export const EXPORT_TABLES: { table: string; owner: 'id' | 'user_id' }[] = [
  { table: 'profiles', owner: 'id' },
  { table: 'assessments', owner: 'user_id' },
  { table: 'mood_logs', owner: 'user_id' },
  { table: 'journal_entries', owner: 'user_id' },
  { table: 'sleep', owner: 'user_id' },
  { table: 'mindfulness', owner: 'user_id' },
  { table: 'freud_scores', owner: 'user_id' },
  { table: 'ai_suggestions', owner: 'user_id' },
  { table: 'activity_logs', owner: 'user_id' },
  { table: 'chat_histories', owner: 'user_id' },
  { table: 'glow_ai_summaries', owner: 'user_id' },
  { table: 'stress_histories', owner: 'user_id' },
  { table: 'practice_favourites', owner: 'user_id' },
];

export type TableResult = { rows?: unknown[]; error?: string };

/**
 * The export document. A table that could not be read is listed under `unavailable` instead of
 * failing the whole export, so the person still gets everything else.
 */
export function buildExport(email: string | null, results: Record<string, TableResult>, now: Date) {
  const data: Record<string, unknown[]> = {};
  const unavailable: string[] = [];
  for (const { table } of EXPORT_TABLES) {
    const r = results[table];
    if (!r || r.error) unavailable.push(table);
    else data[table] = r.rows ?? [];
  }
  return {
    app: 'Inner Glow',
    exportedAt: now.toISOString(),
    account: email,
    counts: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length])),
    unavailable,
    data,
  };
}

/** "inner-glow-data-2026-11-02.json". */
export const exportFileName = (now: Date) => `inner-glow-data-${now.toISOString().slice(0, 10)}.json`;
