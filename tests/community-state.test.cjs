const test = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  vm = require('node:vm'),
  ts = require('typescript');
function load(file, mocks = {}) {
  const m = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    {
      exports: m.exports,
      module: m,
      Date,
      Set,
      Map,
      require: (n) => {
        if (n in mocks) return mocks[n];
        throw Error(n);
      },
    },
  );
  return m.exports;
}
const state = load('lib/community-state.ts');
test('notification dates use calendar timestamps rather than English relative labels', () => {
  const now = new Date(2026, 9, 17, 12);
  assert.equal(
    state.isCommunityNotificationToday({ createdAt: new Date(2026, 9, 17, 1).toISOString() }, now),
    true,
  );
  assert.equal(
    state.isCommunityNotificationToday({ createdAt: new Date(2026, 9, 16, 23).toISOString() }, now),
    false,
  );
  assert.equal(state.isCommunityNotificationToday({ createdAt: 'invalid' }, now), false);
  assert.equal(state.isCommunityNotificationToday({}, now), false);
});
test('notification taps open the exact post or actor and do not invent a destination', () => {
  assert.equal(
    state.communityNotificationTarget({ postId: 'post-1', actorId: 'actor' }).params.postId,
    'post-1',
  );
  assert.equal(state.communityNotificationTarget({ actorId: 'actor' }).params.userId, 'actor');
  assert.equal(state.communityNotificationTarget({}), null);
});
function hooks(responses = {}) {
  const calls = [],
    invalidations = [];
  const supabase = {
    from(table) {
      const chain = new Proxy(
        {},
        {
          get(_, key) {
            if (key === 'then')
              return (resolve) =>
                resolve((responses[table] || []).shift() || { data: null, error: null });
            return (...args) => {
              calls.push([table, key, ...args]);
              return chain;
            };
          },
        },
      );
      return chain;
    },
  };
  const h = load('hooks/useCommunity.ts', {
    '@tanstack/react-query': {
      useQuery: (x) => x,
      useMutation: (x) => x,
      useQueryClient: () => ({ invalidateQueries: (x) => invalidations.push(x.queryKey) }),
    },
    '@/supabase/supabase': { supabase },
    './useUser': { useUser: () => ({ data: { id: 'me' } }) },
    '@/lib/community-safety': { publishCommunityContent: async () => {} },
  });
  return { h, calls, invalidations };
}
test('comment reactions persist to the correct comment and refresh its post', async () => {
  const { h, calls, invalidations } = hooks();
  const mutation = h.useToggleCommentLike();
  const result = await mutation.mutationFn({ commentId: 'c1', postId: 'p1', isLiked: false });
  mutation.onSuccess(null, result);
  assert.ok(
    calls.some((c) => c[1] === 'insert' && c[2].comment_id === 'c1' && c[2].user_id === 'me'),
  );
  assert.equal(invalidations[0].join(','), 'communityPost,p1');
  await mutation.mutationFn({ commentId: 'c1', postId: 'p1', isLiked: true });
  assert.ok(calls.some((c) => c[1] === 'delete'));
  assert.ok(calls.some((c) => c[1] === 'eq' && c[2] === 'comment_id' && c[3] === 'c1'));
});
test('self-follow is rejected before writing to the database', async () => {
  const { h, calls } = hooks();
  await assert.rejects(
    h.useToggleFollow().mutationFn({ targetUserId: 'me', isFollowing: false }),
    /yourself/,
  );
  assert.equal(calls.length, 0);
});
test('feed comment counts come from stored counts even though comments are loaded separately', async () => {
  const { h } = hooks({
    community_posts: [
      {
        data: [
          {
            id: 'p1',
            user_id: 'me',
            comments_count: 7,
            created_at: new Date().toISOString(),
            category: 'support',
            post_type: 'story',
            likes_count: 2,
          },
        ],
        error: null,
      },
    ],
    community_profiles: [{ data: [], error: null }],
    community_likes: [{ data: [], error: null }],
    community_bookmarks: [{ data: [], error: null }],
  });
  const posts = await h.useCommunityFeed().queryFn();
  assert.equal(posts[0].commentCount, 7);
  assert.equal(posts[0].comments.length, 0);
});

test('only the owner profile query includes private posts', async () => {
  for (const target of ['me', 'someone-else']) {
    const profile = {
      user_id: target,
      created_at: new Date().toISOString(),
      display_name: 'Tester',
      followers_count: 0,
      following_count: 0,
    };
    const { h, calls } = hooks({
      community_profiles: [{ data: profile, error: null }],
      community_posts: [{ data: [], error: null }],
    });
    await h.useCommunityProfile(target).queryFn();
    assert.equal(
      calls.some(
        (c) =>
          c[0] === 'community_posts' && c[1] === 'eq' && c[2] === 'is_hidden' && c[3] === false,
      ),
      target !== 'me',
    );
  }
});
const catalogue = load('lib/search-catalogue.ts');
test('search combines all query words with category filters and does not mutate recommended order', () => {
  const translate = (key) => key.replaceAll('.', ' ');
  const original = catalogue.SEARCH_ITEMS.map((i) => i.key).join(',');
  const results = catalogue.searchCatalogue('sleep history', ['Sleep'], false, translate);
  assert.equal(results.length, 1);
  assert.equal(results[0].path, '/(tabs)/sleep/history');
  assert.equal(catalogue.searchCatalogue('sleep', ['Journal'], false, translate).length, 0);
  assert.ok(catalogue.searchCatalogue('', ['Journal'], true, translate).length > 0);
  assert.equal(catalogue.SEARCH_ITEMS.map((i) => i.key).join(','), original);
  const destinations = catalogue.SEARCH_ITEMS.map((i) => i.path);
  assert.equal(new Set(destinations).size, destinations.length);
});
