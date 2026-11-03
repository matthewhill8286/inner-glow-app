const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const mod = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('lib/voice-ask.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText,
  { module: mod, exports: mod.exports },
);
const { LISTEN_START, listenStep, askStopReason, cleanTranscript, heardSpeech, SILENCE_MS, MAX_ASK_MS } = mod.exports;

const run = (readings) => readings.reduce((s, [level, at]) => listenStep(s, level, at), LISTEN_START);

test('a pause after speaking ends the question', () => {
  const s = run([[0.6, 500], [0.7, 700], [0.7, 900], [0.1, 1000]]);
  assert.equal(askStopReason(s, 1000 + SILENCE_MS - 1), null);
  assert.equal(askStopReason(s, 1000 + SILENCE_MS), 'silence');
});

test('silence before any speech never cuts the person off', () => {
  const s = run([[0.05, 100], [0.08, 3000], [0.1, 8000]]);
  assert.equal(askStopReason(s, 8000), null);
  assert.equal(askStopReason(s, MAX_ASK_MS), 'limit');
});

test('speaking again resets the pause', () => {
  const s = run([[0.6, 500], [0.6, 900], [0.1, 1000], [0.6, 2000], [0.1, 2300]]);
  assert.equal(askStopReason(s, 1000 + SILENCE_MS), null);
  assert.equal(askStopReason(s, 2300 + SILENCE_MS), 'silence');
});

test('a click at the start or a short noise is not speech', () => {
  const click = run([[0.9, 100], [0.05, 500], [0.05, 3000]]);
  assert.equal(askStopReason(click, 3000), null);
  const blip = run([[0.05, 500], [0.8, 600], [0.05, 700], [0.05, 4000]]);
  assert.equal(askStopReason(blip, 4000), null);
});

test('a noisy room raises the bar for speech', () => {
  // The room sits at 0.3, above the fixed 0.25, so room noise alone must not count as speech.
  const room = run([[0.3, 100], [0.3, 300], [0.32, 500], [0.31, 800], [0.3, 1200], [0.3, 3000]]);
  assert.equal(heardSpeech(room), false);
  assert.equal(askStopReason(room, 3000 + SILENCE_MS), null);
  const talk = run([[0.3, 100], [0.3, 300], [0.7, 500], [0.7, 700], [0.7, 900], [0.3, 1000]]);
  assert.equal(heardSpeech(talk), true);
  assert.equal(askStopReason(talk, 1000 + SILENCE_MS), 'silence');
});

test('stock phrases Whisper returns for silence count as nothing heard', () => {
  assert.equal(cleanTranscript('  Why do I feel  so tired? '), 'Why do I feel so tired?');
  assert.equal(cleanTranscript('Thank you.'), '');
  assert.equal(cleanTranscript('Thank you so much for watching.'), '');
  assert.equal(cleanTranscript('Thank you for the help today'), 'Thank you for the help today');
  assert.equal(cleanTranscript('...'), '');
  assert.equal(cleanTranscript(undefined), '');
});
