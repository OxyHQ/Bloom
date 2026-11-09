const path = require('node:path');
const { createOxyMetroConfig } = require('@oxy.so/app-preset/metro');
const config = createOxyMetroConfig(__dirname, { workspaceRoot: __dirname });
config.maxWorkers = 4;
config.resolver.disableHierarchicalLookup = true;
config.resolver.nodeModulesPaths = [path.join(__dirname, 'node_modules')];
module.exports = config;
