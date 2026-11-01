const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const mod = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/sleep-stages.ts', 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
  { module: mod, exports: mod.exports, require: () => ({}), Date, Number });
const { summariseStages } = mod.exports;
const at = (s) => `2026-10-${s}:00.000Z`;
const plain = (v) => JSON.parse(JSON.stringify(v));

test('manual nights without stages give no breakdown, so the screens hide it', () => {
  assert.equal(summariseStages([]), null);
  assert.equal(summariseStages([{}, { stages: [] }]), null);
});

test('stage minutes are averaged over the nights that have stages only', () => {
  const summary = summariseStages([
    { stages: [
      { stage: 'light', startISO: at('20T23:00'), endISO: at('21T03:00') },
      { stage: 'deep', startISO: at('21T03:00'), endISO: at('21T04:00') },
      { stage: 'rem', startISO: at('21T04:00'), endISO: at('21T06:00') },
      { stage: 'awake', startISO: at('21T06:00'), endISO: at('21T07:00') },
    ] },
    { stages: [{ stage: 'light', startISO: at('21T23:00'), endISO: at('22T03:00') }] },
    {},
  ]);
  assert.equal(summary.nights, 2);
  assert.deepEqual(plain(summary.avgMinutes), { light: 240, deep: 30, rem: 60, awake: 30 });
  assert.deepEqual(plain(summary.share), { light: 480 / 720, deep: 60 / 720, rem: 120 / 720, awake: 60 / 720 });
});

test('broken stage rows are ignored', () => {
  const summary = summariseStages([{ stages: [
    { stage: 'deep', startISO: 'not a date', endISO: at('21T04:00') },
    { stage: 'rem', startISO: at('21T05:00'), endISO: at('21T04:00') },
    { stage: 'light', startISO: at('21T01:00'), endISO: at('21T02:00') },
  ] }]);
  assert.deepEqual(plain(summary.avgMinutes), { light: 60, deep: 0, rem: 0, awake: 0 });
});
