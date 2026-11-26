// The compiler's platform packages, as js/native.js (the addon) and js/bloomc.js
// (the bloomc CLI) look them up: one optional dependency per platform, each
// carrying that platform's addon and bloomc binary, and the WASI package for a
// platform with neither.

const PACKAGE = '@oxy.so/bloom-language-compiler';
/** `process.platform-process.arch` to its platform package's suffix. */
const PLATFORMS = {
  'darwin-arm64': 'darwin-arm64',
  'darwin-x64': 'darwin-x64',
  'linux-arm64': 'linux-arm64-gnu',
  'linux-x64': 'linux-x64-gnu',
  'win32-x64': 'win32-x64-msvc',
};
const WASI_PLATFORM = 'wasm32-wasi';
const WASI = `${PACKAGE}-${WASI_PLATFORM}`;
/** Where setting the compiler up (and a platform without a build) is explained. */
const SETUP_DOC =
  'https://github.com/OxyHQ/Bloom/blob/main/docs/bloom-language-getting-started.mdx#the-compiler';

/** This machine's platform package suffix, or none when it has no prebuilt build. */
const currentPlatform = () => PLATFORMS[`${process.platform}-${process.arch}`];

/**
 * The bloomc binary's file name in a platform package (`npm/<platform>`):
 * named for its platform, as the addons are, so every build can sit in one
 * artifacts directory.
 */
function cliFile(platform) {
  if (platform === WASI_PLATFORM) return `bloomc.${platform}.wasm`;
  return platform.startsWith('win32-') ? `bloomc.${platform}.exe` : `bloomc.${platform}`;
}

module.exports = { PACKAGE, PLATFORMS, WASI, WASI_PLATFORM, SETUP_DOC, currentPlatform, cliFile };
