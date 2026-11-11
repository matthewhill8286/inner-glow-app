const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const store = new Map();
const mod = { exports: {} };
const crypto = require('node:crypto');
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('lib/passcode.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
  {
    module: mod, exports: mod.exports, JSON, Array, RegExp, Error,
    require: (name) => name === 'expo-crypto'
      ? { CryptoDigestAlgorithm: { SHA256: 'sha256' }, digestStringAsync: async (_a, s) => crypto.createHash('sha256').update(s).digest('hex'), getRandomBytes: (n) => crypto.randomBytes(n) }
      : { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 1, setItemAsync: async (k, v) => store.set(k, v), getItemAsync: async (k) => store.get(k) ?? null, deleteItemAsync: async (k) => store.delete(k) },
  },
);
const p = mod.exports;

test('passcodes are six digits, stored hashed and checked per user', async () => {
  assert.equal(p.isValidPasscode('123456'), true);
  assert.equal(p.isValidPasscode('12345'), false);
  assert.equal(p.isValidPasscode('12345a'), false);
  await p.setPasscode('user-1', '482913');
  assert.ok(![...store.values()].some((v) => v.includes('482913')));
  assert.equal(await p.hasPasscode('user-1'), true);
  assert.equal(await p.verifyPasscode('user-1', '482913'), true);
  assert.equal(await p.verifyPasscode('user-1', '000000'), false);
  assert.equal(await p.verifyPasscode('user-2', '482913'), false);
  await p.clearPasscode('user-1');
  assert.equal(await p.hasPasscode('user-1'), false);
});
