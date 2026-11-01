const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const cache = {};
function load(file) {
  if (cache[file]) return cache[file];
  const mod = { exports: {} };
  cache[file] = mod.exports;
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
    { module: mod, exports: mod.exports, Date, Number, Math, String, Map,
      require: (name) => (name === './mood-scale' ? load('lib/mood-scale.ts') : {}) });
  return mod.exports;
}
const scale = load('lib/mood-scale.ts');
const logged = load('lib/mood-logged.ts');
const local = (m, d, h) => new Date(2026, m - 1, d, h).toISOString();

test('the summary joins factors the way people say them', () => {
  assert.equal(logged.joinNatural([], 'and'), '');
  assert.equal(logged.joinNatural(['sleep'], 'and'), 'sleep');
  assert.equal(logged.joinNatural(['friends', 'sleep'], 'and'), 'friends and sleep');
  assert.equal(logged.joinNatural(['friends', 'sleep', 'exercise'], 'and'), 'friends, sleep and exercise');
});

test('good days count each day once, from Monday, when its best mood is Good or Great', () => {
  // Sunday 1 November 2026; the week started Monday 26 October.
  const now = new Date(2026, 10, 1, 20).getTime();
  const checkIns = [
    { createdAt: local(10, 25, 9), mood: 'Great' }, // previous week
    { createdAt: local(10, 26, 9), mood: 'Low' },
    { createdAt: local(10, 26, 21), mood: 'Good' }, // same day, now good
    { createdAt: local(10, 28, 9), mood: 'Okay' },
    { createdAt: local(10, 30, 9), mood: 'Great' },
    { createdAt: local(11, 1, 9), mood: 'Good' },
    { createdAt: local(11, 1, 12), mood: 'Bad' },
  ];
  assert.equal(logged.goodDaysThisWeek(checkIns, now), 3);
  assert.equal(logged.goodDaysThisWeek([], now), 0);
});

test('the follow-up tone celebrates, reflects or is gentle', () => {
  assert.deepEqual([1, 2, 3, 4, 5].map(logged.moodTone), ['low', 'low', 'neutral', 'positive', 'positive']);
});

test('factors match the keys the database allows', () => {
  const sql = fs.readFileSync('supabase/migrations/20261101_mood_factors.sql', 'utf8');
  for (const f of logged.MOOD_FACTORS) assert.ok(sql.includes(`'${f.key}'`), f.key);
  assert.equal(logged.MOOD_FACTORS.length, 9);
});

test('averages skip check-ins without energy or stress', () => {
  assert.equal(scale.averageOf([4, undefined, 2, null]), 3);
  assert.equal(scale.averageOf([undefined, null]), null);
});

test('every mood has orb colours and an aura, and only Tense uses the wavy one', () => {
  for (const score of [1, 2, 3, 4, 5]) assert.ok(scale.ORB_LOOK[score].outer && scale.ORB_LOOK[score].inner);
  assert.deepEqual([1, 2, 3, 4, 5].map((s) => scale.ORB_LOOK[s].aura), ['tense', 'good', 'good', 'good', 'good']);
  for (const n of ['good', 'tense']) assert.ok(fs.readFileSync(`assets/svg/illustrations/mood/aura-${n}.svg`, 'utf8').includes('viewBox="27.5 170 320 320"'));
});
