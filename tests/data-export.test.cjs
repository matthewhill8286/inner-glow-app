const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const mod = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('lib/data-export.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
  { module: mod, exports: mod.exports, Object, Date, Array },
);
const d = mod.exports;
const now = new Date(Date.UTC(2026, 10, 2, 9));

test('every table is exported or listed as unavailable', () => {
  const results = { mood_logs: { rows: [{ id: 1 }, { id: 2 }] }, sleep: { error: 'denied' }, journal_entries: { rows: [] } };
  const out = d.buildExport('me@example.com', results, now);
  assert.equal(out.counts.mood_logs, 2);
  assert.equal(out.counts.journal_entries, 0);
  assert.ok(out.unavailable.includes('sleep'));
  assert.ok(out.unavailable.includes('profiles'));
  assert.equal(Object.keys(out.data).length + out.unavailable.length, d.EXPORT_TABLES.length);
  assert.equal(out.exportedAt, '2026-11-02T09:00:00.000Z');
});

test('profiles are matched on id and everything else on user_id', () => {
  assert.equal(d.EXPORT_TABLES.find((t) => t.table === 'profiles').owner, 'id');
  assert.ok(d.EXPORT_TABLES.filter((t) => t.table !== 'profiles').every((t) => t.owner === 'user_id'));
  assert.equal(d.exportFileName(now), 'inner-glow-data-2026-11-02.json');
});
