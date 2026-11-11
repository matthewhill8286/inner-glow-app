const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const load = (file) => {
  const mod = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
    { module: mod, exports: mod.exports, Date, Number },
  );
  return mod.exports;
};
const rating = load('lib/rating-prompt.ts');
const cards = load('lib/share-cards.ts');
const DAY = 86_400_000;
const now = Date.UTC(2026, 10, 11);

test('the helping prompt waits for three active days and then 90 days between asks', () => {
  assert.equal(rating.shouldAskHelping(2, null, now), false);
  assert.equal(rating.shouldAskHelping(3, null, now), true);
  assert.equal(rating.shouldAskHelping(10, now - 30 * DAY, now), false);
  assert.equal(rating.shouldAskHelping(10, now - 91 * DAY, now), true);
});

test('week cards count only the last seven days and never expose moods', () => {
  const iso = (days) => new Date(now - days * DAY).toISOString();
  const counts = cards.weekCounts(
    [{ createdAt: iso(1) }, { createdAt: iso(8) }],
    [{ dateISO: iso(2) }, { dateISO: iso(3) }],
    [{ createdAt: iso(6) }],
    now,
  );
  assert.deepEqual({ ...counts }, { checkIns: 1, practices: 2, journal: 1 });
  assert.equal(cards.weekHeadline([5, 4, 4]), 'steady');
  assert.equal(cards.weekHeadline([3, 4]), 'growing');
  assert.equal(cards.weekHeadline([1, 2]), 'gentle');
  assert.equal(cards.weekHeadline([]), 'gentle');
});
