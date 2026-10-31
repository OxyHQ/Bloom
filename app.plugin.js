const { withGradleProperties } = require('expo/config-plugins');

/** Native predictive back is explicit because it requires the RN ownership API. */
module.exports = function withBloom(config, { predictiveBack = false } = {}) {
  if (predictiveBack) {
    const sourceBuild = config.plugins?.some(
      (plugin) =>
        Array.isArray(plugin) &&
        plugin[0] === 'expo-build-properties' &&
        (plugin[1]?.android?.buildReactNativeFromSource ??
          plugin[1]?.buildReactNativeFromSource) === true,
    );
    if (!sourceBuild) {
      throw new Error(
        '[Bloom] predictiveBack requires expo-build-properties with android.buildReactNativeFromSource: true and a React Native source release containing BackNavigationCoordinator.',
      );
    }
  }
  return withGradleProperties(config, (mod) => {
    const hadBloomOptIn = mod.modResults.some(
      (entry) =>
        entry.type === 'property' &&
        entry.key === 'bloom.predictiveBackEnabled' &&
        entry.value === 'true',
    );
    const ownedProperties = ['bloom.predictiveBackEnabled', 'rnscreens.nativeBackOwnershipEnabled'];
    mod.modResults = mod.modResults.filter(
      (entry) =>
        entry.type !== 'property' ||
        (entry.key !== 'bloom.predictiveBackEnabled' &&
          (!(predictiveBack || hadBloomOptIn) ||
            entry.key !== 'rnscreens.nativeBackOwnershipEnabled')),
    );
    if (predictiveBack) {
      for (const key of ownedProperties)
        mod.modResults.push({ type: 'property', key, value: 'true' });
    }
    return mod;
  });
};
