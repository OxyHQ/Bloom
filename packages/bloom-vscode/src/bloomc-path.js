// Which bloomc the extension runs as `bloomc lsp`, apart from the extension so
// Node can test it without VS Code.
const fs = require('node:fs');
const path = require('node:path');

const PACKAGE = '@oxy.so/bloom-language-compiler';
// As @oxy.so/bloom-language-compiler's js/platform.js names its platform
// packages and their bloomc (test/bloomc-path.test.mjs holds the two equal).
const PLATFORMS = {
  'darwin-arm64': 'darwin-arm64',
  'darwin-x64': 'darwin-x64',
  'linux-arm64': 'linux-arm64-gnu',
  'linux-x64': 'linux-x64-gnu',
  'win32-x64': 'win32-x64-msvc',
};
const cliFile = (platform) =>
  platform.startsWith('win32-') ? `bloomc.${platform}.exe` : `bloomc.${platform}`;

function isExecutable(file) {
  try {
    fs.accessSync(file, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * The command that serves `bloomc lsp`: `{ command, args, from }`.
 *
 * 1. The `bloom.bloomcPath` setting, when it names a binary.
 * 2. In a trusted workspace, the project's own compiler: the nearest
 *    `node_modules` above a workspace folder holding this platform's package
 *    (its bloomc, when it is executable), else the compiler's shim
 *    (`js/bloomc.js`, run by Node, which restores a lost mode and falls back to
 *    the WASI build).
 * 3. `bloomc` on the PATH.
 *
 * @param {{ setting?: string, folders: string[], trusted: boolean, platform?: string, arch?: string }} options
 */
function resolveBloomc({
  setting,
  folders,
  trusted,
  platform = process.platform,
  arch = process.arch,
}) {
  if (setting && setting !== 'bloomc') return { command: setting, args: ['lsp'], from: 'setting' };
  if (trusted) {
    const suffix = PLATFORMS[`${platform}-${arch}`];
    for (const folder of folders) {
      for (let dir = path.resolve(folder); ; dir = path.dirname(dir)) {
        const modules = path.join(dir, 'node_modules', ...PACKAGE.split('/'));
        const binary = suffix && path.join(`${modules}-${suffix}`, cliFile(suffix));
        if (binary && isExecutable(binary))
          return { command: binary, args: ['lsp'], from: 'workspace' };
        const shim = path.join(modules, 'js', 'bloomc.js');
        if (fs.existsSync(shim)) return { command: 'node', args: [shim, 'lsp'], from: 'workspace' };
        if (path.dirname(dir) === dir) break;
      }
    }
  }
  return { command: 'bloomc', args: ['lsp'], from: 'path' };
}

module.exports = { resolveBloomc, PLATFORMS, cliFile };
