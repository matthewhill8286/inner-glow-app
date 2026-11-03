const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const mod = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('lib/mfa-setup.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  { module: mod, exports: mod.exports, Map },
);
const { setupTotp, totpQrXml } = mod.exports;
const enrollment = {
  id: 'new',
  totp: { qr_code: 'data:image/svg+xml;utf-8,<svg/>', secret: 'test-only' },
};

test('overlapping mounts share one cleanup and enrollment', async () => {
  let enrolls = 0,
    cleanups = 0;
  const mfa = {
    listFactors: async () => ({ data: { totp: [{ id: 'stale', status: 'unverified' }] } }),
    unenroll: async () => {
      cleanups++;
      return {};
    },
    enroll: async () => {
      enrolls++;
      return { data: enrollment };
    },
  };
  const a = setupTotp('same-user', mfa);
  const b = setupTotp('same-user', mfa);
  assert.equal(a, b);
  assert.equal((await a).qr, '<svg/>');
  assert.equal(enrolls, 1);
  assert.equal(cleanups, 1);
});
test('verified factors are preserved and never re-enrolled', async () => {
  const result = await setupTotp('verified', {
    listFactors: async () => ({ data: { totp: [{ id: 'safe', status: 'verified' }] } }),
    unenroll: () => assert.fail('must preserve existing security'),
    enroll: () => assert.fail('must not enroll'),
  });
  assert.equal(result.enabled, true);
  assert.equal(result.id, 'safe');
});
test('cleanup failure stops enrollment and a later retry can succeed', async () => {
  const mfa = {
    listFactors: async () => ({ data: { totp: [{ id: 'old', status: 'unverified' }] } }),
    unenroll: async () => ({ error: new Error('cleanup failed') }),
    enroll: () => assert.fail('must not enroll after failed cleanup'),
  };
  await assert.rejects(setupTotp('retry', mfa), /cleanup failed/);
  mfa.unenroll = async () => ({});
  mfa.enroll = async () => ({ data: enrollment });
  assert.equal((await setupTotp('retry', mfa)).enabled, false);
});
test('QR XML preserves Supabase raw XML and decodes encoded data URIs', () => {
  assert.equal(totpQrXml('data:image/svg+xml;utf-8,<svg>#</svg>'), '<svg>#</svg>');
  assert.equal(totpQrXml('data:image/svg+xml,%3Csvg%2F%3E'), '<svg/>');
});
