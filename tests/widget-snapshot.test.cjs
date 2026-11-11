const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const mod = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('lib/widget-snapshot.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
  { module: mod, exports: mod.exports, Date, Math },
);
const w = mod.exports;
const DAY = 86_400_000;

test('widget data summarises scores, moods and sleep without raw entries', () => {
  const now = Date.UTC(2026, 10, 11, 12);
  const history = [20, 12, 9, 6, 3, 1].map((d, i) => ({ score: 60 + i, createdAt: new Date(now - d * DAY).toISOString() }));
  const s = w.scoreSummary(history, 70, now);
  assert.deepEqual([...s.series], [60, 61, 62, 63, 64, 65, 70]);
  assert.equal(s.weekDelta, 70 - 62);
  const today = new Date(2026, 10, 11, 9);
  const dots = w.weekMoodDots([{ createdAt: new Date(2026, 10, 11, 8).toISOString(), score: 4 }, { createdAt: new Date(2026, 10, 9, 8).toISOString(), score: 2 }], today);
  assert.deepEqual([...dots], [0, 0, 0, 0, 2, 0, 4]);
  assert.deepEqual([...w.sleepBars([300, 480, 400])], [0.63, 1, 0.83]);
  assert.equal(w.dailyPrompt([], today), undefined);
  assert.equal(typeof w.dailyPrompt(['a', 'b'], today), 'string');
});
