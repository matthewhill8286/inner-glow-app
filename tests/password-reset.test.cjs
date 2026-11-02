const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const mod = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('lib/password-reset.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText,
  { module: mod, exports: mod.exports, Math, String },
);
const r = mod.exports;

test('emails are checked and masked like the design', () => {
  assert.equal(r.isEmail(' hannah@gmail.com '), true);
  assert.equal(r.isEmail('hannah@gmail'), false);
  assert.equal(r.maskEmail('hannah@gmail.com'), 'h•••@gmail.com');
  assert.equal(r.maskEmail('nope'), 'nope');
});

test('the code keeps six digits from pasted text', () => {
  assert.equal(r.cleanCode('48 1-2 937'), '481293');
  assert.equal(r.cleanCode('12a'), '12');
});

test('the resend countdown reads m:ss', () => {
  assert.equal(r.countdown(42), '0:42');
  assert.equal(r.countdown(60), '1:00');
  assert.equal(r.countdown(-3), '0:00');
});

test('the new password rules follow the 8 characters with a number or symbol policy', () => {
  assert.deepEqual(
    { ...r.passwordRules('glowing1', 'glowing1') },
    { length: true, symbol: true, match: true },
  );
  assert.deepEqual(
    { ...r.passwordRules('glowing', 'glowin') },
    { length: false, symbol: false, match: false },
  );
  assert.equal(r.passwordRules('', '').match, false);
});
