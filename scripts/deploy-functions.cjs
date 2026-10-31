const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const ref = 'ufbhteewrbcvcqxdzsui';
if (fs.readFileSync('supabase/.temp/project-ref', 'utf8').trim() !== ref) {
  throw new Error('Linked Supabase project does not match Inner Glow');
}
for (const name of [
  'chat',
  'mood-insights',
  'sleep-insights',
  'generate-suggestions',
  'transcribe-audio',
  'revenuecat-webhook',
  'delete-account',
  'community-publish',
  'contact-support',
  'client-diagnostics',
]) {
  // Authenticated functions validate the user's JWT in code. The public support
  // function validates input/rate limits; the webhook validates its shared token.
  const result = spawnSync(
    'node_modules/.bin/supabase',
    ['functions', 'deploy', name, '--no-verify-jwt', '--use-api', '--project-ref', ref],
    { encoding: 'utf8' },
  );
  if (result.status !== 0) {
    console.error(result.stderr, result.stdout);
    process.exit(1);
  }
  console.log(`${name} deployed`);
}
