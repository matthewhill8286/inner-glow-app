const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function engine(invokeAI) {
  const m = { exports: {} };
  const database = { from() {
    const query = new Proxy({}, { get(_, key) {
      if (key === 'then') return resolve => resolve({ data: [], error: null });
      return () => query;
    } });
    return query;
  } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/suggestionEngine.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { module: m, exports: m.exports, console, Date, Set, Map,
    require(name) {
      if (name === '@/lib/ai-privacy') return { invokeAI };
      if (name === '@/supabase/supabase') return { supabase: database };
      throw Error(name);
    } });
  return m.exports;
}
const context = { userId: 'test', score: 50, breakdown: { mood: 40, sleep: 50 } };
test('basic suggestions never invoke the paid AI service by default', async () => {
  let calls = 0;
  const result = await engine(async () => { calls++; throw Error('Unexpected AI call'); })
    .generateSuggestionsForUser(context);
  assert.equal(calls, 0);
  assert.equal(result.source, 'templates');
});
test('explicit AI generation preserves access denial instead of silently using templates', async () => {
  const denied = Object.assign(new Error('Premium required'), { status: 403 });
  await assert.rejects(engine(async () => { throw denied; }).generateSuggestionsForUser({
    ...context, allowAI: true, requireAI: true,
  }), error => error === denied);
});
test('explicit AI generation reports invalid responses instead of claiming AI success', async () => {
  await assert.rejects(engine(async () => ({ data: {} })).generateSuggestionsForUser({
    ...context, allowAI: true, requireAI: true,
  }), /unavailable/);
});
