const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const mod = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('lib/notification-feed.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
  { module: mod, exports: mod.exports, Date, Math, Number, Set, Object },
);
const f = mod.exports;
const now = new Date(2026, 10, 2, 17, 45);
const at = (d, h) => new Date(2026, 10, d, h).toISOString();

test('items group into today, yesterday and earlier, newest first', () => {
  const groups = f.groupFeed([
    { id: 'a', type: 'reminder', createdAt: at(2, 9) },
    { id: 'b', type: 'reminder', createdAt: at(2, 12) },
    { id: 'c', type: 'reminder', createdAt: at(1, 21) },
    { id: 'd', type: 'reminder', createdAt: new Date(2026, 9, 20).toISOString() },
    { id: 'e', type: 'reminder', createdAt: 'not a date' },
  ], now);
  assert.equal(JSON.stringify(groups.map((g) => [g.group, g.items.map((i) => i.id)])), '[["today",["b","a"]],["yesterday",["c"]],["earlier",["d"]]]');
  assert.equal(f.groupFeed([], now).length, 0);
});

test('every type has an icon, a glow colour node and an in-app route', () => {
  const glow = new Set(['#D8B4D8', '#8E7FA6', '#7FC6F1', '#E2CC40', '#FFB3BE']);
  for (const look of Object.values(f.FEED_LOOK)) {
    assert.ok(look.icon.startsWith('line/'));
    assert.ok(glow.has(look.node));
    assert.ok(/^\/\((tabs|moments)\)\//.test(look.route));
  }
  assert.equal(f.feedLook('unknown').icon, 'line/bell');
});

test('a reminder follows its own in-app route, never an outside link', () => {
  assert.equal(f.feedRoute({ type: 'reminder', meta: { route: '/(tabs)/sleep' } }), '/(tabs)/sleep');
  assert.equal(f.feedRoute({ type: 'reminder', meta: { route: 'https://example.com' } }), '/(tabs)/home');
  assert.equal(f.feedRoute({ type: 'journal_entry' }), '/(moments)/constellation');
});

test('the journal grid counts this month only and places days six per row', () => {
  const { written, days } = f.journalMonth([{ createdAt: at(1, 9) }, { createdAt: at(2, 8) }, { createdAt: new Date(2026, 9, 31).toISOString() }], now);
  assert.equal(days, 2);
  assert.equal(written.size, 2);
  assert.equal(JSON.stringify(f.gridDot(1)), '{"x":26,"y":26}');
  assert.equal(JSON.stringify(f.gridDot(7)), '{"x":26,"y":44}');
  assert.equal(JSON.stringify(f.gridDot(30)), '{"x":126,"y":98}');
});
