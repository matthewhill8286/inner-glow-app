const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const exportsObject = {};
vm.runInNewContext(
  ts.transpileModule(
    fs.readFileSync('supabase/functions/_shared/community-moderation.ts', 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
  ).outputText,
  { exports: exportsObject, AbortSignal, fetch, JSON, Error },
);
const { moderateCommunityText } = exportsObject;
const result = (flagged) => ({ flagged });
function mock(responses) {
  const calls = [];
  const request = async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    const [status, body] = responses.shift();
    return new Response(JSON.stringify(body), { status });
  };
  return { calls, request };
}
test('a standalone 403 uses real inline input moderation and preserves the content', async () => {
  for (const flagged of [false, true]) {
    const m = mock([
      [403, { error: 'Forbidden' }],
      [
        200,
        {
          choices: [{ message: { content: 'OK' } }],
          moderation: { input: { type: 'moderation_results', results: [result(flagged)] } },
        },
      ],
    ]);
    assert.equal(await moderateCommunityText('Hello', 'test', m.request), flagged);
    assert.equal(m.calls[1].body.messages[1].content, 'Hello');
    assert.equal(m.calls[1].body.moderation.model, 'omni-moderation-latest');
  }
});
test('standalone results need no generation request', async () => {
  const m = mock([[200, { results: [result(false)] }]]);
  assert.equal(await moderateCommunityText('Hello', 'test', m.request), false);
  assert.equal(m.calls.length, 1);
});
test('missing, malformed or errored input moderation never authorizes publishing', async () => {
  for (const input of [
    undefined,
    { type: 'error', message: 'unavailable' },
    { type: 'moderation_results', results: [] },
    { type: 'moderation_results', results: [{}] },
  ]) {
    const m = mock([
      [403, {}],
      [200, { choices: [{ message: { content: 'OK' } }], moderation: { input } }],
    ]);
    await assert.rejects(
      moderateCommunityText('Hello', 'test', m.request),
      /moderation result|Moderation result/,
    );
  }
});
test('other provider failures stop publishing without a generation fallback', async () => {
  const m = mock([[429, {}]]);
  await assert.rejects(moderateCommunityText('Hello', 'test', m.request), /429/);
  assert.equal(m.calls.length, 1);
});
