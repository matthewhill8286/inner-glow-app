const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const compile = (file) => ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const suggest = { exports: {} };
vm.runInNewContext(compile('lib/suggestCategories.ts'), { module: suggest, exports: suggest.exports, require: () => ({}), Number, String, Map, Array });
const mod = { exports: {} };
vm.runInNewContext(compile('lib/profile-setup.ts'), { module: mod, exports: mod.exports, Date, Number, String, require: () => suggest.exports });
const p = mod.exports;
const plain = (v) => JSON.parse(JSON.stringify(v));

test('the privacy step only appears with biometrics enrolled', () => {
  assert.deepEqual(plain(p.profileSteps(true)), ['profile', 'checkin', 'notifications', 'privacy']);
  assert.deepEqual(plain(p.profileSteps(false)), ['profile', 'checkin', 'notifications']);
});

test('check-in presets select their chip and captions follow the time of day', () => {
  assert.equal(p.presetForTime('08:30'), 'morning');
  assert.equal(p.presetForTime('14:00'), 'afternoon');
  assert.equal(p.presetForTime('21:00'), 'evening');
  assert.equal(p.presetForTime('07:45'), null);
  assert.deepEqual(['07:45', '11:59', '12:00', '16:59', '17:00', '23:30'].map(p.slotForTime), ['morning', 'morning', 'afternoon', 'afternoon', 'evening', 'evening']);
  assert.deepEqual(plain(p.parseTime('08:30')), { hour: 8, minute: 30 });
  assert.equal(p.formatTime(7, 5), '07:05');
});

test('birthdays are masked as DD / MM / YYYY and must be real past dates', () => {
  const today = new Date(2026, 10, 1);
  assert.equal(p.maskBirthday('1405'), '14 / 05');
  assert.equal(p.maskBirthday('14/05/1990x'), '14 / 05 / 1990');
  assert.equal(p.parseBirthday('14 / 05 / 1990', today), '1990-05-14');
  assert.equal(p.parseBirthday('31 / 02 / 1990', today), null);
  assert.equal(p.parseBirthday('02 / 11 / 2026', today), null);
  assert.equal(p.parseBirthday('01 / 01 / 1899', today), null);
  assert.equal(p.parseBirthday('14 / 05 / 19', today), null);
  assert.equal(p.birthdayToInput('1990-05-14'), '14 / 05 / 1990');
  assert.equal(p.birthdayToInput(null), '');
  assert.equal(p.ageOn('1990-11-02', today), 35);
  assert.equal(p.ageOn('1990-11-01', today), 36);
});

test('biometric wording names Face ID or Touch ID on iOS and uses plain words on Android', () => {
  assert.equal(p.biometricKind([2], 'ios'), 'faceId');
  assert.equal(p.biometricKind([1], 'ios'), 'touchId');
  assert.equal(p.biometricKind([1, 2], 'android'), 'fingerprintOrFace');
  assert.equal(p.biometricKind([1], 'android'), 'fingerprint');
  assert.equal(p.biometricKind([2], 'android'), 'face');
});

test('finishing setup picks up to three topics from the assessment', () => {
  assert.deepEqual(plain(p.suggestedIssues({ mood: 'Low', stressBand: 5, sleepQuality: 1 })), ['stress', 'sleep', 'depression']);
  assert.deepEqual(plain(p.suggestedIssues({ mood: 'Tense', stressBand: 3, sleepQuality: 4 })), ['anxiety', 'stress']);
  assert.deepEqual(plain(p.suggestedIssues({ mood: 'Okay', stressBand: 1, sleepQuality: 5 })), ['stress']);
  assert.deepEqual(plain(p.suggestedIssues(null)), []);
});
