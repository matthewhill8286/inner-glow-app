const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const mod = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('lib/sleep-flow.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
  { module: mod, exports: mod.exports, Date, Math, Array, Number, String, Object, parseInt },
);
const s = mod.exports;
const near = (a, b) => Math.abs(a - b) < 0.2;

test('the window wraps past midnight', () => {
  assert.equal(s.windowMinutes(s.minuteOfDay(23, 0), s.minuteOfDay(7, 0)), 480);
  assert.equal(s.windowMinutes(s.minuteOfDay(1, 0), s.minuteOfDay(9, 30)), 510);
  assert.equal(s.formatWindow(480), '8h 00m');
});

test('dial points match the Figma handles', () => {
  const bed = s.dialPoint(s.minuteOfDay(23, 0), 96.7, 187.5, 310);
  assert.ok(near(bed.x, 162.5) && near(bed.y, 216.6));
  const wake = s.dialPoint(s.minuteOfDay(7, 0), 96.7, 187.5, 310);
  assert.ok(near(wake.x, 280.9) && near(wake.y, 335.0));
});

test('a touch turns into a time snapped to five minutes', () => {
  assert.equal(s.minutesAt(0, -50), 0);
  assert.equal(s.minutesAt(50, 0), 360);
  assert.equal(s.minutesAt(0, 50), 720);
  assert.equal(s.minutesAt(-50, 0), 1080);
  assert.equal(s.minutesAt(Math.sin(0.0349) * 50, -Math.cos(0.0349) * 50) % 5, 0);
});

test('the window must stay between 3 and 12 hours', () => {
  assert.equal(s.windowAllowed(s.minuteOfDay(23, 0), s.minuteOfDay(7, 0)), true);
  assert.equal(s.windowAllowed(s.minuteOfDay(23, 0), s.minuteOfDay(1, 0)), false);
  assert.equal(s.windowAllowed(s.minuteOfDay(18, 0), s.minuteOfDay(9, 0)), false);
});

test('window segments cover the sweep from bed to wake', () => {
  const segs = s.windowSegments(1380, 420);
  assert.equal(segs[0].from, 1380);
  assert.ok(segs.at(-1).to >= 1380 + 480);
  assert.ok(segs[0].t < 0.05 && segs.at(-1).t > 0.95);
  assert.equal(s.mixColour('#000000', '#FFFFFF', 0.5), '#808080');
});

test('goal share and swipe threshold', () => {
  assert.equal(s.goalPercent(470, 510), 92);
  assert.equal(s.goalPercent(10, 0), 0);
  assert.equal(s.swipeComplete(220, 270), true);
  assert.equal(s.swipeComplete(200, 270), false);
});

test('the hypnogram holds each stage flat and closes the area', () => {
  const t = (h, m) => new Date(2026, 9, 27, h, m).toISOString();
  const stages = [
    { stage: 'light', startISO: t(23, 0), endISO: t(23, 30) },
    { stage: 'deep', startISO: t(23, 30), endISO: t(0 + 24, 0) },
    { stage: 'rem', startISO: t(24, 0), endISO: t(24, 30) },
  ];
  const h = s.hypnogram(stages, 300);
  assert.ok(h.line.startsWith('M0,72'));
  assert.ok(h.line.endsWith('L300.00,48'));
  assert.ok(h.area.endsWith('L300.00,112 L0,112 Z'));
  const mins = s.stageMinutes(stages);
  assert.equal(mins.deep, 30);
  assert.equal(mins.asleep, 90);
  assert.equal(s.hypnogram([], 300), null);
});

test('night axis places labels by real time', () => {
  const start = new Date(2026, 9, 27, 23, 5).getTime();
  const end = new Date(2026, 9, 28, 6, 55).getTime();
  const axis = s.nightAxis(start, end, 327);
  assert.equal(axis.length, 4);
  assert.equal(axis[0].x, 0);
  assert.equal(axis.at(-1).x, 327);
  assert.ok(axis[1].x < axis[2].x);
  assert.equal(new Date(axis[1].ms).getMinutes(), 0);
});
