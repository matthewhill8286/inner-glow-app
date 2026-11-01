const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const catalogue = JSON.parse(fs.readFileSync('data/medications.json', 'utf8'));
const mod = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('lib/medications.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText,
  { module: mod, exports: mod.exports, require: (p) => (p === '@/data/medications.json' ? catalogue : {}) },
);
const meds = mod.exports;
const plain = (v) => JSON.parse(JSON.stringify(v));
const names = (q) => plain(meds.searchMedications(q)).map((r) => r.name);

test('the catalogue uses UK and Cyprus names, not U.S. ones', () => {
  assert.equal(names('paracet')[0], 'Paracetamol');
  assert.equal(names('salbut')[0], 'Salbutamol');
  assert.ok(names('apot').includes('Apotel'));
  assert.ok(names('calpol').some((n) => n.startsWith('Calpol')));
  assert.ok(names('co-cod').includes('Co-Codamol'));
  assert.deepEqual(names('acetaminophen'), []);
});

test('generics carry a class and brands carry their generic', () => {
  const [sertraline] = plain(meds.searchMedications('sertraline'));
  assert.deepEqual(sertraline, { name: 'Sertraline', class: 'antidepressant' });
  const apotel = plain(meds.searchMedications('apotel')).find((r) => r.name === 'Apotel');
  assert.equal(apotel.generic, 'Paracetamol');
  assert.equal(apotel.class, 'painRelief');
});

test('name starts rank first, then word starts, generics before brands, at most eight', () => {
  const sample = {
    classes: ['painRelief'],
    generics: [['Codeine + Paracetamol', 0], ['Paracetamol', 0], ['Aspirin', -1]],
    brands: [['Paramol', 1], ['Calpol Paracetamol', 1]],
  };
  assert.deepEqual(plain(meds.searchCatalogue(sample, 'para')).map((r) => r.name), ['Paracetamol', 'Paramol', 'Codeine + Paracetamol', 'Calpol Paracetamol']);
  assert.deepEqual(plain(meds.searchCatalogue(sample, 'p')), []);
  assert.ok(meds.searchMedications('ol').length <= 8);
});

test('tapping a medication adds it once and tapping again removes it', () => {
  let list = meds.toggleMedication([], { name: 'Sertraline', class: 'antidepressant', custom: false });
  list = meds.toggleMedication(list, { name: ' Xyzolam ', custom: true });
  assert.deepEqual(plain(list).map((m) => m.name), ['Sertraline', 'Xyzolam']);
  list = meds.toggleMedication(list, { name: 'sertraline', custom: false });
  assert.deepEqual(plain(list).map((m) => m.name), ['Xyzolam']);
  assert.equal(meds.medicationsText(list), 'Xyzolam');
  assert.equal(meds.medicationsText([]), null);
});
