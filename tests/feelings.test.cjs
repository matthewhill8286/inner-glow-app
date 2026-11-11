const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const mod = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('lib/feelings.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
  { module: mod, exports: mod.exports, Map, String },
);
const f = mod.exports;

test('several feelings can be picked, stored in English and read back', () => {
  let list = f.toggleFeeling([], 'tired');
  list = f.toggleFeeling(list, 'anxious');
  assert.deepEqual([...list], ['tired', 'anxious']);
  assert.deepEqual([...f.toggleFeeling(list, 'tired')], ['anxious']);
  assert.equal(f.moodWithFeelings('Okay', list), 'Okay\nTired\nAnxious');
  assert.equal(f.moodWithFeelings(null, []), null);
  assert.deepEqual([...f.feelingsFromWords(['Tired', 'anxious', 'Bored', 'Tired'])], ['tired', 'anxious']);
});
