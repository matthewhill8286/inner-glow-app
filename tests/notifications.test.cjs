const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function pure(file){const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:m,exports:m.exports,Array,Number,String});return m.exports;}
const schedule=pure('lib/reminder-schedule.ts');
function load(os, notifications, storage=new Map()) {
 const module={exports:{}};
 const mocks={
  'react-native':{Platform:{OS:os}},'expo-device':{isDevice:true},'expo-notifications':notifications,
  '@react-native-async-storage/async-storage':{default:{getItem:async k=>storage.get(k)||null,setItem:async(k,v)=>storage.set(k,v),removeItem:async k=>storage.delete(k)}},
  './reminder-schedule':schedule,
 };
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/notifications.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,require:n=>mocks[n],console,Date,Set,Map,Error});
 return module.exports;
}
test('web notification actions never call unsupported native methods', async()=>{
 const unexpected=async()=>{throw Error('Native notification API called on web')};
 const api=load('web',{getPermissionsAsync:unexpected,requestPermissionsAsync:unexpected,scheduleNotificationAsync:unexpected,cancelScheduledNotificationAsync:unexpected});
 await api.registerForPushNotificationsAsync();
 await api.scheduleNotification('Test','Test');
 await api.cancelBedtimeReminders();await api.cancelWakeUpAlarms();
 await api.scheduleBedtimeReminders({sleepHour:0,sleepMin:15,selectedDays:['Mon']});
 await api.scheduleWakeUpAlarms({wakeHour:23,wakeMin:58,selectedDays:['Sun'],snoozeCount:1});
});
test('midnight bedtime reminders and snoozes use the correct adjacent weekday',async()=>{
 const requests=[];
 const api=load('ios',{
  getPermissionsAsync:async()=>({status:'granted'}),
  scheduleNotificationAsync:async req=>{requests.push(req);return String(requests.length)},
  cancelScheduledNotificationAsync:async()=>{},
  SchedulableTriggerInputTypes:{WEEKLY:'weekly'},AndroidNotificationPriority:{MAX:'max'},
 });
 await api.scheduleBedtimeReminders({sleepHour:0,sleepMin:15,selectedDays:['Mon']});
 await api.scheduleWakeUpAlarms({wakeHour:23,wakeMin:58,selectedDays:['Sun'],snoozeCount:1});
 assert.equal(requests[0].trigger.weekday,1);assert.equal(requests[0].trigger.hour,23);assert.equal(requests[0].trigger.minute,45);
 assert.equal(requests[2].trigger.weekday,2);assert.equal(requests[2].trigger.hour,0);assert.equal(requests[2].trigger.minute,3);
});
test('enabled reminders persist and turning them off cancels the scheduled notification',async()=>{
 const requests=[], canceled=[],storage=new Map();
 const api=load('ios',{
  getPermissionsAsync:async()=>({status:'granted'}),
  scheduleNotificationAsync:async req=>{requests.push(req);return 'reminder-1'},
  cancelScheduledNotificationAsync:async id=>canceled.push(id),
  SchedulableTriggerInputTypes:{DAILY:'daily',WEEKLY:'weekly'},
 },storage);
 await api.setReminderEnabled('daily_checkin',true);
 assert.equal((await api.loadReminderPreferences()).daily_checkin,true);
 assert.equal(requests[0].trigger.hour,20);
 assert.equal(requests[0].content.data.route,'/(tabs)/mood/check-in');
 await api.setReminderEnabled('daily_checkin',false);
 assert.equal((await api.loadReminderPreferences()).daily_checkin,false);
 assert.deepEqual(canceled,['reminder-1']);
});
test('the daily check-in uses the time chosen in profile setup and keeps it for later toggles',async()=>{
 const requests=[],storage=new Map();
 const api=load('ios',{
  getPermissionsAsync:async()=>({status:'granted'}),
  scheduleNotificationAsync:async req=>{requests.push(req);return 'reminder-'+requests.length},
  cancelScheduledNotificationAsync:async()=>{},
  SchedulableTriggerInputTypes:{DAILY:'daily',WEEKLY:'weekly'},
 },storage);
 await api.setReminderEnabled('daily_checkin',true,{hour:8,minute:30});
 assert.equal(requests[0].trigger.hour,8);assert.equal(requests[0].trigger.minute,30);
 await api.setReminderEnabled('daily_checkin',false);
 await api.setReminderEnabled('daily_checkin',true);
 assert.equal(requests[1].trigger.hour,8);assert.equal(requests[1].trigger.minute,30);
});
test('foreground notifications show a banner and denied permission fails clearly',async()=>{
 let handler;
 const api=load('ios',{
  setNotificationHandler:value=>{handler=value},
  getPermissionsAsync:async()=>({status:'denied'}), requestPermissionsAsync:async()=>({status:'denied'}),
  IosAuthorizationStatus:{PROVISIONAL:3},
 });
 api.configureNotificationPresentation();
 assert.equal((await handler.handleNotification()).shouldShowBanner,true);
 await assert.rejects(api.scheduleNotification('Test','Test'),/Notifications are disabled/);
});

test('failed bedtime replacement preserves the previous schedule and removes partial replacements', async()=>{
 const storage=new Map([['bedtime-notification-ids',JSON.stringify(['previous'])]]), canceled=[];
 let attempt=0;
 const api=load('ios',{
  getPermissionsAsync:async()=>({status:'granted'}),
  scheduleNotificationAsync:async()=>{if (++attempt===2) throw Error('System limit');return 'replacement'},
  cancelScheduledNotificationAsync:async id=>canceled.push(id),
  SchedulableTriggerInputTypes:{WEEKLY:'weekly'},
 },storage);
 await assert.rejects(api.scheduleBedtimeReminders({sleepHour:22,sleepMin:0,selectedDays:['Mon','Tue']}));
 assert.deepEqual(JSON.parse(storage.get('bedtime-notification-ids')),['previous']);
 assert.deepEqual(canceled,['replacement']);
});
test('failed reminder replacement retains its existing persisted and scheduled reminder',async()=>{
 const storage=new Map([['notification-preferences:v1',JSON.stringify({daily_checkin:{enabled:true,id:'previous'}})]]), canceled=[];
 const api=load('ios',{
  getPermissionsAsync:async()=>({status:'granted'}),
  scheduleNotificationAsync:async()=>{throw Error('System limit')},
  cancelScheduledNotificationAsync:async id=>canceled.push(id),
  SchedulableTriggerInputTypes:{DAILY:'daily',WEEKLY:'weekly'},
 },storage);
 await assert.rejects(api.setReminderEnabled('daily_checkin',true));
 assert.equal((await api.loadReminderPreferences()).daily_checkin,true);
 assert.deepEqual(canceled,[]);
});
