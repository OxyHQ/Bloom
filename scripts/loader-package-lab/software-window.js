const { withAndroidManifest } = require('expo/config-plugins');
module.exports = (config) =>
  withAndroidManifest(config, (mod) => {
    const activity = mod.modResults.manifest.application[0].activity.find(
      (item) => item.$['android:name'] === '.MainActivity',
    );
    if (!activity) throw new Error('Synthetic activity missing');
    activity.$['android:hardwareAccelerated'] =
      process.env.BLOOM_LAB_SOFTWARE_WINDOW === '1' ? 'false' : 'true';
    return mod;
  });
