const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const mod = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('lib/paywall.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText,
  { module: mod, exports: mod.exports, Math, Number },
);
const p = mod.exports;
const base = { variant: 'home', days: 7, yearly: '€59.99', monthly: '€9.99' };

test('unknown variants fall back to the default paywall', () => {
  assert.equal(p.paywallVariant('plan'), 'plan');
  assert.equal(p.paywallVariant('nope'), 'default');
  assert.equal(p.paywallVariant(undefined), 'default');
});

test('the saving badge follows the store prices and hides under 10 %', () => {
  assert.equal(p.savingPercent(59.99, 9.99), 50);
  assert.equal(p.savingPercent(110, 9.99), null);
  assert.equal(p.savingPercent(null, 9.99), null);
});

test('trial length comes from the intro offer period', () => {
  assert.equal(p.periodDays('P1W'), 7);
  assert.equal(p.periodDays('P14D'), 14);
  assert.equal(p.periodDays('P1M'), 30);
  assert.equal(p.periodDays(null), null);
});

test('an eligible user on yearly sees the variant copy and the trial line', () => {
  const c = p.paywallCopy({ ...base, eligible: true, plan: 'yearly' });
  assert.equal(c.title.key, 'paywall.variants.home.title');
  assert.equal(c.subtitle.key, 'paywall.variants.home.subtitle');
  assert.equal(c.yearlySub.key, 'paywall.yearlyTrial');
  assert.equal(c.monthlySub.key, 'paywall.monthlySub');
  assert.equal(c.cta.key, 'paywall.variants.home.cta');
});

test('an eligible user on monthly is told monthly has no trial', () => {
  const c = p.paywallCopy({ ...base, eligible: true, plan: 'monthly' });
  assert.equal(c.title.key, 'paywall.variants.home.title');
  assert.equal(c.subtitle.key, 'paywall.monthlyNoTrial');
  assert.equal(c.monthlySub.key, 'paywall.monthlyCancel');
  assert.equal(c.cta.key, 'paywall.subscribeMonth');
  assert.equal(c.cta.params.price, '€9.99');
});

test('a user who had the trial sees Welcome back and plain prices on either plan', () => {
  const y = p.paywallCopy({ ...base, variant: 'plan', eligible: false, plan: 'yearly' });
  assert.equal(y.title.key, 'paywall.welcomeBack');
  assert.equal(y.subtitle.key, 'paywall.trialUsed');
  assert.equal(y.yearlySub.key, 'paywall.yearlyBilled');
  assert.equal(y.cta.key, 'paywall.subscribeYear');
  const m = p.paywallCopy({ ...base, eligible: false, plan: 'monthly' });
  assert.equal(m.subtitle.key, 'paywall.trialUsed');
  assert.equal(m.monthlySub.key, 'paywall.monthlySub');
  assert.equal(m.cta.key, 'paywall.subscribeMonth');
});
