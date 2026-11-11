const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const mod = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('lib/narration.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
  { module: mod, exports: mod.exports, Math },
);
const n = mod.exports;
const cues = [
  { at: 0, seconds: 8, file: 1 },
  { at: 90, seconds: 6, file: 2 },
  { at: 580, seconds: 5, file: 3 },
  { at: 'end', seconds: 4, file: 4 },
  { phase: 'inhale', seconds: 2, file: 5 },
];

test('the welcome plays as the session opens and each line plays once', () => {
  assert.equal(n.dueCue(cues, -1, 0, 600).file, 1);
  assert.equal(n.dueCue(cues, 0, 0.5, 600), undefined);
  assert.equal(n.dueCue(cues, 89.9, 90.1, 600).file, 2);
});

test('the closing line plays 30 seconds before the end', () => {
  assert.equal(n.cueStart(cues[3], 600), 570);
  assert.equal(n.dueCue(cues, 569.9, 570.1, 600).file, 4);
});

test('a line that would run into the closing line is skipped', () => {
  assert.equal(n.dueCue(cues, 579.9, 580.1, 600), undefined);
  assert.equal(n.dueCue(cues, 579.9, 580.1, 1200).file, 3);
});

test('breath cues stop at the second timed line', () => {
  assert.equal(n.breathCuesUntil(cues, 600), 90);
  assert.equal(n.breathCue(cues, 'inhale', 20, 600).file, 5);
  assert.equal(n.breathCue(cues, 'inhale', 95, 600), undefined);
  assert.equal(n.breathCue(cues, 'exhale', 20, 600), undefined);
});

test('Greek devices get the Greek recordings', () => {
  assert.equal(n.narrationLanguage('el-GR'), 'el');
  assert.equal(n.narrationLanguage('en'), 'en');
  assert.equal(n.narrationLanguage(undefined), 'en');
});

test('every sleep practice has the same cues in English and Greek', () => {
  const s = JSON.parse(fs.readFileSync('data/narration-scripts.json', 'utf8'));
  for (const id of Object.keys(s.en)) {
    assert.deepEqual(s.el[id].map((c) => c.at ?? c.phase), s.en[id].map((c) => c.at ?? c.phase), id);
  }
});
