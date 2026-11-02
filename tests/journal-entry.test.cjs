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
