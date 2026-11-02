const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const mod = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('lib/glow-score.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
  { module: mod, exports: mod.exports, Date, Math, Array, Map, Set, Number, String, Object, parseInt, parseFloat },
);
const g = mod.exports;
// Friday 30 Oct 2026, 12:00 local.
const now = new Date(2026, 9, 30, 12);
const at = (m, d, h, score) => ({ score, createdAt: new Date(2026, m - 1, d, h).toISOString() });

test('a day keeps its last saved score', () => {
  const days = g.dailyScores([at(10, 29, 9, 70), at(10, 29, 18, 76), at(10, 30, 8, 80)]);
  assert.equal(JSON.stringify(days.map((d) => d.score)), '[80,76]');
});

test('periods are calendar periods', () => {
  assert.equal(g.periodStart('1W', now).getDate(), 26);
  assert.equal(g.periodStart('1M', now, -1).getMonth(), 8);
  assert.equal(g.periodStart('3M', now).getMonth(), 7);
  assert.equal(g.periodStart('1Y', now).getMonth(), 0);
});

test('the summary compares the average with the period before', () => {
  const days = g.dailyScores([at(10, 2, 9, 70), at(10, 20, 9, 82), at(9, 10, 9, 70)]);
  const s = g.periodSummary(days, '1M', now);
  assert.equal(s.average, 76);
  assert.equal(s.best, 82);
  assert.equal(s.lowest, 70);
  assert.equal(s.delta, 6);
  assert.equal(g.periodSummary(days, '1W', now).average, null);
});

test('score colours match the mock values', () => {
  assert.equal(g.scoreColor(95), '#8E7FA6');
  assert.equal(g.scoreColor(81), '#7FC6F1');
  assert.equal(g.scoreColor(72), '#E2CC40');
  assert.equal(g.scoreColor(65), '#6B5279');
  assert.equal(g.scoreRange(80).key, 'normal');
  assert.equal(g.scoreRange(45).key, 'watch');
  assert.equal(g.scoreRange(20).key, 'low');
});

test('the ring knob starts at 12 o\'clock and goes clockwise', () => {
  const top = g.ringPoint(100, 4, 0);
  assert.ok(Math.abs(top.x - 50) < 1e-9 && Math.abs(top.y - 2) < 1e-9);
  const right = g.ringPoint(100, 4, 25);
  assert.ok(Math.abs(right.x - 98) < 1e-9 && Math.abs(right.y - 50) < 1e-9);
});

test('the range bar widens below 50', () => {
  assert.equal(g.rangeDomainMin(58), 50);
  assert.equal(g.rangeDomainMin(42), 37);
  assert.equal(g.rangeX(75, 200, 50), 100);
  assert.equal(g.rangeX(30, 200, 50), 0);
});

test('trend points map min and max into the chart band', () => {
  const pts = g.trendPoints([70, 80], 287);
  assert.equal(pts[0].x, 0);
  assert.equal(pts[1].x, 287);
  assert.ok(Math.abs(pts[0].y - (77.6 - 60 * (2 / 14))) < 1e-9);
  assert.ok(pts[1].y < pts[0].y);
});

test('the mood mix uses four buckets and adds up to 100', () => {
  const mix = g.moodMix(['Great', 'Good', 'Okay', 'Bad', 'Low', 'Good']);
  assert.equal(mix.total, 6);
  assert.equal(mix.shares.good, 50);
  assert.equal(mix.shares.good + mix.shares.okay + mix.shares.low + mix.shares.tense, 100);
  const stops = g.mixStops({ good: 100, okay: 0, low: 0, tense: 0 });
  assert.equal(JSON.stringify(stops.map((s) => s.offset)), '[0,1]');
});

test('factor impacts need two days on each side', () => {
  const days = g.dailyScores([at(10, 26, 9, 80), at(10, 27, 9, 84), at(10, 28, 9, 70), at(10, 29, 9, 72), at(10, 30, 9, 60)]);
  const factors = new Map([
    [g.dayKey(new Date(2026, 9, 26)), new Set(['breathing'])],
    [g.dayKey(new Date(2026, 9, 27)), new Set(['breathing'])],
    [g.dayKey(new Date(2026, 9, 30)), new Set(['shortSleep'])],
  ]);
  const { helps, hurts } = g.factorImpacts(days, factors);
  assert.equal(JSON.stringify(helps), JSON.stringify([{ key: 'breathing', impact: 15 }]));
  assert.equal(hurts.length, 0);
});

test('durations and signs format as designed', () => {
  assert.equal(g.durationMinutes('25 min'), 25);
  assert.equal(g.durationMinutes('1h 30m'), 90);
  assert.equal(g.durationMinutes(null), null);
  assert.equal(g.formatMinutes(30), '30 min');
  assert.equal(g.formatMinutes(90), '1.5 h');
  assert.equal(g.formatMinutes(60), '1 h');
  assert.equal(g.signed(-7), '−7');
  assert.equal(g.signed(8), '+8');
  assert.equal(g.labelKey('Mentally Stable'), 'mentallyStable');
});

test('history groups by week', () => {
  assert.equal(g.historyGroup(new Date(2026, 9, 26), now), 'thisWeek');
  assert.equal(g.historyGroup(new Date(2026, 9, 20), now), 'lastWeek');
  assert.equal(g.historyGroup(new Date(2026, 9, 10), now), 'earlier');
});

test('the plan keeps what is left and what was done today', () => {
  const today = new Date(2026, 9, 30, 9).toISOString();
  const yesterday = new Date(2026, 9, 29, 9).toISOString();
  const items = [
    { category: 'mindfulness', completed: false, completedAt: null, duration: '10 min' },
    { category: 'mindfulness', completed: true, completedAt: today, duration: '15 min' },
    { category: 'social', completed: true, completedAt: yesterday, duration: '1 h' },
    { category: 'physical', completed: false, completedAt: null, duration: '1 hour' },
  ];
  const plan = g.planItems(items, now);
  assert.equal(plan.length, 3);
  const rows = g.planCategories(plan);
  assert.equal(JSON.stringify(rows.map((r) => [r.category, r.pending, r.minutes])), '[["mindfulness",1,25],["physical",1,60]]');
  assert.equal(g.suggestionBonus(10), 5);
  assert.equal(g.suggestionBonus(0), 1);
  assert.equal(g.suggestionBonus(null), 5);
});
