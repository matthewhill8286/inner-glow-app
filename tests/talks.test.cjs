const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const mod = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('lib/talks.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
  { module: mod, exports: mod.exports, Date },
);
const t = mod.exports;
// Sunday 1 Nov 2026, 15:00 local; the week started on Monday 26 Oct.
const now = new Date(2026, 10, 1, 15, 0);
const at = (m, d, h = 9) => new Date(2026, m - 1, d, h).getTime();
const msg = (role, content) => ({ id: content, role, content, createdAt: '' });

test('talks group by the Monday-start week', () => {
  assert.equal(t.startOfWeek(now).getDate(), 26);
  assert.equal(t.talkGroup(at(10, 26, 0), now), 'thisWeek');
  assert.equal(t.talkGroup(at(10, 25, 23), now), 'earlier');
});

test('dates read Today, a weekday this week, or day and month before that', () => {
  assert.equal(t.talkDate(at(11, 1), 'en-GB', 'Today', now), 'Today');
  assert.equal(t.talkDate(at(10, 27), 'en-GB', 'Today', now), 'Tue');
  assert.equal(t.talkDate(at(10, 12), 'en-GB', 'Today', now), '12 Oct');
  assert.equal(t.talkDate(0, 'en-GB', 'Today', now), '');
});

test('topic icons follow the conversation and the first talk gets the sparkle', () => {
  assert.equal(t.talkIcon({ personaId: 'sleep' }, false), 'line/moon');
  assert.equal(t.talkIcon({ topicName: 'Relationships' }, false), 'line/heart');
  assert.equal(t.talkIcon({ personaId: 'mood', topicId: 'general' }, false), 'line/leaf');
  assert.equal(t.talkIcon({ personaId: 'freud', topicId: 'general' }, false), 'line/chat');
  assert.equal(t.talkIcon({ personaId: 'sleep' }, true), 'line/sparkle');
});

test('titles and summaries are short single lines', () => {
  const messages = [msg('user', 'I feel **overwhelmed**   every morning before work and I do not know why'), msg('assistant', 'That sounds heavy. Let us try box breathing together.')];
  assert.equal(t.talkTitle(messages, 'Talk'), 'I feel overwhelmed every morning before…');
  assert.equal(t.talkSummary(messages), 'That sounds heavy.');
  assert.equal(t.talkTitle([], 'New talk'), 'New talk');
  assert.equal(t.talkSummary([]), '');
  assert.equal(t.talkSummary([msg('user', 'Only me so far')]), 'Only me so far');
});
