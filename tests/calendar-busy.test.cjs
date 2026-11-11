const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const mod = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('lib/calendar-busy.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
  { module: mod, exports: mod.exports, Date, Map, Number, Math },
);
const { eventsPerDay, moodByBusyness } = mod.exports;
const at = (day, hour = 10) => new Date(2026, 10, day, hour).toISOString();

test('busy days count timed events only and need three days on each side', () => {
  const events = [];
  for (const day of [2, 3, 4]) for (let h = 9; h < 13; h++) events.push({ startDate: at(day, h) });
  events.push({ startDate: at(5), allDay: true }, { startDate: at(5), allDay: true }, { startDate: at(5), allDay: true }, { startDate: at(5), allDay: true });
  const perDay = eventsPerDay(events);
  const checkIns = [2, 3, 4].map((d) => ({ createdAt: at(d, 18), score: 2 }))
    .concat([5, 6, 7].map((d) => ({ createdAt: at(d, 18), score: 4 })));
  const result = moodByBusyness(checkIns, perDay);
  assert.deepEqual({ ...result }, { busy: 2, quiet: 4, busyDays: 3, quietDays: 3 });
  assert.equal(moodByBusyness(checkIns.slice(0, 4), perDay), null);
});
