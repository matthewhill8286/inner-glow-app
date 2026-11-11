const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const mod = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('lib/auth-errors.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
  { module: mod, exports: mod.exports, Array },
);
const { authErrorKind, isTakenSignUp } = mod.exports;

test('maps Supabase auth errors to friendly kinds', () => {
  assert.equal(authErrorKind({ code: 'invalid_credentials', message: 'Invalid login credentials' }), 'wrongPassword');
  assert.equal(authErrorKind({ message: 'Invalid login credentials' }), 'wrongPassword');
  assert.equal(authErrorKind({ code: 'user_already_exists' }), 'emailInUse');
  assert.equal(authErrorKind({ code: 'email_exists' }), 'emailInUse');
  assert.equal(authErrorKind({ message: 'User already registered' }), 'emailInUse');
  assert.equal(authErrorKind({ code: 'email_not_confirmed' }), 'unconfirmed');
  assert.equal(authErrorKind({ code: 'weak_password' }), 'weakPassword');
  assert.equal(authErrorKind({ code: 'over_request_rate_limit' }), 'rateLimited');
  assert.equal(authErrorKind({ status: 429 }), 'rateLimited');
  assert.equal(authErrorKind({ name: 'AuthRetryableFetchError', message: 'Failed to fetch' }), 'network');
  assert.equal(authErrorKind(new Error('Network request failed')), 'network');
  assert.equal(authErrorKind({ message: 'Database error saving new user' }), 'other');
  assert.equal(authErrorKind(null), 'other');
});

test('a sign-up with no identities means the email is taken', () => {
  assert.equal(isTakenSignUp({ identities: [] }), true);
  assert.equal(isTakenSignUp({ identities: [{ id: 'x' }] }), false);
  assert.equal(isTakenSignUp({}), false);
  assert.equal(isTakenSignUp(null), false);
});
