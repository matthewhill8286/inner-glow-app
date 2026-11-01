const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
function load(file) {
  const mod = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    module: mod,
    exports: mod.exports,
    Array,
    Number,
    String,
  });
  return mod.exports;
}
const r = load('lib/reminder-schedule.ts');
const s = load('lib/sessions.ts');

test('schedule summaries name every day, weekdays, weekends or the days', () => {
  assert.equal(r.scheduleSummary([1, 2, 3, 4, 5, 6, 7]).kind, 'everyDay');
  assert.equal(r.scheduleSummary([6, 2, 3, 4, 5]).kind, 'weekdays');
  assert.equal(r.scheduleSummary([7, 1]).kind, 'weekends');
  const sunday = r.scheduleSummary([1]);
  assert.equal(sunday.kind, 'days');
  assert.equal(sunday.days.join(), '1');
  assert.equal(r.scheduleSummary([1, 2]).days.join(), '2,1');
});

test('every day is one daily trigger, otherwise one per day', () => {
  assert.equal(r.triggerPlan({ hour: 8, minute: 30, weekdays: [1, 2, 3, 4, 5, 6, 7] }).daily, true);
  assert.equal(r.triggerPlan({ hour: 8, minute: 30, weekdays: [2, 4] }).weekdays.join(), '2,4');
});

test('quiet hours can run past midnight', () => {
  assert.equal(r.inQuietHours(23, 0, '22:30', '07:30'), true);
  assert.equal(r.inQuietHours(7, 0, '22:30', '07:30'), true);
  assert.equal(r.inQuietHours(7, 30, '22:30', '07:30'), false);
  assert.equal(r.inQuietHours(20, 0, '22:30', '07:30'), false);
  assert.equal(r.inQuietHours(13, 0, '12:00', '14:00'), true);
  assert.equal(r.inQuietHours(13, 0, '12:00', '12:00'), false);
});

test('minute options step by five and keep an odd saved minute', () => {
  assert.equal(r.minuteOptions(30).length, 12);
  assert.equal(r.minuteOptions(32).includes(32), true);
  assert.equal(r.clock(8, 5), '08:05');
});

test('passwords need eight characters and a number or symbol', () => {
  assert.equal(r.passwordMeetsRule('glowing1'), true);
  assert.equal(r.passwordMeetsRule('glow!ing'), true);
  assert.equal(r.passwordMeetsRule('glowing'), false);
  assert.equal(r.passwordMeetsRule('glowingly'), false);
});

test('user agents become device names', () => {
  assert.equal(s.deviceFromUserAgent('InnerGlow/12 CFNetwork/1568.100.1 Darwin/24.0.0').name, 'iPhone');
  assert.equal(s.deviceFromUserAgent('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)').kind, 'tablet');
  assert.equal(s.deviceFromUserAgent('okhttp/4.12.0').name, 'Android phone');
  assert.equal(s.deviceFromUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36').name, 'Chrome on Mac');
  assert.equal(s.deviceFromUserAgent('Mozilla/5.0 (Windows NT 10.0) Gecko/20100101 Firefox/131.0').name, 'Firefox on Windows');
  assert.equal(s.deviceFromUserAgent(null).name, 'Unknown device');
});
