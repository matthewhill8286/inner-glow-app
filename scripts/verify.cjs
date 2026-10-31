const { spawnSync } = require('node:child_process');
const path = require('node:path');
process.env.EXPO_ROUTER_APP_ROOT = path.resolve('app');
require('expo-router/build/typed-routes').regenerateDeclarations(path.resolve('.expo/types'));
setTimeout(() => {
  for (const [command, args] of [
    ['node', ['node_modules/typescript/bin/tsc', '--noEmit']],
    ['node', ['node_modules/eslint/bin/eslint.js', '.', '--quiet']],
    [
      'node',
      [
        '--test',
        'tests/payments.test.cjs',
        'tests/navigation.test.cjs',
        'tests/conversation-flow.test.cjs',
        'tests/notifications.test.cjs',
        'tests/alarms.test.cjs',
        'tests/activity-notifications.test.cjs',
      ],
    ],
  ]) {
    const result = spawnSync(command, args, { stdio: 'inherit' });
    if (result.status !== 0) {
      process.exitCode = result.status || 1;
      return;
    }
  }
}, 1500);
