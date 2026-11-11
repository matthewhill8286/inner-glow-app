const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const load = (file, requires = {}) => {
  const mod = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
    { module: mod, exports: mod.exports, require: (name) => requires[name], Set, Array, Object, String },
  );
  return mod.exports;
};
const citations = load('lib/citations.ts');
const { SOURCE_TOPICS, sourcesFor, isSourceTopic } = load('lib/feature-sources.ts', { '@/lib/citations': citations });

test('every feature topic lists at least three https sources without repeats', () => {
  for (const topic of SOURCE_TOPICS) {
    const list = sourcesFor(topic);
    assert.ok(list.length >= 3, topic);
    assert.equal(new Set(list.map((c) => c.url)).size, list.length, topic);
    for (const c of list) assert.match(c.url, /^https:\/\//);
  }
  assert.equal(isSourceTopic('sleep'), true);
  assert.equal(isSourceTopic('nope'), false);
});
