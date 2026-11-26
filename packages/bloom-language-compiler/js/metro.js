// Not read from ./compile: the config loads without loading the native compiler.
const BLOOM = 'bloom';

/**
 * Add the Bloom language compiler to a Metro config, in front of whichever
 * transform worker the config already uses, and let Metro resolve `.bloom`
 * modules (`import { Row } from './Row.bloom'`, or `'./Row'`).
 *
 * @param {import('metro-config').MetroConfig} config
 */
function withBloomLanguage(config) {
  const sourceExts = config.resolver?.sourceExts ?? [];
  return {
    ...config,
    resolver: {
      ...config.resolver,
      sourceExts: sourceExts.includes(BLOOM) ? sourceExts : [...sourceExts, BLOOM],
    },
    transformerPath: require.resolve('./metro-transformer'),
    transformer: {
      ...config.transformer,
      bloomLanguage: { upstreamTransformerPath: config.transformerPath },
    },
  };
}

module.exports = { withBloomLanguage };
