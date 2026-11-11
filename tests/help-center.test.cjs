const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
function load(file) {
  const module = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    { module, exports: module.exports },
  );
  return module.exports;
}
const { HELP_QUESTIONS, HELP_CATEGORIES, filterHelpQuestions } = load('lib/help-center.ts');
const en = load('i18n/locales/en/translation.ts').default.helpCenter;
const el = load('i18n/locales/el/translation.ts').default.helpCenter;
function items(copy) {
  return HELP_QUESTIONS.map((item) => ({ ...item, ...copy.questions[item.id] }));
}

test('every FAQ and category has English and Greek copy', () => {
  for (const copy of [en, el]) {
    for (const category of HELP_CATEGORIES) assert.ok(copy.categories[category]);
    for (const item of HELP_QUESTIONS) {
      assert.ok(copy.questions[item.id].question.length > 10);
      assert.ok(copy.questions[item.id].answer.length > 30);
    }
  }
});

test('FAQ search combines category and all search words across questions and answers', () => {
  const questions = items(en);
  assert.equal(filterHelpQuestions(questions, 'all', '   ').length, 6);
  assert.equal(filterHelpQuestions(questions, 'plans', '').length, 1);
  assert.equal(filterHelpQuestions(questions, 'all', 'APP STORE subscriptions')[0].id, 'cancel');
  assert.equal(filterHelpQuestions(questions, 'privacy', 'Apple').length, 0);
  assert.equal(filterHelpQuestions(questions, 'sleep', 'reminders')[0].id, 'reminders');
  assert.equal(filterHelpQuestions(questions, 'all', 'no-such-question').length, 0);
  assert.equal(questions.length, 6);
});

test('Greek search ignores accents, case and final sigma', () => {
  const questions = items(el);
  assert.equal(filterHelpQuestions(questions, 'all', 'ΥΠΝΟ')[0].id, 'score');
  assert.equal(filterHelpQuestions(questions, 'plans', 'συνδρομησ')[0].id, 'cancel');
});
