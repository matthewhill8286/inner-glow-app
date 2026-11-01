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
  { module: moduleUnderTest, exports: moduleUnderTest.exports, Math },
);
const { getAssessmentSteps, stepGlow, stressBandScore, stressBandFromLevel, takesMedication } = moduleUnderTest.exports;

test('only prescription or over-the-counter answers include the medication search', () => {
  for (const answer of ['none', 'prefer_not', 'No', 'Not sure', undefined, null, '']) {
    const steps = getAssessmentSteps(answer);
    assert.equal(steps.includes('medsSpecify'), false, String(answer));
    assert.equal(steps.length, 13);
    assert.equal(steps[steps.indexOf('meds') + 1], 'symptoms');
  }
  for (const answer of ['prescription', 'otc', 'Yes']) {
    const steps = getAssessmentSteps(answer);
    assert.equal(steps.length, 14, answer);
    assert.equal(steps[steps.indexOf('meds') + 1], 'medsSpecify');
    assert.equal(steps[steps.indexOf('symptoms') - 1], 'medsSpecify');
  }
  assert.equal(takesMedication('none'), false);
});

test('changing the medication answer keeps the route and ends on the write step', () => {
  const withMeds = getAssessmentSteps('prescription');
  const without = getAssessmentSteps('none');
  const medsIndex = withMeds.indexOf('meds');
  assert.equal(without[medsIndex], 'meds');
  for (const steps of [withMeds, without]) {
    assert.equal(steps[steps.length - 1], 'write');
    assert.equal(steps[steps.length - 2], 'sound');
    assert.equal(new Set(steps).size, steps.length);
  }
});

test('the top glow walks the 14-colour ramp and clamps at the ends', () => {
  assert.equal(stepGlow(0), '#E2CC40');
  assert.equal(stepGlow(13), '#7FC6F1');
  assert.equal(stepGlow(20), '#7FC6F1');
  assert.equal(stepGlow(-1), '#E2CC40');
});

test('stress bands score from calm to intense and old 0–10 levels map to a band', () => {
  assert.deepEqual([1, 2, 3, 4, 5].map(stressBandScore), [100, 75, 50, 25, 0]);
  assert.deepEqual([0, 2, 5, 8, 10].map(stressBandFromLevel), [1, 1, 3, 4, 5]);
});
