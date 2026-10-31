const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
function loadTS(file, mocks = {}, globals = {}) {
  const output = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const module = { exports: {} };
  const context = {
    module,
    exports: module.exports,
    require: (name) => {
      if (!(name in mocks)) throw new Error(`Unexpected dependency ${name}`);
      return mocks[name];
    },
    Date,
    Promise,
    Set,
    Map,
    Error,
    console,
    Request,
    Response,
    TextEncoder,
    Uint8Array,
    ...globals,
  };
  vm.runInNewContext(output, context, { filename: file });
  return module.exports;
}
const states = loadTS('lib/subscription-state.ts');
const backend = loadTS('supabase/functions/_shared/revenuecat.ts');
const now = Date.parse('2026-10-13T12:00:00Z');
const future = '2026-11-13T12:00:00Z';
const past = '2026-09-13T12:00:00Z';

test('canceling monthly subscriptions retain access until the paid period ends', () => {
  assert.equal(
    states.subscriptionHasAccess({ type: 'monthly', status: 'canceling', expiryDate: future }, now),
    true,
  );
  assert.equal(
    states.subscriptionHasAccess({ type: 'monthly', status: 'canceling', expiryDate: past }, now),
    false,
  );
  assert.equal(
    states.subscriptionHasAccess({ type: 'monthly', status: 'active', expiryDate: null }, now),
    false,
  );
  assert.equal(
    states.subscriptionHasAccess({ type: 'monthly', status: 'active', expiryDate: 'invalid' }, now),
    false,
  );
  assert.equal(states.subscriptionHasAccess({ type: 'lifetime', status: 'expired' }, now), false);
});

test('receipt mapping restores lifetime and refuses unrelated products', () => {
  const lifetime = states.subscriptionFromEntitlement({
    isActive: true,
    productIdentifier: 'innerglow_premium_lifetime',
    expirationDate: null,
    willRenew: false,
  });
  assert.equal(states.subscriptionHasAccess(lifetime, now), true);
  assert.equal(lifetime.type, 'lifetime');
  assert.equal(
    states.subscriptionFromEntitlement({
      isActive: false,
      productIdentifier: 'innerglow_premium_monthly',
      expirationDate: future,
      willRenew: true,
    }),
    null,
  );
  assert.equal(
    states.subscriptionFromEntitlement({
      isActive: true,
      productIdentifier: 'other',
      expirationDate: future,
      willRenew: true,
    }),
    null,
  );
});

test('server snapshots retain billing grace and distinguish sandbox from production', () => {
  const result = backend.subscriberState(
    {
      entitlements: {
        premium: { product_identifier: 'innerglow_premium_monthly', expires_date: past },
      },
      subscriptions: {
        innerglow_premium_monthly: {
          unsubscribe_detected_at: past,
          grace_period_expires_date: future,
          is_sandbox: true,
        },
      },
    },
    now,
  );
  assert.equal(result.status, 'canceling');
  assert.equal(result.current_period_end, future);
  assert.equal(result.environment, 'SANDBOX');
  assert.equal(
    backend.subscriberState(
      {
        entitlements: {
          other: { product_identifier: 'innerglow_premium_monthly', expires_date: future },
        },
      },
      now,
    ),
    null,
  );
});

test('transfer reconciliation identifies both previous and new UUID owners', () => {
  const a = '00000000-0000-4000-8000-000000000001',
    b = '00000000-0000-4000-8000-000000000002';
  assert.equal(
    JSON.stringify(
      backend.webhookUserIds({
        type: 'TRANSFER',
        transferred_from: [a, '$RCAnonymousID:old'],
        transferred_to: [b, a],
      }),
    ),
    JSON.stringify([a, b]),
  );
});

function hookHarness() {
  let user = 'account-a',
    row = { plan: 'trial', status: 'expired', trial_end: past, provider: 'trial' },
    info = null;
  const cache = new Map();
  const storage = {
    getItem: async (key) => cache.get(key) ?? null,
    setItem: async (key, value) => {
      cache.set(key, value);
    },
    removeItem: async (key) => {
      cache.delete(key);
    },
  };
  const supabase = {
    auth: { getSession: async () => ({ data: { session: user ? { user: { id: user } } : null } }) },
    from: () => ({
      select() {
        return this;
      },
      eq() {
        return this;
      },
      maybeSingle: async () => ({ data: row, error: null }),
    }),
  };
  const configure = Object.assign(async () => {}, { getCustomerInfo: async () => info });
  const create = (init) => {
    let state;
    const get = () => state,
      set = (patch) => {
        state = { ...state, ...patch };
      };
    state = init(set, get);
    const store = () => state;
    store.getState = get;
    store.setState = set;
    return store;
  };
  const hooks = loadTS('hooks/useSubscription.ts', {
    react: { useEffect: () => {}, useMemo: (fn) => fn() },
    'react-native': { Platform: { OS: 'ios' } },
    zustand: { create },
    '@react-native-async-storage/async-storage': storage,
    '@/supabase/supabase': { supabase },
    '@/lib/storage': { userScopedKey: (base, id) => `${base}:${id}` },
    '@/lib/revenuecat': {
      __esModule: true,
      default: configure,
      getCustomerInfo: configure.getCustomerInfo,
    },
    '@/lib/subscription-state': states,
    '@/lib/diagnostics': { recordDiagnostic: () => 'test-reference' },
  });
  return {
    hooks,
    cache,
    setUser: (value) => {
      user = value;
    },
    setRow: (value) => {
      row = value;
    },
    setInfo: (value) => {
      info = value;
    },
  };
}

test('purchase and restore unlock immediately while webhook database row is still expired', async () => {
  const h = hookHarness();
  h.setInfo({
    entitlements: {
      active: {
        premium: {
          isActive: true,
          productIdentifier: 'innerglow_premium_lifetime',
          expirationDate: null,
          willRenew: false,
        },
      },
    },
  });
  await h.hooks.refreshSubscription();
  assert.equal(h.hooks.useSubscription().hasFullAccess, true);
  assert.equal(h.hooks.useSubscription().isLifetime, true);
});

test('account switch and sign out cannot reuse another account premium cache', async () => {
  const h = hookHarness();
  h.cache.set('auth:subscription:v1', JSON.stringify({ type: 'lifetime', status: 'active' }));
  h.setInfo({
    entitlements: {
      active: {
        premium: {
          isActive: true,
          productIdentifier: 'innerglow_premium_lifetime',
          expirationDate: null,
          willRenew: false,
        },
      },
    },
  });
  await h.hooks.refreshSubscription();
  assert.equal(h.hooks.useSubscription().hasFullAccess, true);
  h.hooks.resetSubscription();
  h.setUser('account-b');
  h.setRow(null);
  h.setInfo({ entitlements: { active: {} } });
  await h.hooks.refreshSubscription();
  assert.equal(h.hooks.useSubscription().hasFullAccess, false);
  h.hooks.resetSubscription();
  h.setUser(null);
  await h.hooks.refreshSubscription();
  assert.equal(h.hooks.useSubscription().subscription, null);
});

function webhookHarness(rpcError = null) {
  let handler;
  const calls = [];
  const env = {
    REVENUECAT_WEBHOOK_AUTH: 'test-auth',
    REVENUECAT_SECRET_API_KEY: 'test-api',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service',
  };
  const sb = {
    auth: { admin: { getUserById: async (id) => ({ data: { user: { id } }, error: null }) } },
    rpc: async (name, args) => {
      calls.push(args);
      return { error: rpcError };
    },
  };
  loadTS(
    'supabase/functions/revenuecat-webhook/index.ts',
    {
      'https://esm.sh/@supabase/supabase-js@2.99.1': { createClient: () => sb },
      '../_shared/revenuecat.ts': backend,
    },
    {
      Deno: {
        env: { get: (key) => env[key] },
        serve: (fn) => {
          handler = fn;
        },
      },
      fetch: async () =>
        Response.json({
          subscriber: {
            entitlements: {
              premium: { product_identifier: 'innerglow_premium_lifetime', expires_date: null },
            },
            non_subscriptions: { innerglow_premium_lifetime: [{ is_sandbox: false }] },
          },
        }),
    },
  );
  return {
    calls,
    env,
    send: (event, authorization = 'Bearer test-auth') =>
      handler(
        new Request('https://example.test/webhook', {
          method: 'POST',
          headers: { authorization, 'Content-Type': 'application/json' },
          body: JSON.stringify({ event }),
        }),
      ),
  };
}
const event = {
  id: 'evt-1',
  type: 'INITIAL_PURCHASE',
  app_user_id: '00000000-0000-4000-8000-000000000001',
  entitlement_ids: ['premium'],
  environment: 'PRODUCTION',
};
test('webhook fails closed when its secret is missing or invalid', async () => {
  const h = webhookHarness();
  assert.equal((await h.send(event, 'wrong')).status, 401);
  delete h.env.REVENUECAT_WEBHOOK_AUTH;
  assert.equal((await h.send(event)).status, 503);
  assert.equal(h.calls.length, 0);
});
test('webhook returns retryable error when a database write fails', async () => {
  const h = webhookHarness({ message: 'database unavailable' });
  assert.equal((await h.send(event)).status, 500);
});
test('webhook excludes sandbox by default and reconciles both transfer owners', async () => {
  const h = webhookHarness();
  assert.equal((await h.send({ ...event, environment: 'SANDBOX' })).status, 200);
  assert.equal(h.calls.length, 0);
  assert.equal(
    (
      await h.send({
        ...event,
        type: 'TRANSFER',
        transferred_from: [event.app_user_id],
        transferred_to: ['00000000-0000-4000-8000-000000000002'],
      })
    ).status,
    200,
  );
  assert.equal(h.calls.length, 2);
});

const products = loadTS('lib/purchase-products.ts');
test('monthly package cannot silently charge a yearly or unrelated product', () => {
  assert.equal(
    products.productMatchesPlan('monthly', {
      identifier: 'innerglow_premium_monthly',
      subscriptionPeriod: 'P1M',
    }),
    true,
  );
  assert.equal(
    products.productMatchesPlan('monthly', {
      identifier: 'innerglow_premium_monthly',
      subscriptionPeriod: 'P1Y',
    }),
    false,
  );
  assert.equal(
    products.productMatchesPlan('monthly', { identifier: 'monthly', subscriptionPeriod: 'P1M' }),
    false,
  );
});
test('RevenueCat identity changes finish before fetching products for the next account', async () => {
  let sdkUser,
    finishLogin,
    offeringRead = false;
  const loginGate = new Promise((resolve) => {
    finishLogin = resolve;
  });
  const sdk = {
    configure: ({ appUserID }) => {
      sdkUser = appUserID;
    },
    setLogLevel: () => {},
    isAnonymous: async () => false,
    logIn: async (id) => {
      await loginGate;
      sdkUser = id;
    },
    logOut: async () => {
      sdkUser = null;
    },
    getOfferings: async () => {
      offeringRead = true;
      return { all: { default: { identifier: 'default', owner: sdkUser } } };
    },
  };
  const rc = loadTS(
    'lib/revenuecat.ts',
    {
      '@/lib/purchase-products': products,
      'react-native': { Platform: { OS: 'ios' } },
      'react-native-purchases': {
        __esModule: true,
        default: sdk,
        LOG_LEVEL: { DEBUG: 1 },
        PURCHASES_ERROR_CODE: { PURCHASE_CANCELLED_ERROR: 1 },
      },
    },
    {
      __DEV__: false,
      process: { env: { EXPO_PUBLIC_REVENUECAT_IOS_KEY: 'appl_test_for_unit_tests' } },
    },
  );
  await rc.default('account-a');
  const identify = rc.default('account-b');
  const getOffering = rc.getDefaultOffering();
  await Promise.resolve();
  assert.equal(offeringRead, false);
  finishLogin();
  await identify;
  assert.equal((await getOffering).owner, 'account-b');
});

test('native billing grace proof is temporary rather than a permanent cached entitlement', () => {
  assert.equal(
    states.subscriptionHasAccess(
      { type: 'monthly', status: 'active', expiryDate: past, storeVerifiedUntil: now + 60000 },
      now,
    ),
    true,
  );
  assert.equal(
    states.subscriptionHasAccess(
      { type: 'monthly', status: 'active', expiryDate: past, storeVerifiedUntil: now + 60000 },
      now + 60001,
    ),
    false,
  );
});
test('paid AI endpoints reject accounts without access and verify new receipts before delayed webhooks', async () => {
  let row = null;
  let snapshot = null;
  let writes = 0;
  const sb = {
    auth: { getUser: async () => ({ data: { user: { id: event.app_user_id } }, error: null }) },
    from: () => ({
      select() {
        return this;
      },
      eq() {
        return this;
      },
      maybeSingle: async () => ({ data: row, error: null }),
    }),
    rpc: async () => {
      writes++;
      return { error: null };
    },
  };
  const auth = loadTS(
    'supabase/functions/_shared/auth.ts',
    {
      'https://esm.sh/@supabase/supabase-js@2.99.1': { createClient: () => sb },
      './revenuecat.ts': backend,
    },
    {
      Deno: {
        env: {
          get: (key) =>
            ({
              SUPABASE_URL: 'https://example.test',
              SUPABASE_SERVICE_ROLE_KEY: 'test-service',
              REVENUECAT_SECRET_API_KEY: 'test-api',
            })[key],
        },
      },
      fetch: async () => Response.json({ subscriber: snapshot }),
    },
  );
  const request = new Request('https://example.test/chat', {
    headers: { authorization: 'Bearer test-user' },
  });
  assert.equal((await auth.authenticationError(request, {})).status, 403);
  row = {
    plan: 'trial',
    status: 'active',
    trial_end: new Date(Date.now() + 86400000).toISOString(),
  };
  assert.equal(await auth.authenticationError(request, {}), null);
  row = null;
  snapshot = {
    entitlements: {
      premium: { product_identifier: 'innerglow_premium_lifetime', expires_date: null },
    },
    non_subscriptions: { innerglow_premium_lifetime: [{ is_sandbox: false }] },
  };
  assert.equal(await auth.authenticationError(request, {}), null);
  assert.equal(writes, 1);
});

test('refunded subscriptions cannot retain a remaining grace period', () => {
  const state = backend.subscriberState(
    {
      entitlements: {
        premium: { product_identifier: 'innerglow_premium_monthly', expires_date: future },
      },
      subscriptions: {
        innerglow_premium_monthly: {
          refunded_at: past,
          grace_period_expires_date: future,
          is_sandbox: false,
        },
      },
    },
    now,
  );
  assert.equal(state.status, 'expired');
});

test('creating Stripe checkout returns its URL without overwriting existing paid or trial access', async () => {
  let handler,
    writes = 0;
  const sb = {
    auth: { getUser: async () => ({ data: { user: { id: 'test-user' } }, error: null }) },
    from: () => ({
      select() {
        return this;
      },
      eq() {
        return this;
      },
      maybeSingle: async () => ({ data: { plan: 'trial', status: 'active' }, error: null }),
      upsert: () => {
        writes++;
        return { then: (resolve) => resolve({ error: null }) };
      },
    }),
  };
  loadTS(
    'supabase/functions/stripe-checkout/index.ts',
    {
      'https://deno.land/std@0.168.0/http/server.ts': {
        serve: (fn) => {
          handler = fn;
        },
      },
      'https://esm.sh/@supabase/supabase-js@2.39.0': { createClient: () => sb },
    },
    {
      Deno: {
        env: {
          get: (key) =>
            ({
              STRIPE_SECRET_KEY: 'sk_test_fixture',
              SUPABASE_URL: 'https://test.supabase.co',
              SUPABASE_SERVICE_ROLE_KEY: 'test',
            })[key],
        },
      },
      URL,
      URLSearchParams,
      fetch: async () =>
        Response.json({ id: 'cs_test_fixture', url: 'https://checkout.stripe.com/test' }),
    },
  );
  const response = await handler(
    new Request('https://test/checkout', {
      method: 'POST',
      headers: { Authorization: 'Bearer test', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan: 'monthly',
        userId: 'test-user',
        successUrl: 'http://localhost:8082/payment-success',
        cancelUrl: 'http://localhost:8082/payment-failure',
      }),
    }),
  );
  assert.equal(response.status, 200);
  assert.equal((await response.json()).url, 'https://checkout.stripe.com/test');
  assert.equal(writes, 0, 'Starting checkout must preserve existing access until verified payment');
});

test('AI access errors retain the backend reason instead of the generic function failure', async () => {
  const ai = loadTS('lib/chat.ts', {
    '@/lib/ai-privacy': {
      invokeAI: async () => ({
        data: null,
        error: {
          message: 'Edge Function returned a non-2xx status code',
          context: Response.json(
            { error: 'An active trial or premium purchase is required.' },
            { status: 403 },
          ),
        },
      }),
    },
    '@/supabase/supabase': { supabase: {} },
    '@/lib/citations': { extractCitations: () => [] },
    '@/lib/function-errors': loadTS('lib/function-errors.ts', {
      '@/lib/diagnostics': { recordDiagnostic: () => 'test-reference' },
      './diagnostic-events': loadTS('lib/diagnostic-events.ts'),
    }),
  });
  await assert.rejects(
    ai.sendChatToAI('General', [], [{ role: 'user', content: 'Hello' }]),
    /active trial or premium purchase/,
  );
});

test('Stripe webhook refuses unsigned events before changing access', async () => {
  let handler;
  loadTS(
    'supabase/functions/stripe-webhook/index.ts',
    {
      'https://deno.land/std@0.168.0/http/server.ts': {
        serve: (fn) => {
          handler = fn;
        },
      },
      'https://esm.sh/@supabase/supabase-js@2.39.0': {
        createClient: () => {
          throw Error('Unsigned request reached database');
        },
      },
      'https://deno.land/std@0.168.0/crypto/mod.ts': { crypto: require('node:crypto').webcrypto },
    },
    {
      Deno: {
        env: {
          get: (key) =>
            ({ STRIPE_SECRET_KEY: 'sk_test_fixture', STRIPE_WEBHOOK_SECRET: 'whsec_fixture' })[key],
        },
      },
    },
  );
  const response = await handler(
    new Request('https://test/webhook', {
      method: 'POST',
      body: JSON.stringify({ type: 'checkout.session.completed', data: { object: {} } }),
    }),
  );
  assert.equal(response.status, 400);
});

function managementHarness(subscription) {
  let handler, requestedCustomer;
  const sb = {
    auth: { getUser: async () => ({ data: { user: { id: 'owner' } }, error: null }) },
    from: () => ({
      select() {
        return this;
      },
      eq(_column, id) {
        assert.equal(id, 'owner');
        return this;
      },
      maybeSingle: async () => ({ data: subscription, error: null }),
    }),
  };
  loadTS(
    'supabase/functions/subscription-management/index.ts',
    {
      'https://esm.sh/@supabase/supabase-js@2.99.1': { createClient: () => sb },
    },
    {
      Deno: {
        serve: (fn) => {
          handler = fn;
        },
        env: { get: () => 'fixture' },
      },
      URL,
      URLSearchParams,
      fetch: async (_url, options) => {
        requestedCustomer = options.body.get('customer');
        return Response.json({ url: 'https://billing.stripe.com/p/session/fixture' });
      },
    },
  );
  return {
    send: (body = {}, token = 'Bearer fixture') =>
      handler(
        new Request('https://example.test/manage', {
          method: 'POST',
          headers: { authorization: token, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
      ),
    customer: () => requestedCustomer,
  };
}
test('Apple-billed web accounts receive Apple management, never a Stripe checkout', async () => {
  const h = managementHarness({ provider: 'revenuecat', store: 'app_store' });
  const r = await h.send();
  assert.equal(r.status, 200);
  assert.equal((await r.json()).url, 'https://apps.apple.com/account/subscriptions');
  assert.equal(h.customer(), undefined);
});
test('Stripe management uses the authenticated account customer and rejects foreign return addresses', async () => {
  const h = managementHarness({ provider: 'stripe', stripe_customer_id: 'cus_owner' });
  assert.equal(
    (await h.send({ returnUrl: 'https://attacker.example/profile', customer: 'cus_other' })).status,
    400,
  );
  assert.equal(h.customer(), undefined);
  const r = await h.send({ returnUrl: 'http://localhost:8082/profile', customer: 'cus_other' });
  assert.equal(r.status, 200);
  assert.equal(h.customer(), 'cus_owner');
  assert.equal((await h.send({}, '')).status, 401);
});
test('web subscription management follows its provider URL without returning to the paywall', async () => {
  let destination;
  const management = loadTS(
    'lib/billing-management.ts',
    {
      'react-native': { Platform: { OS: 'web' }, Linking: {} },
      '@/supabase/supabase': {
        supabase: {
          functions: {
            invoke: async (name) => {
              assert.equal(name, 'subscription-management');
              return { data: { url: 'https://apps.apple.com/account/subscriptions' }, error: null };
            },
          },
        },
      },
      '@/lib/function-errors': loadTS('lib/function-errors.ts', {
        '@/lib/diagnostics': { recordDiagnostic: () => 'test-reference' },
        './diagnostic-events': loadTS('lib/diagnostic-events.ts'),
      }),
    },
    {
      URL,
      window: {
        location: {
          origin: 'http://localhost:8082',
          assign: (url) => {
            destination = url;
          },
        },
      },
    },
  );
  await management.openSubscriptionManagement();
  assert.equal(destination, 'https://apps.apple.com/account/subscriptions');
});
test('Stripe refuses duplicate access before creating any checkout session', async () => {
  let handler,
    calledStripe = false;
  const sb = {
    auth: { getUser: async () => ({ data: { user: { id: 'owner' } }, error: null }) },
    from: () => ({
      select() {
        return this;
      },
      eq() {
        return this;
      },
      maybeSingle: async () => ({
        data: {
          plan: 'monthly',
          status: 'active',
          current_period_end: new Date(Date.now() + 86400000).toISOString(),
        },
        error: null,
      }),
    }),
  };
  loadTS(
    'supabase/functions/stripe-checkout/index.ts',
    {
      'https://deno.land/std@0.168.0/http/server.ts': {
        serve: (fn) => {
          handler = fn;
        },
      },
      'https://esm.sh/@supabase/supabase-js@2.39.0': { createClient: () => sb },
    },
    {
      Deno: { env: { get: () => 'fixture' } },
      URL,
      URLSearchParams,
      fetch: async () => {
        calledStripe = true;
        return Response.json({});
      },
    },
  );
  const r = await handler(
    new Request('https://example.test/checkout', {
      method: 'POST',
      headers: { authorization: 'Bearer fixture', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan: 'monthly',
        successUrl: 'http://localhost:8082/payment-success',
        cancelUrl: 'http://localhost:8082/payment-failure',
      }),
    }),
  );
  assert.equal(r.status, 409);
  assert.equal(calledStripe, false);
});

test('verified receipt publication rejects a purchase from another account', async () => {
  const h = hookHarness();
  h.setUser('account-b');
  await h.hooks.refreshSubscription();
  await h.hooks.applyPurchaseInfo(
    {
      entitlements: {
        active: {
          premium: {
            isActive: true,
            productIdentifier: 'innerglow_premium_lifetime',
            expirationDate: null,
            willRenew: false,
          },
        },
      },
    },
    'account-a',
  );
  assert.equal(h.hooks.useSubscription().hasFullAccess, false);
});
test('malformed and expired subscription caches never grant access', () => {
  for (const raw of [
    'null',
    '{broken',
    JSON.stringify({ type: 'invented', status: 'active', expiryDate: future }),
    JSON.stringify({ type: 'monthly', status: 'active' }),
  ])
    assert.equal(states.parseSubscriptionCache(raw), null);
  assert.equal(
    states.subscriptionHasAccess(
      states.parseSubscriptionCache(
        JSON.stringify({ type: 'monthly', status: 'active', expiryDate: past }),
      ),
      now,
    ),
    false,
  );
});
test('diagnostic projection strips private application content and rejects arbitrary codes', () => {
  const d = loadTS('lib/diagnostic-events.ts');
  const safe = d.safeDiagnostic({
    event: 'service_failure',
    code: 'NETWORK',
    reference: 'test-reference',
    platform: 'ios',
    release: '1.0.0 (19)',
    email: 'private@example.com',
    message: 'private journal',
    token: 'secret',
  });
  assert.equal(JSON.stringify(safe).includes('private'), false);
  assert.equal(JSON.stringify(safe).includes('secret'), false);
  assert.equal(
    d.safeDiagnostic({
      event: 'service_failure',
      code: 'private journal',
      reference: 'test-reference',
    }),
    null,
  );
  assert.equal(d.serviceCode(401), 'AUTH_REQUIRED');
  assert.equal(d.serviceCode(429), 'RATE_LIMITED');
});

test('a delayed verification cannot overwrite a newer successful receipt', async () => {
  const h = hookHarness();
  let resolve;
  h.setInfo(
    new Promise((r) => {
      resolve = r;
    }),
  );
  const pending = h.hooks.refreshSubscription();
  await new Promise(setImmediate);
  await h.hooks.applyPurchaseInfo(
    {
      entitlements: {
        active: {
          premium: {
            isActive: true,
            productIdentifier: 'innerglow_premium_lifetime',
            expirationDate: null,
            willRenew: false,
          },
        },
      },
    },
    'account-a',
  );
  resolve({ entitlements: { active: {} } });
  await pending;
  assert.equal(h.hooks.useSubscription().isLifetime, true);
});
test('receipt network failure preserves existing unexpired verified access', async () => {
  const h = hookHarness();
  await h.hooks.applyPurchaseInfo(
    {
      entitlements: {
        active: {
          premium: {
            isActive: true,
            productIdentifier: 'innerglow_premium_lifetime',
            expirationDate: null,
            willRenew: false,
          },
        },
      },
    },
    'account-a',
  );
  h.setInfo(null);
  await h.hooks.refreshSubscription();
  assert.equal(h.hooks.useSubscription().isLifetime, true);
  assert.ok(h.hooks.useSubscription().error);
});

test('native purchase preflight reuses active receipts and reconciles Apple already-purchased responses', async () => {
  const monthly = {
    entitlements: {
      active: {
        premium: {
          isActive: true,
          productIdentifier: products.PRODUCT_IDS.monthly,
          expirationDate: future,
          willRenew: true,
        },
      },
    },
  };
  const lifetime = {
    entitlements: {
      active: {
        premium: {
          isActive: true,
          productIdentifier: products.PRODUCT_IDS.lifetime,
          expirationDate: null,
          willRenew: false,
        },
      },
    },
  };
  let info = monthly,
    purchased = 0,
    restores = 0,
    invalidated = 0,
    failure = null;
  const sdk = {
    configure: () => {},
    invalidateCustomerInfoCache: async () => {
      invalidated++;
    },
    getCustomerInfo: async () => info,
    getOfferings: async () => ({
      all: {
        default: {
          identifier: 'default',
          availablePackages: [
            {
              identifier: '$rc_monthly',
              product: { identifier: products.PRODUCT_IDS.monthly, subscriptionPeriod: 'P1M' },
            },
            { identifier: '$rc_lifetime', product: { identifier: products.PRODUCT_IDS.lifetime } },
          ],
        },
      },
    }),
    purchasePackage: async () => {
      purchased++;
      if (failure) throw failure;
      return { customerInfo: lifetime };
    },
    restorePurchases: async () => {
      restores++;
      return monthly;
    },
  };
  const rc = loadTS(
    'lib/revenuecat.ts',
    {
      '@/lib/purchase-products': products,
      'react-native': { Platform: { OS: 'ios' } },
      'react-native-purchases': {
        __esModule: true,
        default: sdk,
        LOG_LEVEL: { DEBUG: 1 },
        PURCHASES_ERROR_CODE: {
          PURCHASE_CANCELLED_ERROR: '1',
          PRODUCT_ALREADY_PURCHASED_ERROR: '6',
        },
      },
    },
    { __DEV__: false, process: { env: { EXPO_PUBLIC_REVENUECAT_IOS_KEY: 'appl_test' } } },
  );
  await rc.default('account-a');
  assert.equal(await rc.purchasePlan('monthly'), monthly);
  assert.equal(purchased, 0);
  info = lifetime;
  assert.equal(await rc.purchasePlan('monthly'), lifetime);
  assert.equal(await rc.purchasePlan('lifetime'), lifetime);
  assert.equal(purchased, 0);
  info = monthly;
  assert.equal(await rc.purchasePlan('lifetime'), lifetime);
  assert.equal(purchased, 1);
  info = { entitlements: { active: {} } };
  failure = { code: '6' };
  assert.equal(await rc.purchasePlan('monthly'), monthly);
  assert.equal(restores, 1);
  assert.equal(invalidated, 5);
  failure = { code: 'network' };
  await assert.rejects(rc.purchasePlan('monthly'));
});
