const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const mod = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('lib/moments.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
  { module: mod, exports: mod.exports, Math, Date },
);
const m = mod.exports;

test('the rise scale covers both values in fives and puts higher values higher', () => {
  const s = m.riseScale(80, 88);
  assert.equal(s.lo, 80);
  assert.equal(s.hi, 90);
  assert.ok(s.y(88) < s.y(80));
  assert.equal(s.ticks.filter((t) => t.major).map((t) => t.value).join(','), '90,85,80');
  const d = m.riseScale(70, 62);
  assert.equal(d.lo, 60);
  assert.equal(d.hi, 75);
});

test('constellation days sit six to a row', () => {
  assert.equal(JSON.stringify(m.constellationPoint(1)), '{"x":77.5,"y":236}');
  assert.equal(JSON.stringify(m.constellationPoint(7)), '{"x":77.5,"y":284}');
  assert.equal(m.toBeatLastMonth(19, 20), 2);
  assert.equal(m.toBeatLastMonth(25, 20), 0);
});

test('the calm wave is stable for a seed, stays in its band and settles', () => {
  const a = m.calmWave('2026-11-02', 1, 375);
  const b = m.calmWave('2026-11-02', 1, 375);
  assert.equal(JSON.stringify(a.points), JSON.stringify(b.points));
  assert.ok(a.points.every((p) => p.y >= 36 && p.y <= 128));
  assert.ok(a.peak.x >= 28 && m.calmWave('x', 5, 375).peak.x >= 28);
  const late = a.points.filter((p) => p.x > 260).map((p) => Math.abs(p.y - 82));
  assert.ok(Math.max(...late) <= 12.01);
  const calmer = m.calmWave('2026-11-02', 4, 375).points.filter((p) => p.x < 100).map((p) => Math.abs(p.y - 82));
  const tense = a.points.filter((p) => p.x < 100).map((p) => Math.abs(p.y - 82));
  assert.ok(Math.max(...calmer) < Math.max(...tense));
});

test('the night curve and next reminder time', () => {
  const p = m.smoothPath(m.NIGHT_SAMPLES, 375);
  assert.ok(p.line.startsWith('M0.0,'));
  assert.ok(p.area.endsWith('Z'));
  const now = new Date(2026, 10, 2, 22, 0);
  assert.equal(m.nextAt(21, 0, now).getDate(), 3);
  assert.equal(m.nextAt(23, 0, now).getDate(), 2);
});
