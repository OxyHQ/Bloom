const { withAppBuildGradle } = require('expo/config-plugins');
module.exports = (config) =>
  withAppBuildGradle(config, (mod) => {
    const marker = '// Bloom fixture source inputs outside the Android application root.';
    if (!mod.modResults.contents.includes(marker))
      mod.modResults.contents += `\n${marker}
tasks.configureEach { task ->
  if (task.name == "createBundleReleaseJsAndAssets") {
    task.inputs.dir(new File(rootDir, "../../../src"))
    task.inputs.dir(new File(rootDir, "../../../templates/material"))
    task.inputs.file(new File(rootDir, "../build.json"))
    task.inputs.file(new File(rootDir, "../global.css"))
  }
}
`;
    return mod;
  });
