const fs = require('node:fs');
const nativeSource = require('./native-source');
const path = require('node:path');
const { withDangerousMod, withMainApplication } = require('expo/config-plugins');
module.exports = (config) => {
  config = withMainApplication(config, (mod) => {
    if (!mod.modResults.contents.includes('add(BloomLightProbePackage())'))
      mod.modResults.contents = mod.modResults.contents.replace(
        'PackageList(this).packages.apply {',
        'PackageList(this).packages.apply {\n          add(BloomLightProbePackage())',
      );
    return mod;
  });
  return withDangerousMod(config, [
    'android',
    async (mod) => {
      const destination = path.join(
        mod.modRequest.platformProjectRoot,
        'app/src/main/java/so/oxy/bloom/materiallab',
      );
      fs.mkdirSync(destination, { recursive: true });
      fs.writeFileSync(path.join(destination, 'BloomLightProbe.kt'), nativeSource().source);
      return mod;
    },
  ]);
};
