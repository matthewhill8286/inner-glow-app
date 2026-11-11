const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const mod = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('lib/trial.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
  { module: mod, exports: mod.exports, Date, Math, Number },
);
const { trialEndsIn } = mod.exports;
const now = new Date(2026, 10, 11, 9, 0);

test('the trial card shows only on the last day', () => {
  assert.equal(trialEndsIn(new Date(2026, 10, 11, 22, 0).toISOString(), now), 'today');
  assert.equal(trialEndsIn(new Date(2026, 10, 12, 8, 0).toISOString(), now), 'tomorrow');
  assert.equal(trialEndsIn(new Date(2026, 10, 13, 8, 0).toISOString(), now), null);
  assert.equal(trialEndsIn(new Date(2026, 10, 11, 8, 0).toISOString(), now), null);
  assert.equal(trialEndsIn(null, now), null);
  assert.equal(trialEndsIn('not a date', now), null);
});
