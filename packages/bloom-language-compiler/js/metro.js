/**
 * Add the Bloom language compiler to a Metro config, in front of whichever
 * transform worker the config already uses.
 *
 * @param {import('metro-config').MetroConfig} config
 */
function withBloomLanguage(config) {
  return {
    ...config,
    transformerPath: require.resolve('./metro-transformer'),
    transformer: {
      ...config.transformer,
      bloomLanguage: { upstreamTransformerPath: config.transformerPath },
    },
  };
}

module.exports = { withBloomLanguage };
