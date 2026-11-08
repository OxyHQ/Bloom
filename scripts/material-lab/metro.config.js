const path = require('node:path');
const { createOxyMetroConfig } = require('@oxy.so/app-preset/metro');
const root = path.resolve(__dirname, '../..');
const config = createOxyMetroConfig(__dirname, {
  workspaceRoot: __dirname,
  extraWatchFolders: [path.join(root, 'src'), path.join(root, 'templates')],
});
// One React/native runtime for fixture and source, independent of the root install.
config.maxWorkers = 4;
config.resolver.disableHierarchicalLookup = true;
config.resolver.nodeModulesPaths = [path.join(__dirname, 'node_modules')];
module.exports = config;
