const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
// Environment files are configuration inputs, never application modules.
const existing = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(existing) ? existing : existing ? [existing] : []),
  /[/\\]\.env(?:\.[^/\\]*)?$/,
];
// Import .svg files as React components (illustrations and logo, see docs/design-handoff/00-foundations.md §8).
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer/expo');
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];
module.exports = config;
