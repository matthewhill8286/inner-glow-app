const fs = require('node:fs');
const { load } = require('@expo/env');
load(process.cwd());
const app = JSON.parse(fs.readFileSync('app.json', 'utf8')).expo;
const errors = [];
function requireValue(key, check) {
  const value = process.env[key];
  if (!value || /xxx|placeholder|your[-_]/i.test(value) || (check && !check(value)))
    errors.push(`${key} is missing or invalid`);
}
requireValue('EXPO_PUBLIC_REVENUECAT_IOS_KEY', (value) => value.startsWith('appl_'));
requireValue(
  'EXPO_PUBLIC_SUPABASE_URL',
  (value) => value.startsWith('https://') && value.endsWith('.supabase.co'),
);
requireValue('EXPO_PUBLIC_SUPABASE_KEY', (value) => {
  if (value.startsWith('sb_publishable_')) return true;
  try {
    return JSON.parse(Buffer.from(value.split('.')[1], 'base64url').toString()).role === 'anon';
  } catch {
    return false;
  }
});
if (app.ios.bundleIdentifier !== 'com.innerglowai.app')
  errors.push('iOS bundle identifier does not match the configured app');
if (app.updates.url !== `https://u.expo.dev/${app.extra.eas.projectId}`)
  errors.push('Expo update URL does not match the EAS project');
if (!app.ios.infoPlist.NSMicrophoneUsageDescription)
  errors.push('Microphone purpose description is missing');
for (const name of ['EXPO_PUBLIC_OPENAI_API_KEY', 'EXPO_PUBLIC_JWT_SECRET']) {
  if (process.env[name])
    console.warn(
      `${name} is unnecessary. Remove it from production EAS environments; server keys belong in Supabase secrets.`,
    );
}
if (errors.length) {
  console.error(
    'Submission configuration incomplete:\n' + errors.map((error) => `- ${error}`).join('\n'),
  );
  process.exitCode = 1;
} else
  console.log(
    'Submission build configuration passed. Complete the physical-device purchase checklist before App Review.',
  );
