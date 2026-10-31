const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const moduleUnderTest = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('lib/assessment-flow.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  { module: moduleUnderTest, exports: moduleUnderTest.exports },
);
const { getAssessmentSteps } = moduleUnderTest.exports;

test('only an explicit Yes includes the medication details step', () => {
  for (const answer of ['No', 'Not sure', undefined, null, '']) {
    const steps = getAssessmentSteps(answer);
    assert.equal(steps.includes('medsSpecify'), false, String(answer));
    assert.equal(steps.length, 12);
    const medicationIndex = steps.indexOf('meds');
    assert.equal(steps[medicationIndex + 1], 'symptoms');
    assert.equal(steps[steps.indexOf('symptoms') - 1], 'meds');
  }
  const yesSteps = getAssessmentSteps('Yes');
  assert.equal(yesSteps.length, 13);
  assert.equal(yesSteps[yesSteps.indexOf('meds') + 1], 'medsSpecify');
  assert.equal(yesSteps[yesSteps.indexOf('symptoms') - 1], 'medsSpecify');
});

test('changing Yes to No and back updates the route without losing the final step', () => {
  const yesSteps = getAssessmentSteps('Yes');
  const medicationIndex = yesSteps.indexOf('meds');
  const noSteps = getAssessmentSteps('No');
  assert.equal(noSteps[medicationIndex], 'meds');
  assert.equal(noSteps[medicationIndex + 1], 'symptoms');
  const changedBack = getAssessmentSteps('Yes');
  assert.equal(changedBack[medicationIndex + 1], 'medsSpecify');
  for (const steps of [yesSteps, noSteps, changedBack]) {
    assert.equal(steps[steps.length - 1], 'sound');
    assert.equal(new Set(steps).size, steps.length);
  }
});
