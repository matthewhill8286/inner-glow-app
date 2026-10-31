const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
// Environment files are configuration inputs, never application modules.
const existing = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(existing) ? existing : existing ? [existing] : []),
  /[/\\]\.env(?:\.[^/\\]*)?$/,
];
module.exports = config;
