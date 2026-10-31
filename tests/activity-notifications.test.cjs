const test = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  vm = require('node:vm'),
  ts = require('typescript');
const cases = [
  ['useMood', 'addMoodCheckIn', { mood: 'Good', energy: 3, stress: 2 }, 'notifyMoodLogged'],
  [
    'useJournal',
    'createJournalEntry',
    { title: 'Test entry', content: 'Test' },
    'notifyJournalEntry',
  ],
  [
    'useSleep',
    'addSleepEntry',
    { startISO: '2026-10-14T00:00:00Z', endISO: '2026-10-14T07:00:00Z', duration: 7, quality: 4 },
    'notifySleepLogged',
  ],
  ['useMindfulness', 'addMindfulMinutes', 120, 'notifyMindfulnessSession'],
  ['useStress', 'addStressCompletion', null, 'notifyStressExercise'],
];
for (const [hook, action, input, notification] of cases)
  test(`${hook} records an activity notification only after a successful save`, async () => {
    let failure = false,
      emitted = [];
    const queryKeys = new Proxy({}, { get: () => new Proxy({}, { get: () => () => ['fixture'] }) });
    const data = {
      id: 'fixture',
      logged_at: '2026-10-14',
      created_at: '2026-10-14',
      date_iso: '2026-10-14',
      start_iso: '2026-10-14T00:00:00Z',
      end_iso: '2026-10-14T07:00:00Z',
      duration: 7,
      quality: 4,
      seconds: 120,
      title: 'Test',
      body: 'Test',
      exercise_id: 'fixture',
    };
    const builder = {
      insert() {
        return this;
      },
      select() {
        return this;
      },
      single: async () => ({ data, error: failure ? Error('Write failed') : null }),
    };
    const client = {
      invalidateQueries() {},
      cancelQueries: async () => {},
      getQueryData: () => [],
      setQueryData() {},
    };
    const mocks = {
      '@tanstack/react-query': {
        useQuery: () => ({ data: [] }),
        useQueryClient: () => client,
        useMutation: (o) => ({
          mutateAsync: async (value) => {
            const result = await o.mutationFn(value);
            await o.onSuccess?.(result, value);
            return result;
          },
        }),
      },
      '@/supabase/supabase': { supabase: { from: () => builder } },
      './useUser': { useUser: () => ({ data: { id: 'fixture' } }) },
      '@/lib/queryKeys': { queryKeys, STALE: {} },
      react: { useState: (initial) => [initial, () => {}], useEffect() {} },
      '@react-native-async-storage/async-storage': { default: {} },
      '@/lib/notificationStore': { [notification]: (...args) => emitted.push(args) },
    };
    const module = { exports: {} };
    vm.runInNewContext(
      ts.transpileModule(fs.readFileSync(`hooks/${hook}.ts`, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
      }).outputText,
      { module, exports: module.exports, require: (n) => mocks[n], Date, console },
    );
    const api = module.exports[hook]();
    const invoke = () =>
      hook === 'useStress' ? api[action]('fixture', 'Breathing') : api[action](input);
    failure = true;
    await assert.rejects(invoke());
    assert.equal(emitted.length, 0);
    failure = false;
    await invoke();
    assert.equal(emitted.length, 1);
  });

test('a failed first mood save removes the optimistic check-in, and success replaces it with the saved record', async () => {
  let cache,
    mutation,
    failure = true;
  const queryKeys = new Proxy({}, { get: () => new Proxy({}, { get: () => () => ['fixture'] }) });
  const client = {
    cancelQueries: async () => {},
    invalidateQueries() {},
    getQueryData: () => cache,
    setQueryData: (_key, value) => {
      cache = typeof value === 'function' ? value(cache) : value;
    },
  };
  const builder = {
    insert() {
      return this;
    },
    select() {
      return this;
    },
    single: async () => ({
      data: { id: 'saved', logged_at: '2026-10-15T12:00:00Z', energy_score: 3, stress_score: 2 },
      error: failure ? Error('Offline') : null,
    }),
  };
  const mocks = {
    '@tanstack/react-query': {
      useQuery: () => ({ data: cache }),
      useQueryClient: () => client,
      useMutation: (options) => {
        if (!mutation) mutation = options;
        return { mutateAsync() {} };
      },
    },
    '@/supabase/supabase': { supabase: { from: () => builder } },
    './useUser': { useUser: () => ({ data: { id: 'fixture' } }) },
    '@/lib/queryKeys': { queryKeys, STALE: {} },
    '@/lib/notificationStore': { notifyMoodLogged() {} },
    react: { useState: (initial) => [initial, () => {}], useEffect() {} },
  };
  const module = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync('hooks/useMood.ts', 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    { module, exports: module.exports, require: (n) => mocks[n], Date, console },
  );
  module.exports.useMood();
  const input = { mood: 'Good', energy: 3, stress: 2 };
  const context = await mutation.onMutate(input);
  assert.equal(cache.length, 1);
  await assert.rejects(mutation.mutationFn(input));
  mutation.onError(Error('Offline'), input, context);
  assert.equal(cache.length, 0);
  failure = false;
  const second = await mutation.onMutate(input);
  const saved = await mutation.mutationFn(input);
  mutation.onSuccess(saved, input, second);
  assert.equal(cache.length, 1);
  assert.equal(cache[0].id, 'saved');
});
