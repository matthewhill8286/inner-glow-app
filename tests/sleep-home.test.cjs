const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const mod = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/sleep-home.ts', 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
  { module: mod, exports: mod.exports, require: () => ({}), Date, Number, Math, String });
const home = mod.exports;

// Local-time helpers so the tests hold in any time zone.
const local = (m, d, h, min = 0) => new Date(2026, m - 1, d, h, min).toISOString();
const night = (m, d, bedH, bedMin, wakeH, wakeMin, extra = {}) => ({
  id: `${m}-${d}`, createdAtISO: '', startISO: local(m, d - 1, bedH, bedMin), endISO: local(m, d, wakeH, wakeMin), ...extra,
});

test('last night is the latest wake time, with stages giving asleep and deep minutes', () => {
  const entries = [
    night(10, 30, 23, 0, 7, 0),
    night(10, 31, 23, 10, 7, 0, {
      awakenings: 1,
      stages: [
        { stage: 'light', startISO: local(10, 30, 23, 10), endISO: local(10, 31, 2, 0) },
        { stage: 'deep', startISO: local(10, 31, 2, 0), endISO: local(10, 31, 3, 40) },
        { stage: 'awake', startISO: local(10, 31, 3, 40), endISO: local(10, 31, 3, 50) },
        { stage: 'rem', startISO: local(10, 31, 3, 50), endISO: local(10, 31, 7, 0) },
      ],
    }),
  ];
  const n = home.lastNight(entries);
  assert.equal(n.entry.id, '10-31');
  assert.equal(n.asleepMinutes, 460);
  assert.equal(n.deepMinutes, 100);
  assert.equal(home.formatDuration(n.asleepMinutes), '7h 40m');
  assert.equal(home.formatClock(n.startMs), '23:10');
});

test('without stages, asleep is bedtime to wake and there is no deep figure', () => {
  const n = home.lastNight([night(10, 31, 23, 30, 7, 31)]);
  assert.equal(n.asleepMinutes, 481);
  assert.equal(n.deepMinutes, null);
  assert.equal(n.awakenings, null);
  assert.equal(home.lastNight([{ id: 'x', createdAtISO: '', startISO: '', endISO: '' }]), null);
});

test('best this month needs three nights in the month and the longest sleep', () => {
  const entries = [night(10, 28, 23, 0, 6, 0), night(10, 29, 23, 0, 7, 0), night(10, 31, 22, 30, 7, 0)];
  const latest = home.lastNight(entries);
  assert.equal(home.isBestThisMonth(latest, entries), true);
  assert.equal(home.isBestThisMonth(latest, entries.slice(1)), false);
  const shorter = home.summariseNight(entries[0]);
  assert.equal(home.isBestThisMonth(shorter, entries), false);
});

test('week bars run Monday to Sunday and a night counts on the day it ended', () => {
  // Saturday 31 October 2026.
  const now = new Date(2026, 9, 31, 12).getTime();
  const { bars, avgHours } = home.weekBars([night(10, 27, 23, 0, 7, 0), night(10, 31, 23, 0, 6, 0), night(10, 20, 23, 0, 7, 0)], now);
  assert.equal(bars.length, 7);
  assert.equal(new Date(bars[0].dayStartMs).getDay(), 1);
  assert.deepEqual(JSON.parse(JSON.stringify(bars.map((b) => b.hours))), [null, 8, null, null, null, 7, null]);
  assert.equal(avgHours, 7.5);
});

test('bar heights cap at 9 hours in the 96pt track', () => {
  assert.equal(home.barHeight(4.5), 48);
  assert.equal(home.barHeight(12), 96);
  assert.equal(home.barHeight(-1), 0);
});

test('wind-down is 30 minutes before bedtime and wraps past midnight', () => {
  assert.equal(home.windDownClock(23, 0), '22:30');
  assert.equal(home.windDownClock(0, 15), '23:45');
  assert.equal(home.clockFrom(7, 5), '07:05');
});

test('a night counts as last night for 36 hours after waking', () => {
  const n = home.lastNight([night(10, 31, 23, 0, 7, 0)]);
  assert.equal(home.isRecent(n, new Date(2026, 9, 31, 20).getTime()), true);
  assert.equal(home.isRecent(n, new Date(2026, 10, 2, 9).getTime()), false);
});
