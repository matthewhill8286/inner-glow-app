const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const compile = (file) => ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const flow = { exports: {} };
vm.runInNewContext(compile('lib/assessment-flow.ts'), { module: flow, exports: flow.exports, Math });
const draft = { exports: {} };
vm.runInNewContext(compile('lib/assessment-draft.ts'), {
  module: draft, exports: draft.exports, Number, Array,
  require: (p) => (p === './assessment-flow' ? flow.exports : {}),
});
const { normaliseDraft } = draft.exports;
const plain = (v) => JSON.parse(JSON.stringify(v));

test('a draft from the old screen carries over the answers that still mean the same', () => {
  const out = normaliseDraft({
    step: 'stress',
    answers: { createdAt: '2026-10-31T10:00:00Z', gender: 'Woman', takingMeds: 'Yes', meds: 'Aspirin, Ibuprofen ',
      stressLevel: 7, mood: 'Happy\nCalm', soughtHelpBefore: 'Not sure', sleepQuality: 4, weight: 70, weightUnit: 'kg' },
  });
  assert.equal(out.step, 'stress');
  assert.deepEqual(plain(out.answers), {
    createdAt: '2026-10-31T10:00:00Z', goal: null, gender: 'Woman', age: null, weight: 70, weightUnit: 'kg',
    mood: null, moodScore: null, soughtHelpBefore: null, physicalDistress: null, sleepQuality: 4,
    takingMeds: 'prescription', medications: [{ name: 'Aspirin', custom: true }, { name: 'Ibuprofen', custom: true }],
    otherSymptoms: null, stressBand: 4, soundCheck: null, reflectionText: null,
  });
});

test('a new draft keeps its answers and clamps the reflection to 250 characters', () => {
  const out = normaliseDraft({ step: 'write', answers: { createdAt: 'x', moodScore: 2, stressBand: 5, takingMeds: 'otc',
    medications: [{ name: 'Sertraline', class: 'antidepressant', custom: false }, { bad: true }], reflectionText: 'a'.repeat(300) } });
  assert.equal(out.answers.mood, 'Low');
  assert.equal(out.answers.stressBand, 5);
  assert.equal(out.answers.takingMeds, 'otc');
  assert.deepEqual(plain(out.answers.medications), [{ name: 'Sertraline', class: 'antidepressant', custom: false }]);
  assert.equal(out.answers.reflectionText.length, 250);
});

test('malformed drafts are ignored and out-of-range values dropped', () => {
  assert.equal(normaliseDraft(null), null);
  assert.equal(normaliseDraft({ answers: {} }), null);
  const out = normaliseDraft({ answers: { createdAt: 'x', sleepQuality: 9, moodScore: 0, gender: 'Non-binary', weight: 'heavy' } });
  assert.equal(out.answers.sleepQuality, null);
  assert.equal(out.answers.moodScore, null);
  assert.equal(out.answers.gender, null);
  assert.equal(out.answers.weight, null);
});
