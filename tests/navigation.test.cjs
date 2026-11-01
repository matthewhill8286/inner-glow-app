const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
function load(file, stubs = {}) {
  const filename = path.resolve(file);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    require: (name) => stubs[name] ?? require(name),
  });
  return module.exports;
}
const { ROUTE_PATHS } = load('lib/route-paths.ts');
const legacy = load('lib/legacy-routes.ts');
let actions = [],
  canBack = false;
const nav = load('lib/navigation.ts', {
  '@/lib/route-paths': { ROUTE_PATHS },
  '@/lib/legacy-routes': legacy,
  'expo-router': {
    router: {
      navigate: (path) => actions.push(['navigate', path]),
      dismissTo: (path) => actions.push(['dismissTo', path]),
      canGoBack: () => canBack,
      back: () => actions.push('back'),
      replace: (path) => actions.push(path),
    },
  },
});
test('file-based destinations exist and the obsolete /index link is rejected', () => {
  for (const route of ROUTE_PATHS) assert.equal(nav.isAppRoute(route), true, route);
  assert.equal(nav.isAppRoute('/index'), false);
  assert.equal(nav.isAppRoute('/chat/freud:general:abc'), true);
  assert.equal(nav.isAppRoute('/missing-screen'), false);
});
test('back returns through real history, and direct links have a validated fallback', () => {
  actions = [];
  canBack = true;
  nav.backTo('/(tabs)/chat', '/(tabs)/home');
  assert.deepEqual(actions, ['back']);
  actions = [];
  canBack = false;
  nav.backTo('/(tabs)/chat', '/(tabs)/home');
  nav.backTo('//evil.example', '/(tabs)/home');
  nav.backTo('/missing-screen', '/(tabs)/home');
  assert.deepEqual(actions, ['/(tabs)/chat', '/(tabs)/home', '/(tabs)/home']);
});
test('skipping optional profile answers does not restart completed onboarding', () => {
  assert.equal(
    nav.entryRouteForProfile(true, { intention: null, selected_issues: ['stress'] }),
    '/(tabs)/home',
  );
  assert.equal(nav.entryRouteForProfile(false, null), '/(onboarding)/assessment');
  assert.equal(
    nav.entryRouteForProfile(true, { intention: 'Calm', selected_issues: [] }),
    '/(tabs)/home',
  );
  assert.equal(nav.entryRouteForProfile(true, null), '/(onboarding)/profile-setup');
});
const drafts = load('lib/chat-drafts.ts');
test('new chat messages are handed off once without putting their text in the route', () => {
  const key = drafts.stageChatDraft('freud:general:test', 'private opening message');
  assert.equal(key, 'freud:general:test');
  assert.equal(drafts.takeChatDraft(key), 'private opening message');
  assert.equal(drafts.takeChatDraft(key), undefined);
});

test('Home conversation shortcut and Chat return switch tabs without growing the stack', () => {
  actions = [];
  nav.openConversations();
  nav.returnHome();
  assert.equal(
    JSON.stringify(actions),
    JSON.stringify([
      ['navigate', '/(tabs)/chat'],
      ['navigate', '/(tabs)/home'],
    ]),
  );
});

test('notification detail and inbox return to fixed parents without pushing replacement copies', () => {
  actions = [];
  nav.returnToNotifications();
  nav.returnHome();
  nav.returnToNotifications();
  nav.returnHome();
  assert.equal(
    JSON.stringify(actions),
    JSON.stringify([
      ['dismissTo', { pathname: '/(tabs)/notifications', params: { from: '/(tabs)/home' } }],
      ['navigate', '/(tabs)/home'],
      ['dismissTo', { pathname: '/(tabs)/notifications', params: { from: '/(tabs)/home' } }],
      ['navigate', '/(tabs)/home'],
    ]),
  );
});

test('completing a flow dismisses intermediate forms to the existing feature root', () => {
  actions = [];
  nav.finishTo('/(tabs)/profile');
  nav.finishTo('/(tabs)/journal');
  assert.equal(
    JSON.stringify(actions),
    JSON.stringify([
      ['dismissTo', '/(tabs)/profile'],
      ['dismissTo', '/(tabs)/journal'],
    ]),
  );
});
const parents = load('lib/route-parents.ts', { './legacy-routes': legacy });
test('legacy feature URLs resolve to real canonical feature screens and preserve safe parameters', () => {
  for (const [oldRoute, newRoute] of Object.entries(legacy.LEGACY_ROUTES)) {
    assert.equal(nav.isAppRoute(oldRoute), true, oldRoute);
    assert.equal(nav.isAppRoute(newRoute), true, newRoute);
    assert.equal(legacy.canonicalRoute(oldRoute), newRoute);
    assert.equal(legacy.canonicalRoute(oldRoute.replace('/(tabs)', '')), newRoute);
    const target = path.join('app', newRoute.slice(1) + '.tsx');
    assert.ok(fs.existsSync(target), target);
  }
  const params = legacy.legacyRouteParams({
    postId: 'post-123',
    from: '/(tabs)/community-post',
    title: 'Sleep recorded',
    body: 'Good rest',
    screen: 'forged-screen',
    params: 'nested-controls',
    types: ['story', 'audio'],
  });
  assert.equal(
    JSON.stringify(params),
    JSON.stringify({
      from: '/(tabs)/community/post',
      postId: 'post-123',
      title: 'Sleep recorded',
      body: 'Good rest',
    }),
  );
});
test('direct secondary links fall back to their feature parent, including nested content', () => {
  const cases = {
    '/profile/edit': '/(tabs)/profile',
    '/profile/categories': '/(tabs)/profile',
    '/profile-edit': '/(tabs)/profile',
    '/notifications/detail': '/(tabs)/notifications',
    '/notification-detail': '/(tabs)/notifications',
    '/community/post': '/(tabs)/community',
    '/community/profile': '/(tabs)/community',
    '/community/filter': '/(tabs)/community',
    '/journal/history': '/(tabs)/journal',
    '/journal/stats': '/(tabs)/journal',
    '/mood/stats': '/(tabs)/mood',
    '/sleep/schedule': '/(tabs)/sleep',
    '/mindful/stats': '/(tabs)/mindful',
    '/stress/breathing/box': '/(tabs)/stress/breathing',
    '/stress/list/anxiety/video-1': '/(tabs)/stress/list/anxiety',
    '/freud-score/ai-suggestion-category': '/(tabs)/freud-score/ai-suggestions',
    '/delete-account': '/(tabs)/profile',
    '/community': '/(tabs)/home',
  };
  for (const [route, parent] of Object.entries(cases)) {
    assert.equal(parents.parentRouteForPath(route), parent, route);
    assert.equal(parents.parentRouteForPath('/(tabs)' + route), parent, route);
  }
});

test('notification inbox only returns to a primary origin and cannot loop back into details', () => {
  actions = [];
  nav.returnFromNotifications('/(tabs)/profile');
  nav.returnFromNotifications('/(tabs)/notifications/detail');
  nav.returnToNotifications('/(tabs)/profile', 'settings');
  assert.equal(
    JSON.stringify(actions),
    JSON.stringify([
      ['navigate', '/(tabs)/profile'],
      ['navigate', '/(tabs)/home'],
      [
        'dismissTo',
        { pathname: '/(tabs)/notifications', params: { from: '/(tabs)/profile', tab: 'settings' } },
      ],
    ]),
  );
});

test('legacy redirects live outside tabs and feature stacks seed their index parent', () => {
  const tabs = fs.readFileSync('app/(tabs)/_layout.tsx', 'utf8');
  for (const oldRoute of Object.keys(legacy.LEGACY_ROUTES)) {
    const name = oldRoute.split('/').pop();
    assert.ok(fs.existsSync(`app/(legacy)/${name}.tsx`), name);
    assert.equal(fs.existsSync(`app/(tabs)/${name}.tsx`), false, name);
    assert.equal(tabs.includes(`name="${name}"`), false, name);
  }
  for (const feature of [
    'profile',
    'community',
    'notifications',
    'chat',
    'journal',
    'mood',
    'sleep',
    'stress',
    'mindful',
    'freud-score',
  ]) {
    const layout = fs.readFileSync(`app/(tabs)/${feature}/_layout.tsx`, 'utf8');
    assert.match(layout, /initialRouteName:\s*['"]index['"]/);
  }
});

test('secondary features retain a visible parent tab and primary feature children retain their own tab', () => {
  for (const [route, owner] of Object.entries({
    '/home': 'home',
    '/chat': 'chat',
    '/chat/history': 'chat',
    '/journal/new': 'journal',
    '/mood/stats': 'home',
    '/mindful': 'mindful',
    '/mindful/stats': 'mindful',
    '/profile': 'profile',
    '/profile/edit': 'profile',
    '/profile-edit': 'profile',
    '/stress': 'home',
    '/sleep/insights': 'home',
    '/community/post': 'home',
    '/notifications/detail': 'home',
    '/freud-score': 'home',
  }))
    assert.equal(parents.primaryTabForPath(route), owner, route);
});
