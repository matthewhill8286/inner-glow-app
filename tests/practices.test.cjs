const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const mod = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('lib/practices.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText,
  { module: mod, exports: mod.exports, Date, Math, String },
);
const p = mod.exports;
const box = { inhale: 4, hold: 4, exhale: 4, holdAfter: 4 };
const calm = { inhale: 4, hold: 7, exhale: 8, holdAfter: 0 };

test('phases skip zero-length holds and follow the pace', () => {
  assert.equal(
    p
      .phaseSteps(calm)
      .map((s) => s.phase)
      .join(),
    'inhale,hold,exhale',
  );
  assert.equal(p.cycleSeconds(box), 16);
  assert.equal(p.cycleSeconds(box, 'slow'), 20);
  assert.equal(p.cycleSeconds(box, 'fast'), 12.8);
});

test('breath position walks through the cycle', () => {
  assert.equal(p.breathAt(box, 'normal', 0).phase, 'inhale');
  assert.equal(p.breathAt(box, 'normal', 5).phase, 'hold');
  assert.equal(p.breathAt(box, 'normal', 9).phase, 'exhale');
  assert.equal(p.breathAt(box, 'normal', 13).phase, 'holdAfter');
  const later = p.breathAt(box, 'normal', 34);
  assert.equal(later.breath, 2);
  assert.equal(later.phase, 'inhale');
  assert.equal(later.progress, 0.5);
});

test('a 4-minute box session at normal pace is 15 breaths', () => {
  assert.equal(p.totalBreaths(box, 'normal', 4), 15);
  assert.equal(p.totalBreaths(calm, 'normal', 0.1), 1);
});

test('the orb grows on the inhale, holds, and shrinks to 0.8 on the exhale', () => {
  assert.equal(p.orbScale('inhale', 0), 0.8);
  assert.equal(p.orbScale('inhale', 1), 1);
  assert.equal(p.orbScale('hold', 0.5), 1);
  assert.equal(Math.round(p.orbScale('exhale', 1) * 100), 80);
  assert.equal(p.orbScale('holdAfter', 0.3), 0.8);
});

test('times and done-so-far copy', () => {
  assert.equal(p.mmss(68), '01:08');
  assert.equal(p.doneSoFar(48).unit, 'seconds');
  assert.equal(p.doneSoFar(150).value, 2);
});

test('minutes today and yesterday for the hub', () => {
  const now = new Date(2026, 10, 2, 15);
  const at = (d, h) => new Date(2026, 10, d, h).toISOString();
  const r = p.minutesTodayAndYesterday(
    [
      { seconds: 300, dateISO: at(2, 9) },
      { seconds: 90, dateISO: at(2, 10) },
      { seconds: 600, dateISO: at(1, 20) },
      { seconds: 600, dateISO: at(30, 9) },
    ],
    now,
  );
  assert.equal(r.today, 7);
  assert.equal(r.yesterday, 10);
});

test('the goal steps by five between 5 and 60', () => {
  assert.equal(p.stepGoal(10, 1), 15);
  assert.equal(p.stepGoal(5, -1), 5);
  assert.equal(p.stepGoal(60, 1), 60);
  assert.equal(p.stepGoal(12, -1), 5);
});

test('the goal nudge is today at 19:00 until the goal is met or the time has passed', () => {
  assert.equal(p.nextNudge(3, 10, new Date(2026, 10, 2, 12)).getDate(), 2);
  assert.equal(p.nextNudge(12, 10, new Date(2026, 10, 2, 12)).getDate(), 3);
  assert.equal(p.nextNudge(3, 10, new Date(2026, 10, 2, 20)).getDate(), 3);
});

test('the sessions week sums Monday to Sunday and colours each day by its longest session', () => {
  const now = new Date(2026, 10, 4, 12);
  const at = (d, h) => new Date(2026, 10, d, h).toISOString();
  const w = p.practiceWeek(
    [
      { seconds: 300, dateISO: at(2, 9), category: 'breathing' },
      { seconds: 1200, dateISO: at(2, 22), category: 'sleep' },
      { seconds: 120, dateISO: at(4, 8), category: 'relax-body' },
      { seconds: 600, dateISO: at(1, 9), category: 'mindfulness' },
    ],
    now,
  );
  assert.equal(w.days[0].minutes, 25);
  assert.equal(w.days[0].category, 'sleep');
  assert.equal(w.days[2].category, 'relax-body');
  assert.equal(w.days[1].minutes, 0);
  assert.equal(w.minutes, 27);
  assert.equal(w.count, 3);
});
