/**
 * The compiler's platform packages: one committed directory per target under
 * `npm/` (napi's own layout, written by `bun run generate:platforms`), each
 * a workspace the release publishes before the compiler, which lists every one
 * as an optional dependency. CI builds the addons they carry
 * (.github/workflows/language-compiler-binaries.yml); the tree never holds them.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

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
    copied.push(platform);
  }
  return copied;
}
