const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
function load(file, mocks = {}) {
  const module = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    {
      module,
      exports: module.exports,
      setTimeout,
      clearTimeout,
      require: (name) => {
        if (name in mocks) return mocks[name];
        throw new Error('Unexpected import ' + name);
      },
    },
  );
  return module.exports;
}
const answers = load('lib/assessment-answers.ts');
test('multiple answers toggle independently and preserve custom text across storage roundtrips', () => {
  const options = ['Calm', 'Tired', 'Anxious'];
  let value = 'Calm';
  value = answers.toggleAssessmentAnswer(value, 'Tired', options);
  value = answers.writeAssessmentAnswer(
    answers.readAssessmentAnswer(value, options).selected,
    'Restless',
  );
  value = JSON.parse(JSON.stringify({ mood: value })).mood;
  assert.equal(value, 'Calm\nTired\nRestless');
  let read = answers.readAssessmentAnswer(value, options);
  assert.equal(read.selected.join(','), 'Calm,Tired');
  assert.equal(read.custom, 'Restless');
  value = answers.toggleAssessmentAnswer(value, 'Calm', options);
  assert.equal(value, 'Tired\nRestless');
  value = answers.toggleAssessmentAnswer(value, 'Tired', options);
  assert.equal(value, 'Restless');
  assert.equal(answers.writeAssessmentAnswer([], ''), '');
});
test('legacy custom answers, deduplication and multiple goals remain compatible with text columns', () => {
  const goals = ['Reduce daily stress', 'Try guided AI support'];
  assert.equal(
    answers.readAssessmentAnswer('A legacy custom goal', goals).custom,
    'A legacy custom goal',
  );
  const value = answers.writeAssessmentAnswer([...goals, goals[0]], '  Custom goal  ');
  assert.equal(value, 'Reduce daily stress\nTry guided AI support\n  Custom goal  ');
  assert.equal(answers.readAssessmentAnswer(value, goals).selected.length, 2);
});
const layout = load('lib/screen-layout.ts');
test('welcome artwork stays bounded at small widths, short heights and larger text', () => {
  for (const width of [320, 390, 440, 768]) {
    for (const height of [568, 667, 844, 956]) {
      for (const fontScale of [1, 1.5, 2]) {
        const result = layout.welcomeLayout(width, height, fontScale);
        assert.ok(result.artworkHeight > 0 && result.artworkHeight <= 240);
        assert.ok(result.artworkHeight <= ((Math.min(width, 520) - 56) * 280) / 360);
        if (height < 700 || fontScale > 1.3) assert.ok(result.artworkHeight <= 160);
      }
    }
  }
});
const startup = load('lib/startup.ts');
test('startup failures recover and hung services stop the launch spinner', async () => {
  assert.equal(await startup.withStartupDeadline(Promise.resolve('home'), 50), 'home');
  await assert.rejects(
    startup.withStartupDeadline(Promise.reject(new Error('offline')), 50),
    /offline/,
  );
  await assert.rejects(startup.withStartupDeadline(new Promise(() => {}), 5), /timed out/);
  let failures = 0;
  await startup.runOptionalStartup(
    () => {
      throw new Error('native unavailable');
    },
    () => failures++,
  );
  await startup.runOptionalStartup(
    async () => {
      throw new Error('offline');
    },
    () => failures++,
  );
  await startup.runOptionalStartup(
    async () => {},
    () => failures++,
  );
  assert.equal(failures, 2);
});
const states = load('lib/subscription-state.ts');
test('existing paid plans block duplicates on every platform while trials and expired plans can buy', () => {
  const monthly = { type: 'monthly', status: 'active', expiryDate: '2099-01-01' };
  assert.equal(states.alreadyOwnsPlan(monthly, 'monthly'), true);
  assert.equal(states.alreadyOwnsPlan(monthly, 'lifetime'), false);
  assert.equal(states.alreadyOwnsPlan({ type: 'lifetime', status: 'active' }, 'monthly'), true);
  assert.equal(states.alreadyOwnsPlan({ type: 'lifetime', status: 'active' }, 'lifetime'), true);
  assert.equal(states.alreadyOwnsPlan({ ...monthly, type: 'trial' }, 'monthly'), false);
  assert.equal(states.alreadyOwnsPlan({ ...monthly, expiryDate: '2000-01-01' }, 'monthly'), false);
});

test('custom answer editing preserves trailing spaces while toggling choices', () => {
  const options = ['Calm', 'Tired'];
  let value = answers.writeAssessmentAnswer(['Calm'], 'A custom ');
  assert.equal(answers.readAssessmentAnswer(value, options).custom, 'A custom ');
  value = answers.toggleAssessmentAnswer(value, 'Tired', options);
  assert.equal(answers.readAssessmentAnswer(value, options).custom, 'A custom ');
});
const score = load('lib/freudScore.ts', { './assessment-flow': load('lib/assessment-flow.ts') });
test('mixed assessment feelings average existing labels without changing daily mood scores', () => {
  const calm = score.calculateInitialFreudScore({ mood: 'Calm' });
  const tired = score.calculateInitialFreudScore({ mood: 'Tired' });
  const mixed = score.calculateInitialFreudScore({ mood: 'Calm\nTired\nA custom feeling' });
  assert.equal(mixed.breakdown.mood, (calm.breakdown.mood + tired.breakdown.mood) / 2);
  assert.equal(
    score.calculateInitialFreudScore({ mood: 'Calm\nCalm' }).breakdown.mood,
    calm.breakdown.mood,
  );
});

test('the redesigned assessment scores its 1–5 mood and stress band ahead of the older fields', () => {
  const calmBand = score.calculateInitialFreudScore({ stressBand: 1, stressLevel: 10 });
  const intenseBand = score.calculateInitialFreudScore({ stressBand: 5 });
  assert.equal(calmBand.breakdown.stress, 100);
  assert.equal(intenseBand.breakdown.stress, 0);
  assert.equal(score.calculateInitialFreudScore({ moodScore: 4, mood: 'Sad' }).breakdown.mood, 80);
});

const english = load('i18n/locales/en/translation.ts');
const greek = load('i18n/locales/el/translation.ts');
const choices = load('lib/profile-choices.ts', {
  '@/i18n/locales/en/translation': english,
  '@/i18n/locales/el/translation': greek,
});
test('legacy English and Greek profile choices render in the current language and save canonically', () => {
  const translate = (resource) => (key) => resource.default.profileSetup[key.split('.')[1]];
  assert.equal(choices.normalizeProfileChoice('Αυτοπεποίθηση', 'goal'), 'Confidence');
  assert.equal(choices.normalizeProfileChoice('Πρωί', 'routine'), 'Morning');
  assert.equal(
    choices.profileChoiceLabel('Αυτοπεποίθηση', 'goal', translate(english)),
    'Confidence',
  );
  assert.equal(choices.profileChoiceLabel('Morning', 'routine', translate(greek)), 'Πρωί');
  assert.equal(choices.normalizeProfileChoice('My own goal', 'goal'), 'My own goal');
  for (const key of choices.PROFILE_GOALS) {
    const value = choices.profileChoiceValue(key);
    assert.equal(choices.normalizeProfileChoice(greek.default.profileSetup[key], 'goal'), value);
    assert.equal(
      choices.profileChoiceLabel(value, 'goal', translate(greek)),
      greek.default.profileSetup[key],
    );
  }
});

const filterModel = load('lib/community-filters.ts');
test('community filter parameters are validated and applied before the feed limit without a paywall', async () => {
  const filters = filterModel.communityFilters({categories:'mindfulness,support,bogus,mindfulness', types:'story,unknown'});
  assert.equal(filters.categories.join(','),'mindfulness,support');
  assert.equal(filters.types.join(','),'story');
  assert.equal(filterModel.communityFilters({categories:['mindfulness']}).categories.length,0);
  const operations = [];
  const query = {
    select: () => query,
    eq: (column,value) => {operations.push(['eq',column,value]); return query;},
    in: (column,values) => {operations.push(['in',column,Array.from(values)]); return query;},
    order: (column) => {operations.push(['order',column]); return query;},
    limit: (count) => {operations.push(['limit',count]); return Promise.resolve({data:[],error:null});},
  };
  let config;
  const community = load('hooks/useCommunity.ts', {
    '@tanstack/react-query': {useQuery:(options) => {config=options; return options;}},
    '@/supabase/supabase': {supabase:{from:(table) => {assert.equal(table,'community_posts');return query;}}},
    './useUser': {useUser:() => ({data:{id:'free-user'}})},
    '@/lib/community-safety': {publishCommunityContent:() => {throw Error('Unexpected publish');}},
  });
  community.useCommunityFeed({categories:filters.categories,types:filters.types,sortBy:'recent'});
  await config.queryFn();
  assert.equal(config.enabled,true);
  assert.equal(JSON.stringify(operations), JSON.stringify([
    ['eq','is_hidden',false],['in','category',['mindfulness','support']],['in','post_type',['story']],
    ['order','created_at'],['limit',50],
  ]));
});
