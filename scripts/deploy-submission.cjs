const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const expectedRef = 'ufbhteewrbcvcqxdzsui';
const ref = fs.readFileSync('supabase/.temp/project-ref', 'utf8').trim();
if (ref !== expectedRef) throw new Error('Linked Supabase project does not match Inner Glow');
// This checkout lacks the remote baseline migrations. Do not replay the original
// subscriptions migrations with db push. Apply only these tested additions.
const additions = [
  ['20260314_recovery_codes.sql', '20261013170000'],
  ['20260407_revenuecat.sql', '20261013170001'],
  ['20261013_submission_billing.sql', '20261013170002'],
  ['20261014_community_safety.sql', '20261013170003'],
  ['20261015_account_deletion.sql', '20261013170004'],
  ['20261016_support_requests.sql', '20261013170005'],
  ['20261017_sandbox_trial_fix.sql', '20261013170006'],
];
let sql = 'BEGIN;\n';
for (const [file, version] of additions) {
  const body = fs.readFileSync(path.join('supabase/migrations', file), 'utf8');
  if (body.includes('$migration$') || body.includes('$apply$'))
    throw new Error('Unexpected SQL delimiter');
  const name = file.replace(/^[0-9]+_/, '').replace(/\.sql$/, '');
  sql += `DO $apply$ BEGIN IF NOT EXISTS(SELECT 1 FROM supabase_migrations.schema_migrations WHERE version='${version}') THEN\n`;
  sql += `EXECUTE $migration$${body}$migration$;\nINSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES('${version}','${name}',ARRAY[$migration$${body}$migration$]);\nEND IF; END $apply$;\n`;
}
sql += 'COMMIT;\n';
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'innerglow-migrations-'));
try {
  const filename = path.join(directory, 'submission.sql');
  fs.writeFileSync(filename, sql, { mode: 0o600 });
  const result = spawnSync(
    'node_modules/.bin/supabase',
    ['db', 'query', '--linked', '--file', filename],
    { encoding: 'utf8' },
  );
  if (result.status !== 0) {
    console.error(result.stderr, result.stdout);
    process.exitCode = 1;
  } else console.log('Inner Glow submission migrations applied atomically to the linked project.');
} finally {
  fs.rmSync(directory, { recursive: true, force: true });
}
