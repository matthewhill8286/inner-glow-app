const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const compile = (file) =>
  ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;

const errors = { exports: {} };
vm.runInNewContext(compile('lib/function-errors.ts'), {
  module: errors,
  exports: errors.exports,
  require: (p) =>
    p === '@/lib/diagnostics'
      ? { recordDiagnostic: () => 'ref' }
      : { serviceCode: (s) => (s ? 'SERVICE_UNAVAILABLE' : 'NETWORK') },
});
const chat = { exports: {} };
vm.runInNewContext(compile('lib/chat.ts'), {
  module: chat,
  exports: chat.exports,
  require: (p) =>
    p === '@/data/practices' ? { practiceById: (id) => (id === 'box-breathing' ? { id } : undefined) } : {},
});
const { chatQuickReplies } = chat.exports;
const { isOfflineError, ServiceError: RealServiceError } = errors.exports;

test('quick replies keep up to three short, distinct strings', () => {
  assert.deepEqual(
    [...chatQuickReplies(['Reply to one email', '  Make a  to-do list ', 'Reply to one email', 'I don’t know', 'Fourth'])],
    ['Reply to one email', 'Make a to-do list', 'I don’t know'],
  );
  assert.deepEqual([...chatQuickReplies(['', 42, 'x'.repeat(61), 'Okay'])], ['Okay']);
  assert.deepEqual([...chatQuickReplies(undefined)], []);
  assert.deepEqual([...chatQuickReplies('Okay')], []);
});

test('a request that never reached the server counts as offline', () => {
  assert.equal(isOfflineError(new TypeError('Network request failed')), true);
  assert.equal(isOfflineError(new RealServiceError('Failed to send a request to the Edge Function')), true);
  assert.equal(isOfflineError(new RealServiceError('Busy', 500)), false);
  assert.equal(isOfflineError(new Error('Invalid request')), false);
});
