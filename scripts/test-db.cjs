const { spawnSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const container = `innerglow-tests-${process.pid}`;
function run(args, input) {
  const result = spawnSync('docker', args, { input, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  return result.stdout;
}
try {
  run([
    'run',
    '--detach',
    '--rm',
    '--name',
    container,
    '-e',
    'POSTGRES_HOST_AUTH_METHOD=trust',
    'postgres:17',
  ]);
  // Wait for the isolated test database, never touching the hosted project.
  for (let attempt = 0; attempt < 60; attempt++) {
    const r = spawnSync('docker', ['exec', container, 'pg_isready', '-U', 'postgres'], {
      encoding: 'utf8',
    });
    if (r.status === 0) break;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250);
  }
  const files = [
    'tests/fixtures/schema.sql',
    'supabase/migrations/20260314_recovery_codes.sql',
    'supabase/migrations/20260407_revenuecat.sql',
    'supabase/migrations/20261013_submission_billing.sql',
    'supabase/migrations/20261014_community_safety.sql',
    'supabase/migrations/20261015_account_deletion.sql',
    'supabase/migrations/20261016_support_requests.sql',
    'supabase/migrations/20261101_sleep_source_stages.sql',
    'tests/submission.sql',
    'tests/sleep-stages.sql',
  ];
  for (const file of files)
    run(
      ['exec', '-i', container, 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1'],
      readFileSync(file, 'utf8'),
    );
  console.log(
    'Database regressions passed: trial abuse, billing snapshots, cancellation, sandbox isolation, blocking, reports, account deletion, and sleep stage ownership.',
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  spawnSync('docker', ['stop', container], { stdio: 'ignore' });
}
