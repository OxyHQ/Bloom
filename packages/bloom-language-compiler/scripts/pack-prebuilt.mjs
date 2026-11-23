#!/usr/bin/env node
/**
 * Packs the compiler with its prebuilt addons, as the release publishes it,
 * without publishing (CI: .github/workflows/language-compiler-binaries.yml).
 *
 *   node scripts/pack-prebuilt.mjs <artifacts-dir> <out-dir>
 *
 * `<artifacts-dir>` holds what `napi build --platform` wrote for every target
 * in package.json's `napi.targets` (one addon per platform, and the WASI
 * module with its loader). Each committed platform package (`npm/<platform>`,
 * the manifests the release publishes) gets its built files and is packed; the
 * compiler is packed with every platform package as an optional dependency at
 * its version, as `bun pm pack` writes `workspace:*`. A missing file fails the
 * pack.
 */
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { copyBuilt, platformPackages, ROOT } from './platform-packages.mjs';

const [artifacts, out] = process.argv.slice(2).map((dir) => resolve(dir));
if (!artifacts || !out) throw new Error('usage: pack-prebuilt.mjs <artifacts-dir> <out-dir>');

const stage = mkdtempSync(join(tmpdir(), 'bloom-language-compiler-'));
mkdirSync(out, { recursive: true });

const pack = (dir) =>
  execFileSync('npm', ['pack', '--pack-destination', out], { cwd: dir, encoding: 'utf8' }).trim();

const platforms = platformPackages();
for (const { platform, dir } of platforms)
  cpSync(dir, join(stage, 'npm', platform), { recursive: true });
const copied = copyBuilt(artifacts, (platform) => join(stage, 'npm', platform));
const missing = platforms.filter(({ platform }) => !copied.includes(platform));
if (missing.length)
  throw new Error(
    `${artifacts} has no build for ${missing.map(({ platform }) => platform).join(', ')}`,
  );
for (const { platform } of platforms) console.log(`packed ${pack(join(stage, 'npm', platform))}`);

// The compiler as published: its own files, its platform packages at their versions.
const manifest = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
for (const entry of manifest.files)
  cpSync(join(ROOT, entry), join(stage, 'compiler', entry), { recursive: true });
const versions = new Map(platforms.map(({ manifest: m }) => [m.name, m.version]));
manifest.optionalDependencies = Object.fromEntries(
  Object.keys(manifest.optionalDependencies).map((name) => [name, versions.get(name)]),
);
writeFileSync(join(stage, 'compiler', 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`packed ${pack(join(stage, 'compiler'))}`);
