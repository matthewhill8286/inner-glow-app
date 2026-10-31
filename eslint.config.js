// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    files: ['scripts/**/*.cjs', 'tests/**/*.cjs'],
    languageOptions: { globals: require('globals').node },
    rules: { 'expo/no-dynamic-env-var': 'off' },
  },
  {
    ignores: ['dist/*', 'app-example/*', 'supabase/functions/**'],
  },
]);
