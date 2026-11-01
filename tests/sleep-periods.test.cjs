const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const mod = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('lib/sleep-periods.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
  { module: mod, exports: mod.exports, Date, Math, Array, Map, Set, Number, String },
);
const s = mod.exports;
// Friday 30 Oct 2026, 12:00 local.
const now = new Date(2026, 9, 30, 12);
const night = (m, d, hours, factors) => {
  const end = new Date(2026, m - 1, d, 7).getTime();
  return { startISO: new Date(end - hours * 3_600_000).toISOString(), endISO: new Date(end).toISOString(), factors };
};

test('a night belongs to the day it ended on', () => {
  const byDay = s.hoursByDay([night(10, 29, 7.5)]);
  assert.equal(byDay.size, 1);
  assert.equal([...byDay.values()][0], 7.5);
});

test('the week runs Monday to Sunday and future days are empty', () => {
  const week = s.periodSeries([night(10, 26, 7), night(10, 30, 8)], 'week', now);
  assert.equal(week.length, 7);
  assert.equal(week[0], 7);
  assert.equal(week[1], null);
  assert.equal(week[4], 8);
  assert.equal(week[5], null);
});

test('the month has one value per day of the calendar month', () => {
  const month = s.periodSeries([night(10, 1, 6), night(10, 15, 9)], 'month', now);
  assert.equal(month.length, 31);
  assert.equal(month[0], 6);
  assert.equal(month[14], 9);
  assert.equal(month[30], null);
});

test('the year has monthly averages and nothing for months to come', () => {
  const year = s.periodSeries([night(9, 3, 6), night(9, 4, 8), night(10, 2, 7)], 'year', now);
  assert.equal(year.length, 12);
  assert.equal(year[8], 7);
  assert.equal(year[9], 7);
  assert.equal(year[10], null);
});

test('averages compare with the previous calendar period', () => {
  const nights = [night(9, 10, 6), night(9, 11, 7), night(10, 10, 8)];
  assert.equal(s.periodAverage(nights, 'month', now), 8);
  assert.equal(s.periodAverage(nights, 'month', now, -1), 6.5);
  assert.equal(s.periodAverage([], 'week', now), null);
});

test('factor impacts need two nights each way and split into helps and hurts', () => {
  const nights = [night(10, 1, 8, ['wind_down']), night(10, 2, 8, ['wind_down']), night(10, 3, 6, ['caffeine']), night(10, 4, 6, ['caffeine']), night(10, 5, 7, ['nap'])];
  const { helps, hurts } = s.factorImpacts(nights);
  assert.equal(helps[0].key, 'wind_down');
  assert.equal(helps[0].minutes, 100);
  assert.equal(hurts[0].key, 'caffeine');
  assert.equal(helps.some((h) => h.key === 'nap'), false);
});

test('chart scale and hours format', () => {
  assert.equal(Math.round(s.chartY(8)), 32);
  assert.equal(s.chartY(4), 150);
  assert.equal(s.chartY(12), 0);
  assert.equal(s.formatHours(7.3), '7h 18m');
});

const wk = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('lib/mood-week.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
  { module: wk, exports: wk.exports, Date, Array },
);
const w = wk.exports;

test('the mood week runs Monday to Sunday with the latest check-in each day', () => {
  const log = (id, d, h, mood) => ({ id, createdAt: new Date(2026, 9, d, h).toISOString(), mood });
  const logs = [log('a', 26, 9, 'Okay'), log('b', 26, 20, 'Great'), log('c', 29, 8, 'Low'), log('d', 19, 8, 'Good')];
  const days = w.weekDays(logs, now);
  assert.equal(days.length, 7);
  assert.equal(days[0].log.id, 'b');
  assert.equal(days[0].score, 5);
  assert.equal(days[1].log, null);
  assert.equal(days[3].score, 2);
  assert.equal(w.latestLog(logs).id, 'c');
  assert.equal(w.latestLog([]), null);
});
