const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

test('every password recovery method uses the installed app rather than the requesting host', () => {
  const source = fs.readFileSync(path.join(__dirname, '../lib/auth-redirects.ts'), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const module = { exports: {} };
  new Function('exports', compiled)(module.exports);
  assert.equal(module.exports.PASSWORD_RESET_REDIRECT, 'innerglow://reset-password');
  const screen = fs.readFileSync(path.join(__dirname, '../app/(auth)/forgot-password.tsx'), 'utf8');
  const requests = [...screen.matchAll(/resetPasswordForEmail\([\s\S]*?redirectTo:\s*([^,\n]+)/g)];
  assert.equal(requests.length, 3);
  for (const request of requests) assert.equal(request[1], 'PASSWORD_RESET_REDIRECT');
  assert.doesNotMatch(screen, /Linking\.createURL/);
});

test('passwords need 8 characters with a number or symbol', () => {
  const source = fs.readFileSync(path.join(__dirname, '../lib/password-policy.ts'), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  new Function('exports', compiled)(module.exports);
  const { passwordMeetsPolicy } = module.exports;
  assert.equal(passwordMeetsPolicy('abc12'), false);
  assert.equal(passwordMeetsPolicy('abcdefgh'), false);
  assert.equal(passwordMeetsPolicy('καλημέρα'), false);
  assert.equal(passwordMeetsPolicy('abcdefg1'), true);
  assert.equal(passwordMeetsPolicy('abcdefg!'), true);
  for (const screen of ['sign-up', 'reset-password']) {
    const code = fs.readFileSync(path.join(__dirname, `../app/(auth)/${screen}.tsx`), 'utf8');
    assert.match(code, /passwordMeetsPolicy\(/);
    assert.doesNotMatch(code, /length < 6/);
  }
});
