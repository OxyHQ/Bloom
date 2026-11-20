// Expo's default Metro config with the Bloom language compiler in front of
// Expo's transform worker: the shape an Oxy app's metro.config.js would take
// (`withBloomLanguage(createOxyMetroConfig(__dirname, …))`).
const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const { withBloomLanguage } = require('../js/metro');

const config = getDefaultConfig(__dirname);
const packageRoot = path.resolve(__dirname, '..');
const bloomRoot = path.resolve(packageRoot, '../..');

config.watchFolders = [packageRoot, path.join(bloomRoot, 'node_modules')];
config.resolver.nodeModulesPaths = [path.join(bloomRoot, 'node_modules')];
// Until packages/bloom-language exists: the reference interpreter stands in
// for the runtime, and the spike's hosts for its compiled entry point.
config.resolver.extraNodeModules = {
  '@oxy.so/bloom-language': path.join(packageRoot, 'bench/interpreter.mjs'),
};
const resolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@oxy.so/bloom-language') {
    return { type: 'sourceFile', filePath: path.join(packageRoot, 'bench/interpreter.mjs') };
  }
  if (moduleName === '@oxy.so/bloom-language/compiled') {
    return { type: 'sourceFile', filePath: path.join(packageRoot, 'runtime/compiled.mjs') };
  }
  return (resolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = withBloomLanguage(config);
