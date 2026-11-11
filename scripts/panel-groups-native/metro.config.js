const path = require('node:path');
const fs = require('node:fs');
const { createOxyMetroConfig } = require('@oxy.so/app-preset/metro');
const source = fs.realpathSync(path.join(__dirname, '.source'));
const config = createOxyMetroConfig(__dirname, {
  workspaceRoot: __dirname,
  extraWatchFolders: [source],
});
config.maxWorkers = 2;
config.resolver.disableHierarchicalLookup = true;
config.resolver.nodeModulesPaths = [path.join(__dirname, 'node_modules')];
module.exports = config;
