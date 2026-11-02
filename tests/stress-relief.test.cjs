const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const mod = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('lib/stress-relief.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
  { module: mod, exports: mod.exports },
);
const s = mod.exports;

test('grounding asks for fifteen things and counts only filled answers', () => {
  assert.equal(s.GROUNDING_TOTAL, 15);
  const a = s.emptyGrounding();
  assert.equal(a.see.length, 5);
  assert.equal(a.taste.length, 1);
  a.see[0] = 'lamp';
  a.hear[2] = '   ';
  a.taste[0] = 'mint';
  assert.equal(s.groundingFilled(a), 2);
  assert.equal(JSON.stringify([0, 3, 7, 12, 15].map(s.groundingStage)), '["start","early","middle","late","done"]');
});

test('stress history reopens grounding or the breathing practice that replaced the old exercise', () => {
  const ids = ['box-breathing', 'four-seven-eight', 'coherent'];
  assert.equal(s.stressEntryRoute('grounding-54321', ids), '/(tabs)/stress/grounding');
  assert.equal(s.stressEntryRoute('478', ids), '/(tabs)/mindful/practice/four-seven-eight');
  assert.equal(s.stressEntryRoute('box', ids), '/(tabs)/mindful/practice/box-breathing');
  assert.equal(s.stressEntryRoute('coherent', ids), '/(tabs)/mindful/practice/coherent');
  assert.equal(s.stressEntryRoute('body-1', ids), null);
});

test('the plan counts its four sections and ignores blank or repeated items', () => {
  assert.equal(s.planFilled(null), 0);
  assert.equal(s.planFilled({ quickPhrase: ' ', triggers: ['Work'], helpfulActions: [], people: ['Sam'] }), 2);
  assert.deepEqual(s.addPlanItem(['Walk'], '  walk '), ['Walk']);
  assert.deepEqual(s.addPlanItem(['Walk'], ' '), ['Walk']);
  assert.equal(JSON.stringify(s.addPlanItem(['Walk'], ' Music ')), '["Walk","Music"]');
});
