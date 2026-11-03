const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const mod = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('lib/score-range-labels.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  { module: mod, exports: mod.exports },
);
const { scoreRangeLabels } = mod.exports;
test('equal and neighbouring scores never share overlapping label space', () => {
  for (const positions of [
    [79, 80, 81],
    [100, 100, 100],
    [0, 1, 2],
    [198, 199, 200],
  ]) {
    const labels = scoreRangeLabels(positions, 200);
    for (let i = 0; i < labels.length; i++) {
      assert.ok(labels[i].x >= 12 && labels[i].x <= 188);
      for (let j = i + 1; j < labels.length; j++) {
        assert.ok(labels[i].y !== labels[j].y || Math.abs(labels[i].x - labels[j].x) >= 28);
      }
    }
  }
});
test('well separated scores stay on one row', () => {
  assert.equal(new Set(scoreRangeLabels([0, 100, 200], 200).map((label) => label.y)).size, 1);
});
