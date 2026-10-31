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
const display = load('lib/conversation-display.ts');
const layout = load('lib/screen-layout.ts');
const user = {
  id: 'u1',
  role: 'user',
  content: '  I feel\n anxious ',
  createdAt: '2026-10-15T12:00:00Z',
};
const assistant = {
  id: 'a1',
  role: 'assistant',
  content: 'Let us reflect together.',
  createdAt: '2026-10-15T12:00:01Z',
};
test('conversation titles use the opening user thought and previews identify the speaker', () => {
  assert.equal(display.conversationTitle([user, assistant], 'General'), 'I feel anxious');
  assert.equal(display.conversationTitle([], 'Sleep'), 'Sleep');
  assert.equal(display.conversationPreview([user]), 'You: I feel anxious');
  assert.equal(display.conversationPreview([user, assistant]), 'Let us reflect together.');
});
test('conversation search matches all terms across title, coach and topic', () => {
  assert.equal(
    display.matchesConversation('anxious freud', 'I feel anxious', 'Dr. Freud AI', 'Anxiety'),
    true,
  );
  assert.equal(
    display.matchesConversation('sleep', 'I feel anxious', 'Dr. Freud AI', 'Anxiety'),
    false,
  );
  assert.equal(display.matchesConversation('  ', 'Title', 'Guide', 'Topic'), true);
});
test('retry keeps one copy of the failed user turn and rejects retrying an answered turn', () => {
  const messages = [user];
  assert.equal(display.prepareChatTurn(messages, user, true), messages);
  assert.throws(() => display.prepareChatTurn([user, assistant], user, true));
  assert.equal(display.prepareChatTurn([assistant], user, false).length, 2);
  assert.equal(messages.length, 1);
});
test('scroll clearance always reserves the floating navigation and safe area', () => {
  for (const inset of [0, 20, 34, 60])
    assert.ok(
      layout.screenBottomPadding(inset) >= layout.TAB_BAR_HEIGHT + layout.tabBarOffset(inset) + 24,
    );
  assert.equal(layout.screenBottomPadding(34, false), 50);
  assert.equal(layout.screenBottomPadding(0, false), 32);
});
