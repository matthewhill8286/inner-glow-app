const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const mod = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('lib/mood-stats.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText,
  { module: mod, exports: mod.exports, Date, Math, Map },
);
const s = mod.exports;
const now = new Date(2026, 10, 2, 21);
const at = (d, h = 9) => new Date(2026, 10, d, h).toISOString();
const logs = [
  { createdAt: at(2, 8), mood: 'Low', factors: ['work', 'sleep'] },
  { createdAt: at(2, 19), mood: 'Good', factors: ['work'] },
  { createdAt: at(30 - 31, 9), mood: 'Great', energy: 4, stress: 2 },
  { createdAt: new Date(2026, 9, 1).toISOString(), mood: 'Bad' },
];

test('a period keeps today, the last 7 days or the last 4 weeks', () => {
  assert.equal(s.inPeriod(logs, 'day', now).length, 2);
  assert.equal(s.inPeriod(logs, 'week', now).length, 3);
  assert.equal(s.inPeriod(logs, 'month', now).length, 3);
});

test('buckets average the mood in local time, oldest first', () => {
  const week = s.moodBuckets(logs, 'week', now);
  assert.equal(week.length, 7);
  assert.equal(week[6].count, 2);
  assert.equal(week[6].avg, 3);
  assert.equal(week[0].avg, null);
  const day = s.moodBuckets(logs, 'day', now);
  assert.equal(day.length, 6);
  assert.equal(day[0].count, 1);
  assert.equal(day[4].count, 1);
  assert.equal(s.moodBuckets(logs, 'month', now).length, 4);
});

test('the summary has the averages, the most common mood and the top factors', () => {
  const sum = s.moodSummary(s.inPeriod(logs, 'week', now));
  assert.equal(sum.count, 3);
  assert.equal(Math.round(sum.avgMood * 100) / 100, 3.67);
  assert.equal(sum.avgEnergy, 4);
  assert.equal(sum.avgStress, 2);
  assert.equal(sum.topMood, 'Great');
  assert.equal(sum.topFactors[0], 'work');
  assert.equal(s.moodSummary([]), null);
});
