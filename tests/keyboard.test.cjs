const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const load = (os) => {
  const mod = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync('lib/keyboard.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
    { module: mod, exports: mod.exports, Math, require: () => ({ Platform: { OS: os } }) },
  );
  return mod.exports;
};

test('dragging a list closes the keyboard interactively on iOS and on drag on Android', () => {
  assert.equal(load('ios').KEYBOARD_DISMISS_MODE, 'interactive');
  assert.equal(load('android').KEYBOARD_DISMISS_MODE, 'on-drag');
});

test('only a deliberate, mostly vertical swipe down counts', () => {
  const { isSwipeDown } = load('ios');
  assert.equal(isSwipeDown(100, 100, 100, 130), true);
  assert.equal(isSwipeDown(100, 100, 104, 110), false); // a tap with a little jitter
  assert.equal(isSwipeDown(100, 100, 100, 60), false); // swiping up
  assert.equal(isSwipeDown(100, 100, 160, 130), false); // mostly sideways
});
