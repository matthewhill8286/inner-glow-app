const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const mod = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('lib/search.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
  { module: mod, exports: mod.exports, Date, Math, Array, Number, String, Object, Set },
);
const s = mod.exports;
const now = Date.UTC(2026, 10, 2);
const items = [
  { id: 'p1', type: 'practice', kind: 'sleep', title: 'Deep Sleep', minutes: 25 },
  { id: 'p2', type: 'practice', kind: 'sleep', title: 'Sleep Sounds', minutes: 20 },
  { id: 'p3', type: 'practice', kind: 'breathing', title: '4-7-8 Calm', minutes: 5 },
  { id: 'j1', type: 'journal', kind: 'journal', title: 'Tired but okay', body: 'slept 6h and felt foggy', at: now - 2 * 86_400_000 },
  { id: 't1', type: 'talk', kind: 'talk', title: 'Can’t switch off at night', body: 'sleep advice', at: now - 40 * 86_400_000 },
  { id: 'i1', type: 'insight', kind: 'insight', title: 'Sleep insights' },
];

const ids = (list) => JSON.stringify(list.map((x) => x.id));

test('every word must match, titles that start with the query come first', () => {
  assert.equal(ids(s.search(items, 'sleep')), '["i1","p2","p1","t1"]');
  assert.equal(ids(s.search(items, 'slept foggy')), '["j1"]');
  assert.equal(s.search(items, '   ').length, 0);
  assert.equal(s.search(items, 'xyzzy').length, 0);
});

test('search ignores accents and case', () => {
  assert.equal(s.normalize('Μεδιτασιόν ΎΠΝΟΣ'), 'μεδιτασιον υπνοσ');
  assert.equal(ids(s.search(items, 'DEEP')), '["p1"]');
});

test('filters by type, length and time', () => {
  const f = (o) => Object.assign({}, s.DEFAULT_FILTERS, o);
  assert.equal(ids(s.search(items, 'sleep', f({ types: ['practice'] }), now)), '["p2","p1"]');
  assert.equal(ids(s.search(items, 'sleep', f({ length: 'long' }), now)), '["p2","p1"]');
  assert.equal(ids(s.search(items, 'calm', f({ length: 'short' }), now)), '[]');
  assert.equal(ids(s.search(items, 'calm', f({ length: 'mid' }), now)), '["p3"]');
  assert.equal(ids(s.search(items, 'sleep', f({ time: 'month' }), now)), '[]');
  assert.equal(ids(s.search(items, 'tired', f({ time: 'week' }), now)), '["j1"]');
});

test('suggestions skip personal content and repeats', () => {
  assert.equal(JSON.stringify(s.suggestions(items, 'sle')), '["Sleep insights","Sleep Sounds","Deep Sleep"]');
});

test('highlight maps back to the original text', () => {
  assert.equal(JSON.stringify(s.highlight('Deep Sleep', 'sleep')), '[5,10]');
  assert.equal(JSON.stringify(s.highlight('Meditación', 'meditacion')), '[0,10]');
  assert.equal(s.highlight('Calm', 'zzz'), null);
});

test('recent searches stay unique and short', () => {
  let r = ['anxiety', 'sleep sounds'];
  r = s.addRecent(r, 'Sleep Sounds');
  assert.equal(JSON.stringify(r), '["Sleep Sounds","anxiety"]');
  assert.equal(s.addRecent(r, '  ').length, 2);
  assert.equal(s.addRecent(['a', 'b', 'c'], 'd', 3).length, 3);
});
