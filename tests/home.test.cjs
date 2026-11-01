const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file) {
  const mod = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
    { module: mod, exports: mod.exports, require: () => ({}), Date, Number, Math, String });
  return mod.exports;
}
const home = load('lib/home.ts');
const scale = load('lib/mood-scale.ts');
const plain = (v) => JSON.parse(JSON.stringify(v));
const local = (m, d, h, min = 0) => new Date(2026, m - 1, d, h, min).toISOString();

test('greeting follows the hour of the day', () => {
  assert.deepEqual([6, 11, 12, 16, 17, 23].map(home.greetingKey),
    ['goodMorning', 'goodMorning', 'goodAfternoon', 'goodAfternoon', 'goodEvening', 'goodEvening']);
});

test('the first-day state shows only before any check-in or saved score', () => {
  assert.equal(home.isFirstDay(0, 0), true);
  assert.equal(home.isFirstDay(1, 0), false);
  assert.equal(home.isFirstDay(0, 2), false);
});

test('trend arrows need two different values', () => {
  assert.equal(home.trend(80, 76), 'up');
  assert.equal(home.trend(3, 5), 'down');
  assert.equal(home.trend(4, 4), null);
  assert.equal(home.trend(null, 4), null);
  assert.equal(home.trend(4, undefined), null);
});

test('stress words bucket the 0–10 check-in scale', () => {
  assert.deepEqual([0, 3, 4, 6, 7, 10].map(home.stressLevel), ['low', 'low', 'medium', 'medium', 'high', 'high']);
});

test('the slider edits today\'s check-in, and earlier ones are left alone', () => {
  const checkIns = [
    { id: 'old', createdAt: local(10, 31, 20), mood: 'Low' },
    { id: 'today', createdAt: local(11, 1, 9), mood: 'Good' },
  ];
  assert.equal(home.todaysCheckIn(checkIns, new Date(2026, 10, 1, 18).getTime()).id, 'today');
  assert.equal(home.todaysCheckIn(checkIns.slice(0, 1), new Date(2026, 10, 1, 18).getTime()), null);
  const { latest, previous } = home.latestTwoCheckIns(checkIns);
  assert.deepEqual([latest.id, previous.id], ['today', 'old']);
});

test('sleep rows compare the last two nights by wake time', () => {
  const nights = home.latestTwoNights([
    { startISO: local(10, 30, 23), endISO: local(10, 31, 6, 40) },
    { startISO: local(10, 31, 23), endISO: local(11, 1, 7) },
    { startISO: '', endISO: '' },
  ]);
  assert.deepEqual(plain(nights), { latest: 480, previous: 460 });
  assert.equal(home.formatSleep(400), '6h 40m');
});

test('the score trend compares against the latest score saved before today', () => {
  const now = new Date(2026, 10, 1, 12).getTime();
  const history = [
    { score: 82, createdAt: local(11, 1, 8) },
    { score: 76, createdAt: local(10, 31, 21) },
    { score: 70, createdAt: local(10, 30, 21) },
  ];
  assert.equal(home.previousDayScore(history, now), 76);
  assert.equal(home.previousDayScore(history.slice(0, 1), now), null);
});

test('the mood scale maps check-in words, scores and slider positions', () => {
  assert.equal(scale.moodScoreOf('Bad'), 1);
  assert.equal(scale.moodScoreOf('Great'), 5);
  assert.equal(scale.moodStep(4).key, 'good');
  assert.equal(scale.moodStep(9).score, 5);
  // 303pt track, 10pt insets, stops every 70.75pt (04 §B1).
  assert.equal(scale.xForScore(2, 303), 80.75);
  assert.deepEqual([0, 10, 45, 46, 151.5, 293, 400].map((x) => scale.scoreAtX(x, 303)), [1, 1, 1, 2, 3, 5, 5]);
});

test('Glow score history needs check-ins on three different days', () => {
  assert.equal(home.checkInDays([]), 0);
  assert.equal(home.checkInDays([{ createdAt: local(10, 1, 8) }, { createdAt: local(10, 1, 21) }, { createdAt: local(10, 2, 9) }]), 2);
  assert.equal(home.checkInDays([{ createdAt: local(10, 1, 8) }, { createdAt: local(10, 2, 9) }, { createdAt: local(10, 3, 9) }]), 3);
  assert.equal(home.SCORE_HISTORY_MIN_DAYS, 3);
});
