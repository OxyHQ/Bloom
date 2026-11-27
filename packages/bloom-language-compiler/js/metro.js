// Not read from ./compile: the config loads without loading the native compiler.
const { withImportCheckingStores } = require('./metro-cache');

const BLOOM = 'bloom';

/**
 * Add the Bloom language compiler to a Metro config, in front of whichever
 * transform worker the config already uses, and let Metro resolve `.bloom`
 * modules (`import { Row } from './Row.bloom'`, or `'./Row'`). Its cache
 * stores refuse a cached `.bloom` transform once a file it imports has changed
 * (`./metro-cache`).
 *
 * `allowTsImports` is the migration mode (`--allow-ts-imports`, ADR 0002 section 4):
 * an app module may import TS by path, as `bloom migrate` checks its output.
 *
 * @param {import('metro-config').MetroConfig} config
 * @param {{ allowTsImports?: boolean }} [options]
 */
function withBloomLanguage(config, options = {}) {
  const sourceExts = config.resolver?.sourceExts ?? [];
  return {
    ...config,
    resolver: {
      ...config.resolver,
      sourceExts: sourceExts.includes(BLOOM) ? sourceExts : [...sourceExts, BLOOM],
    },
    cacheStores: withImportCheckingStores(config.cacheStores),
    transformerPath: require.resolve('./metro-transformer'),
    transformer: {
      ...config.transformer,
      bloomLanguage: {
        upstreamTransformerPath: config.transformerPath,
        allowTsImports: options.allowTsImports === true,
      },
    },
  };
}

module.exports = { withBloomLanguage };
