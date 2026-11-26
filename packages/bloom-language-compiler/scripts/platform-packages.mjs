/**
 * The compiler's platform packages: one committed directory per target under
 * `npm/` (napi's own layout, written by `bun run generate:platforms`, with the
 * bloomc binary added to each package's files), each a workspace the release
 * publishes before the compiler, which lists every one as an optional
 * dependency. CI builds the addons and bloomc binaries they carry
 * (.github/workflows/language-compiler-binaries.yml); the tree never holds them.
 */
import { chmodSync, copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import platforms from '../js/platform.js';

const { cliFile } = platforms;

/** A platform package's manifest as napi writes it, with its bloomc binary among its files. */
export function withCli(manifest, name) {
  const cli = cliFile(name);
  return manifest.files.includes(cli) ? manifest : { ...manifest, files: [...manifest.files, cli] };
}

export const ROOT = resolve(import.meta.dirname, '..');
export const NPM_DIR = join(ROOT, 'npm');

/** Every committed platform package: its directory name, path and manifest. */
export function platformPackages() {
  return readdirSync(NPM_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map(({ name }) => {
      const dir = join(NPM_DIR, name);
      return {
        platform: name,
        dir,
        manifest: JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')),
      };
    })
    .sort((a, b) => a.platform.localeCompare(b.platform));
}

/**
 * Copies each platform package's built files from `artifacts` (what
 * `napi build --platform` wrote) into `destination(platform)`. A platform
 * with none of its files there is skipped; one with only some fails. Returns
 * the platforms copied.
 */
export function copyBuilt(artifacts, destination) {
  const copied = [];
  for (const { platform, manifest } of platformPackages()) {
    const present = manifest.files.filter((file) => existsSync(join(artifacts, file)));
    if (present.length === 0) continue;
    const missing = manifest.files.filter((file) => !present.includes(file));
    if (missing.length)
      throw new Error(`${manifest.name}: ${artifacts} lacks ${missing.join(', ')}`);
    const dir = destination(platform);
    mkdirSync(dir, { recursive: true });
    for (const file of manifest.files) copyFileSync(join(artifacts, file), join(dir, file));
    // An artifact download loses the mode `npm pack` keeps.
    const cli = join(dir, cliFile(platform));
    if (existsSync(cli) && !platform.startsWith('win32-')) chmodSync(cli, 0o755);
    copied.push(platform);
  }
  return copied;
}
