const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const mod = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('lib/voice-entry.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText,
  { module: mod, exports: mod.exports, Math, Number, String },
);
const v = mod.exports;

test('microphone levels map to the design bar heights', () => {
  assert.equal(v.levelFromDb(-60), 0);
  assert.equal(v.levelFromDb(-90), 0);
  assert.equal(v.levelFromDb(0), 1);
  assert.equal(v.levelFromDb(undefined), 0);
  assert.equal(v.barHeight(0), 6);
  assert.equal(v.barHeight(1), 36);
  assert.equal(v.barHeight(0.5), 21);
});

test('the waveform keeps the latest 40 readings', () => {
  let h = [];
  for (let i = 0; i < 45; i++) h = v.pushLevel(h, i);
  assert.equal(h.length, 40);
  assert.equal(h[0], 5);
  assert.equal(h[39], 44);
});

test('clocks read m:ss and the timer mm:ss', () => {
  assert.equal(v.clockFromMs(42000), '0:42');
  assert.equal(v.clockFromMs(42000, true), '00:42');
  assert.equal(v.clockFromMs(125500, true), '02:05');
});

test('the title is the first sentence, shortened at a word', () => {
  assert.equal(
    v.titleFromTranscript('Today I had a hard time. Then lunch.'),
    'Today I had a hard time',
  );
  const long =
    'Today I had a really hard time concentrating on anything at work because of the noise';
  const title = v.titleFromTranscript(long);
  assert.ok(title.endsWith('…'));
  assert.ok(title.length <= 61);
  assert.ok(!title.includes('  '));
});
