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
export function buildExport(
  email: string | null,
  results: Record<string, TableResult>,
  now: Date,
  tables: { table: string }[] = EXPORT_TABLES,
) {
  const data: Record<string, unknown[]> = {};
  const unavailable: string[] = [];
  for (const { table } of tables) {
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
export const exportFileName = (now: Date) =>
  `inner-glow-data-${now.toISOString().slice(0, 10)}.json`;

/** "Get a copy of your data" (`6801:6640`): what the person can choose to include. */
export const EXPORT_GROUPS = ['mood', 'journal', 'chats', 'sleep', 'practices'] as const;
export type ExportGroup = (typeof EXPORT_GROUPS)[number];
const GROUP_TABLES: Record<ExportGroup, string[]> = {
  mood: ['mood_logs', 'stress_histories', 'freud_scores'],
  journal: ['journal_entries'],
  chats: ['chat_histories', 'glow_ai_summaries'],
  sleep: ['sleep'],
  practices: ['mindfulness', 'practice_favourites', 'activity_logs', 'ai_suggestions'],
};
/** The profile and assessment always come along: they explain everything else. */
const ALWAYS = ['profiles', 'assessments'];

export function tablesFor(groups: readonly ExportGroup[]): typeof EXPORT_TABLES {
  const wanted = new Set([...ALWAYS, ...groups.flatMap((g) => GROUP_TABLES[g])]);
  return EXPORT_TABLES.filter((t) => wanted.has(t.table));
}

const esc = (v: unknown) =>
  String(v ?? '').replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string,
  );

/** A readable summary for the PDF: the counts per section and the most recent entries' dates. */
export function summaryHtml(
  doc: ReturnType<typeof buildExport>,
  labels: Record<string, string>,
): string {
  const rows = Object.entries(doc.counts)
    .map(
      ([table, n]) =>
        `<tr><td>${esc(labels[table] ?? table)}</td><td style="text-align:right">${n}</td></tr>`,
    )
    .join('');
  return `<html><head><meta charset="utf-8"><style>
    body{font-family:-apple-system,Helvetica,sans-serif;color:#241A2E;padding:32px}
    h1{font-size:24px;margin:0 0 4px} p{color:#736B66;margin:0 0 20px}
    table{width:100%;border-collapse:collapse} td{padding:10px 0;border-bottom:1px solid #E6E0EA}
  </style></head><body>
    <h1>${esc(labels.title ?? 'Inner Glow data')}</h1>
    <p>${esc(doc.account ?? '')} · ${esc(doc.exportedAt.slice(0, 10))}</p>
    <table>${rows}</table>
    <p style="margin-top:24px">${esc(labels.note ?? '')}</p>
  </body></html>`;
}
