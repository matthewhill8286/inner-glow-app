const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load() {
  const module = { exports: {} };
  const mocks = {
    'react-native': { Platform: { OS: 'ios' } },
    '@react-native-async-storage/async-storage': { getItem: async () => null, setItem: async () => {} },
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/health-sleep.ts', 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
    { module, exports: module.exports, require: (name) => mocks[name], Date, Math, Number, JSON, console });
  return module.exports;
}
const api = load();
const at = (s) => `2026-10-${s}:00.000Z`;
const plain = (v) => JSON.parse(JSON.stringify(v));

test('Apple Watch stages become one night with asleep hours, bedtime, wake time and awakenings', () => {
  const samples = [
    { start: at('20T22:30'), end: at('21T06:40'), kind: 'inBed' },
    { start: at('20T22:50'), end: at('21T01:00'), kind: 'core' },
    { start: at('21T01:00'), end: at('21T02:00'), kind: 'deep' },
    { start: at('21T02:00'), end: at('21T02:15'), kind: 'awake' },
    { start: at('21T02:15'), end: at('21T04:00'), kind: 'rem' },
    { start: at('21T04:00'), end: at('21T04:10'), kind: 'awake' },
    { start: at('21T04:10'), end: at('21T06:30'), kind: 'core' },
  ];
  assert.deepEqual(plain(api.toSleepEntryInputs(api.groupNights(samples))), [
    { startISO: at('20T22:30'), endISO: at('21T06:40'), duration: 7.25, awakenings: 2 },
  ]);
});

test('overlapping samples from phone and watch are counted once', () => {
  const samples = [
    { start: at('20T23:00'), end: at('21T07:00'), kind: 'asleep' },
    { start: at('20T23:30'), end: at('21T06:30'), kind: 'core' },
  ];
  const [night] = api.toSleepEntryInputs(api.groupNights(samples));
  assert.equal(night.duration, 8);
  assert.equal(night.awakenings, undefined);
});

test('in-bed only data uses the in-bed span, and samples hours apart are separate nights', () => {
  const samples = [
    { start: at('19T23:00'), end: at('20T07:00'), kind: 'inBed' },
    { start: at('20T23:00'), end: at('21T06:00'), kind: 'inBed' },
  ];
  assert.deepEqual(plain(api.toSleepEntryInputs(api.groupNights(samples)).map((n) => n.duration)), [8, 7]);
});

test('gaps between asleep blocks count as awakenings when the source has no awake samples', () => {
  const samples = [
    { start: at('20T23:00'), end: at('21T02:00'), kind: 'asleep' },
    { start: at('21T02:30'), end: at('21T07:00'), kind: 'asleep' },
  ];
  assert.equal(api.groupNights(samples)[0].awakenings, 1);
});

test('short naps and out-of-bed stages are ignored', () => {
  const samples = [
    { start: at('21T14:00'), end: at('21T14:40'), kind: 'asleep' },
    { start: at('21T23:00'), end: at('21T23:20'), kind: 'outOfBed' },
  ];
  assert.deepEqual(plain(api.groupNights(samples)), []);
});

test('nights already saved, manual logs of the same night and repeats are dropped', () => {
  const incoming = [
    { startISO: at('19T23:00'), endISO: at('20T07:00') },
    { startISO: at('20T22:45'), endISO: at('21T06:50') },
    { startISO: at('20T22:45'), endISO: at('21T06:50') },
    { startISO: at('21T23:00'), endISO: at('22T07:00') },
  ];
  const existing = [
    { startISO: at('19T23:00'), endISO: at('20T07:00') },
    { startISO: at('20T23:00'), endISO: at('21T07:00') },
  ];
  assert.deepEqual(plain(api.dedupeAgainst(incoming, existing)), [incoming[3]]);
});

test('a short manual nap does not block the night around it unless it covers half of it', () => {
  assert.equal(api.isSameNight({ startISO: at('20T23:00'), endISO: at('21T07:00') }, { startISO: at('21T05:00'), endISO: at('21T05:30') }), true);
  assert.equal(api.isSameNight({ startISO: at('20T23:00'), endISO: at('21T07:00') }, { startISO: at('21T06:30'), endISO: at('21T08:30') }), false);
  assert.equal(api.isSameNight({ startISO: '', endISO: '' }, { startISO: at('21T06:30'), endISO: at('21T08:30') }), false);
});

test('planImport keeps only the last 30 nights and skips saved ones', () => {
  const now = Date.parse(at('31T12:00'));
  const samples = [
    { start: '2026-09-25T23:00:00.000Z', end: '2026-09-26T07:00:00.000Z', kind: 'asleep' },
    { start: at('29T23:00'), end: at('30T07:00'), kind: 'asleep' },
    { start: at('30T23:00'), end: at('31T07:00'), kind: 'asleep' },
  ];
  const existing = [{ startISO: at('30T23:10'), endISO: at('31T06:55') }];
  assert.deepEqual(plain(api.planImport(samples, existing, now)), [
    { startISO: at('29T23:00'), endISO: at('30T07:00'), duration: 8, awakenings: undefined },
  ].map(plain));
});

test('platform sleep values map to the same kinds', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(api.kindFromHealthKit), ['inBed', 'asleep', 'awake', 'core', 'deep', 'rem']);
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map(api.kindFromHealthConnect), ['asleep', 'awake', 'asleep', 'outOfBed', 'core', 'deep', 'rem']);
});
