const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const mod = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('lib/mood-month.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
  { module: mod, exports: mod.exports, Date, Math, Array, Map },
);
const m = mod.exports;
// Friday 30 Oct 2026, the design's mock month.
const now = new Date(2026, 9, 30, 12);
const log = (id, d, h, mood) => ({ id, createdAt: new Date(2026, 9, d, h).toISOString(), mood });

test('October 2026 starts on a Thursday and needs five rows', () => {
  const grid = m.monthGrid([], m.monthStart(now), now);
  assert.equal(grid.length, 31);
  assert.equal(grid[0].column, 3);
  assert.equal(grid[0].row, 0);
  assert.equal(grid[30].column, 5);
  assert.equal(m.monthRows(m.monthStart(now)), 5);
  assert.equal(m.monthRows(new Date(2027, 1, 1)), 4);
  assert.equal(m.monthRows(new Date(2026, 1, 1)), 5);
});

test('a day shows its latest check-in, today is marked and later days are future', () => {
  const grid = m.monthGrid([log('a', 29, 8, 'Low'), log('b', 29, 20, 'Good')], m.monthStart(now), now);
  assert.equal(grid[28].log.id, 'b');
  assert.equal(grid[28].score, 4);
  assert.equal(grid[29].today, true);
  assert.equal(grid[29].future, false);
  assert.equal(grid[30].future, true);
  assert.equal(grid[0].score, null);
});

test('the summary counts every check-in in the month and breaks ties upwards', () => {
  const logs = [log('a', 1, 9, 'Good'), log('b', 2, 9, 'Good'), log('c', 3, 9, 'Great'), log('d', 4, 9, 'Great'), log('e', 5, 9, 'Bad')];
  logs.push({ id: 'x', createdAt: new Date(2026, 8, 30).toISOString(), mood: 'Low' });
  const s = m.monthSummary(logs, m.monthStart(now));
  assert.equal(s.total, 5);
  assert.equal(s.mostly, 5);
  assert.equal(JSON.stringify(s.shares.map((x) => x.score)), '[5,4,3,2,1]');
  assert.equal(s.shares[0].share, 0.4);
  assert.equal(m.monthSummary([], m.monthStart(now)).mostly, null);
});

test('mix stops cover the bar from 0 to 1', () => {
  const stops = m.mixStops([{ score: 5, share: 0.5 }, { score: 4, share: 0 }, { score: 3, share: 0.5 }]);
  assert.equal(stops[0].offset, 0);
  assert.equal(stops.at(-1).offset, 1);
  assert.equal(stops.length, 4);
  assert.ok(stops[1].offset < stops[2].offset);
});
