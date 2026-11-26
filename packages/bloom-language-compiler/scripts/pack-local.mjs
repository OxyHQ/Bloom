#!/usr/bin/env node
/**
 * Packs the compiler with the addon built from this checkout, for trying a
 * branch in an app before a release: never published.
 *
 *   bun run build:addon && node scripts/pack-local.mjs [out-dir]
 *
 * Writes `oxy.so-bloom-language-compiler-<version>-local.tgz` to `out-dir`
 * (`~/.local/share/bloom-lang/packs` by default). The tarball carries the
 * addon `js/native.js` loads first (`bloom-language-compiler.node`), so it
 * installs with no platform package and no Rust; it runs only on the platform
 * that built it. Install it in an app with `bun add <path-to.tgz>`.
 */
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const ADDON = 'bloom-language-compiler.node';
const out = resolve(process.argv[2] ?? join(homedir(), '.local/share/bloom-lang/packs'));

if (!existsSync(join(ROOT, ADDON))) throw new Error(`no ${ADDON}: run bun run build:addon first`);

const stage = mkdtempSync(join(tmpdir(), 'bloom-language-compiler-local-'));
const manifest = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
// The local addon ships in the tarball; the platform packages (workspace
// links) and the build's dev tools do not.
const local = {
  ...manifest,
  version: `${manifest.version}-local`,
  files: [...manifest.files, ADDON],
  optionalDependencies: undefined,
  devDependencies: undefined,
  scripts: undefined,
};
writeFileSync(join(stage, 'package.json'), `${JSON.stringify(local, null, 2)}\n`);
for (const file of ['js', 'LICENSE', ADDON])
  cpSync(join(ROOT, file), join(stage, file), { recursive: true });

// The staged addon must compile a view: a stub build is never packed.
const staged = createRequire(join(stage, 'package.json'))('./js/native.js');
const probe = staged.compileBloom?.('view A {\n  body { Text("a") }\n}\n', 'probe.bloom', {});
if (!probe?.code)
  throw new Error(`the addon compiles no .bloom (${JSON.stringify(probe)}): rebuild it`);

mkdirSync(out, { recursive: true });
const tarball = execFileSync('npm', ['pack', '--pack-destination', out], {
  cwd: stage,
  encoding: 'utf8',
})
  .trim()
  .split('\n')
  .at(-1);
console.log(join(out, tarball));
