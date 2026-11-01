const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const mod = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('lib/profile-stats.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
  { module: mod, exports: mod.exports, Date, Math, Array, Map, Set, Number, String },
);
const p = mod.exports;
// Sunday 1 Nov 2026, 15:00 local.
const today = new Date(2026, 10, 1, 15);
const iso = (m, d, h = 9) => new Date(2026, m - 1, d, h).toISOString();

test('the streak counts back from yesterday until today is done', () => {
  const s = p.streak(p.activeDays([iso(10, 29), iso(10, 30), iso(10, 31)]), today);
  assert.equal(s.count, 3);
  assert.equal(p.streak(p.activeDays([iso(10, 30), iso(10, 31), iso(11, 1)]), today).count, 3);
});

test('one missed day pauses the streak and two end it', () => {
  assert.equal(p.streak(p.activeDays([iso(10, 27), iso(10, 28), iso(10, 30), iso(10, 31)]), today).count, 4);
  assert.equal(p.streak(p.activeDays([iso(10, 26), iso(10, 27), iso(10, 30), iso(10, 31)]), today).count, 2);
  assert.equal(p.streak(p.activeDays([iso(10, 20)]), today).count, 0);
});

test('month days mark the streak, earlier active days and today', () => {
  const october = new Date(2026, 9, 31, 12);
  const active = p.activeDays([iso(10, 2), iso(10, 29), iso(10, 30)]);
  const days = p.monthDays(active, p.streak(active, october).days, october);
  assert.equal(days.length, 31);
  assert.equal(days[1].state, 'active');
  assert.equal(days[28].state, 'streak');
  assert.equal(days[30].state, 'today');
  assert.equal(days[0].state, 'none');
});

test('week mood bars average each day and leave empty days null', () => {
  const bars = p.weekMoodBars([{ createdAt: iso(10, 26), mood: 'Great' }, { createdAt: iso(10, 26, 20), mood: 'Okay' }, { createdAt: iso(11, 1), mood: 'Low' }], today);
  assert.equal(bars.length, 7);
  assert.equal(bars[0], 4);
  assert.equal(bars[1], null);
  assert.equal(bars[6], 2);
});

test('the week mood is the most common one, latest first on a tie', () => {
  const week = [{ createdAt: iso(10, 26), mood: 'Good' }, { createdAt: iso(10, 27), mood: 'Good' }, { createdAt: iso(10, 28), mood: 'Low' }];
  assert.equal(p.weekMood(week, today), 'Good');
  assert.equal(p.weekMood([{ createdAt: iso(10, 26), mood: 'Good' }, { createdAt: iso(10, 28), mood: 'Low' }], today), 'Low');
  assert.equal(p.weekMood([{ createdAt: iso(10, 20), mood: 'Good' }], today), null);
});

test('score change compares with the last score a week or more ago', () => {
  const history = [{ score: 60, createdAt: iso(10, 20) }, { score: 68, createdAt: iso(10, 24) }, { score: 70, createdAt: iso(10, 30) }];
  assert.equal(p.scoreChange(72, history, today.getTime()), 4);
  assert.equal(p.scoreChange(72, [{ score: 70, createdAt: iso(10, 30) }], today.getTime()), null);
});

test('greetings prefer the nickname, then the first name', () => {
  assert.equal(p.greetingName({ nickname: ' Matt ', name: 'Matthew Hill' }), 'Matt');
  assert.equal(p.greetingName({ nickname: null, name: 'Matthew Hill' }), 'Matthew');
  assert.equal(p.greetingName(null), '');
});
