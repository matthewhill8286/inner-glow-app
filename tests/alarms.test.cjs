const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(os, native) {
  const module = { exports: {} }, calls=[];
  const mocks = {
    'react-native': { Platform: { OS: os } },
    'expo-modules-core': { requireOptionalNativeModule: () => native },
    '@/lib/notifications': { cancelWakeUpAlarms: async () => calls.push('retire-old-notifications') },
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/alarms.ts','utf8'),
    { compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022} }).outputText,
    {module,exports:module.exports,require:name=>mocks[name],Set,Error});
  return {api:module.exports,calls};
}
test('web and older builds cannot silently claim a notification is a ringing alarm',async()=>{
  for (const os of ['web','ios']) {
    const {api}=load(os,null);
    assert.equal(api.ringingAlarmsSupported(),false);
    await assert.rejects(api.saveWakeAlarm({enabled:true,wakeHour:7,wakeMin:30,selectedDays:['Mon']}),/updated iPhone app/);
    await assert.rejects(api.testWakeAlarm(),/iOS 26/);
  }
});
test('native alarm uses repeat days once and retires old notification bursts only after scheduling succeeds',async()=>{
  const nativeCalls=[];
  const {api,calls}=load('ios',{isSupported:()=>true,schedule:async(h,m,d)=>nativeCalls.push([h,m,Array.from(d)])});
  await api.saveWakeAlarm({enabled:true,wakeHour:7,wakeMin:30,selectedDays:['Sun','Mon','Mon']});
  assert.deepEqual(nativeCalls,[[7,30,[1,2]]]);
  assert.deepEqual(calls,['retire-old-notifications']);
});
test('denied native alarm permission preserves the previous scheduled reminders',async()=>{
  const {api,calls}=load('ios',{isSupported:()=>true,schedule:async()=>{throw Error('Alarms are disabled')}});
  await assert.rejects(api.saveWakeAlarm({enabled:true,wakeHour:7,wakeMin:0,selectedDays:['Mon']}),/Alarms are disabled/);
  assert.deepEqual(calls,[]);
});
test('turning off the alarm cancels the native alarm and all legacy wake-up notifications',async()=>{
  let canceled=false;
  const {api,calls}=load('ios',{cancel:async()=>{canceled=true}});
  await api.saveWakeAlarm({enabled:false,wakeHour:7,wakeMin:0,selectedDays:[]});
  assert.equal(canceled,true);
  assert.deepEqual(calls,['retire-old-notifications']);
});
