const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
function gateHarness(initial) {
  let authCallback, effect, current = initial;
  const transitions = [];
  const module = { exports:{} };
  const mocks = {
    '@/lib/startup': {withStartupDeadline:async (task) => task},
    'react': {
      useState:() => ['loading',(next) => transitions.push(next)],
      useRef:(value) => ({current:value}),
      useEffect:(fn) => {effect=fn;},
    },
    'react/jsx-runtime': {jsx:() => null,jsxs:() => null},
    'react-native': {},
    'expo-router': {},
    '@/supabase/supabase': {supabase:{auth:{
      getSession:async () => ({data:{session:current},error:null}),
      mfa:{getAuthenticatorAssuranceLevel:async () => ({data:{currentLevel:'aal1',nextLevel:'aal1'},error:null})},
      onAuthStateChange:(callback) => {authCallback=callback;return {data:{subscription:{unsubscribe:()=>{}}}};},
    }}},
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('components/SessionGate.tsx','utf8'),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX},
  }).outputText,{module,exports:module.exports,require:n=>mocks[n],setTimeout,clearTimeout});
  module.exports.SessionGate({children:null});
  const cleanup = effect();
  return {transitions,cleanup,event:(event,session)=>{current=session;authCallback(event,session);}};
}
const settle = () => new Promise(resolve=>setTimeout(resolve,10));
test('same-user auth refresh preserves mounted feature history; account changes recheck the gate', async () => {
  const account = {user:{id:'account-a'}};
  const gate = gateHarness(account);
  await settle();
  assert.deepEqual(gate.transitions,['ready']);
  gate.event('TOKEN_REFRESHED',account);
  await settle();
  assert.deepEqual(gate.transitions,['ready','ready']);
  gate.event('SIGNED_OUT',null);
  await settle();
  assert.deepEqual(gate.transitions,['ready','ready','loading','sign-in']);
  gate.cleanup();
});
