const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const mod = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('lib/journal-entry.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText,
  { module: mod, exports: mod.exports, Date, Number },
);
const j = mod.exports;

test('journal moods map onto the five-step scale', () => {
  assert.equal(j.journalMoodScore('Low'), 2);
  assert.equal(j.journalMoodScore('overwhelmed'), 1);
  assert.equal(j.journalMoodScore('Calm'), 4);
  assert.equal(j.journalMoodScore('5'), 5);
  assert.equal(j.journalMoodScore('Curious'), null);
  assert.equal(j.journalMoodScore(''), null);
  assert.equal(j.journalMoodScore(null), null);
});

test('change date keeps the time of day and never moves into the future', () => {
  const created = new Date(2026, 9, 30, 8, 40).toISOString();
  const now = new Date(2026, 10, 2, 7, 0);
  const moved = new Date(j.movedDate(created, new Date(2026, 9, 28), now));
  assert.equal(moved.getDate(), 28);
  assert.equal(moved.getHours(), 8);
  assert.equal(moved.getMinutes(), 40);
  assert.equal(j.movedDate(created, new Date(2026, 10, 2), now), now.toISOString());
  assert.equal(j.movedDate(created, new Date(2026, 10, 9), now), now.toISOString());
});

test('the export holds the title, meta line, body and tags', () => {
  const labels = { untitled: 'Untitled entry', meta: 'Low · Fri, 30 Oct · 08:40', tags: 'Tags' };
  assert.equal(
    j.entryExportText(
      {
        title: 'Overwhelmed before work',
        content: 'Too many things.\n',
        tags: ['Work', 'Breathing'],
      },
      labels,
    ),
    'Overwhelmed before work\nLow · Fri, 30 Oct · 08:40\n\nToo many things.\n\nTags: Work, Breathing',
  );
  assert.equal(
    j.entryExportText({ title: '', content: 'Hi', tags: [] }, labels),
    'Untitled entry\nLow · Fri, 30 Oct · 08:40\n\nHi',
  );
});

test('crisis language opens support', () => {
  assert.equal(j.needsCrisisSupport('Some days I want to die'), true);
  assert.equal(j.needsCrisisSupport('A long day at work'), false);
  assert.equal(j.needsCrisisSupport(undefined), false);
});

test('the saved screen counts days with an entry so far this month', () => {
  const now = new Date(2026, 9, 30, 9);
  const at = (m, d, h = 8) => new Date(2026, m, d, h).toISOString();
  const r = j.monthProgress([at(9, 30), at(9, 30, 7), at(9, 2), at(8, 29), at(9, 31)], now);
  assert.equal(r.logged, 2);
  assert.equal(r.days, 30);
});

test('the month card has a dot per day so far, logged, missed or today', () => {
  const now = new Date(2026, 9, 30, 18);
  const at = (d) => new Date(2026, 9, d, 9).toISOString();
  const r = j.monthDots([at(1), at(1), at(3), at(29), new Date(2026, 8, 30).toISOString()], now);
  assert.equal(r.dots.length, 30);
  assert.equal(r.logged, 3);
  assert.equal(r.todayLogged, false);
  assert.equal(r.dots[0].state, 'logged');
  assert.equal(r.dots[1].state, 'missed');
  assert.equal(r.dots[29].state, 'today');
  assert.equal(r.perRow, 16);
  assert.equal(j.monthDots([], new Date(2026, 10, 2)).perRow, 15);
  assert.equal(j.monthDots([at(30)], now).dots[29].state, 'logged');
});

test('the year stats count months, words and moods', () => {
  const at = (m, d) => new Date(2026, m, d, 9).toISOString();
  const s = j.journalYearStats(
    [
      { createdAt: at(9, 30), content: 'one two three', mood: 'Low' },
      { createdAt: at(9, 2), content: 'a b', mood: 'Great' },
      { createdAt: at(0, 5), content: '', mood: 'Curious' },
      { createdAt: new Date(2025, 11, 31).toISOString(), content: 'old', mood: 'Low' },
    ],
    2026,
  );
  assert.equal(s.total, 3);
  assert.equal(s.monthly[9], 2);
  assert.equal(s.monthly[0], 1);
  assert.equal(s.avgWords, 2);
  assert.equal(s.moods['2'], 1);
  assert.equal(s.moods['5'], 1);
  assert.equal(s.moods.none, 1);
});
