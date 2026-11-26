const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

// The Rust compiler, as a Node addon. The first that loads is used:
//
// 1. A build from this checkout (`scripts/build-addon.sh`), beside the package.
// 2. The prebuilt addon for this platform: an optional dependency CI builds and
//    packs (`.github/workflows/language-compiler-binaries.yml`), so installing
//    the compiler needs no Rust.
// 3. The WASI build, for a platform with no prebuilt addon (or a Linux without
//    glibc). Node runs it through `@napi-rs/wasm-runtime`.
//
// Every candidate exports the same `compile`, with the same output.
const LOCAL = path.join(__dirname, '..', 'bloom-language-compiler.node');
const PLATFORMS = {
  'darwin-arm64': 'darwin-arm64',
  'darwin-x64': 'darwin-x64',
  'linux-arm64': 'linux-arm64-gnu',
  'linux-x64': 'linux-x64-gnu',
  'win32-x64': 'win32-x64-msvc',
};
const PACKAGE = '@oxy.so/bloom-language-compiler';
/** Where setting the compiler up (and a platform without a build) is explained. */
const SETUP_DOC =
  'https://github.com/OxyHQ/Bloom/blob/main/docs/bloom-language-getting-started.mdx#the-compiler';
const WASI = `${PACKAGE}-wasm32-wasi`;

function candidates() {
  const prebuilt = PLATFORMS[`${process.platform}-${process.arch}`];
  return [LOCAL, ...(prebuilt ? [`${PACKAGE}-${prebuilt}`] : []), WASI];
}

/** The binary a candidate loads: the addon itself, or the WASI module beside its loader. */
function binaryOf(file) {
  return file.endsWith('.wasi.cjs') ? file.replace(/\.wasi\.cjs$/, '.wasm32-wasi.wasm') : file;
}

function load() {
  const failures = [];
  for (const candidate of candidates()) {
    let file;
    try {
      file = require.resolve(candidate);
    } catch {
      failures.push(`${candidate}: not installed`);
      continue;
    }
    try {
      return { addon: require(file), binary: binaryOf(file) };
    } catch (error) {
      failures.push(`${candidate}: ${error.message}`);
    }
  }
  throw new Error(
    `No Bloom language compiler loads on ${process.platform}-${process.arch}:\n  ${failures.join('\n  ')}\n` +
      `Build it from a checkout (bun run build:addon in packages/bloom-language-compiler), or install the prebuilt package for this platform. See ${SETUP_DOC}`,
  );
}

const { addon, binary } = load();

/** The binary's digest: a cache key part, so a new compiler invalidates cached transforms. */
const digest = crypto.createHash('sha1').update(fs.readFileSync(binary)).digest('hex');

/**
 * `binary` names the build that loaded (a local one, a platform package's, or
 * the WASI module); `docLinks()` lists every docs link a diagnostic can carry.
 * `compileBloom`, `bloomDependencies`, `checkBloom` and `formatBloom` are the `.bloom` compiler's
 * (absent from a build that predates it).
 */
module.exports = {
  compile: addon.compile,
  compileBloom: addon.compileBloom,
  bloomDependencies: addon.bloomDependencies,
  checkBloom: addon.checkBloom,
  formatBloom: addon.formatBloom,
  docLinks: addon.docLinks,
  digest,
  binary,
};
