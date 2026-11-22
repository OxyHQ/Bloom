#!/usr/bin/env node
/**
 * Packs the compiler with its prebuilt addons, as a release would publish it,
 * without publishing (CI: .github/workflows/language-compiler-binaries.yml).
 *
 *   node scripts/pack-prebuilt.mjs <artifacts-dir> <out-dir>
 *
 * `<artifacts-dir>` holds what `napi build --platform` wrote for every target
 * in package.json's `napi.targets` (one addon per platform, and the WASI
 * module with its loader). For each target, napi's own generator writes the
 * platform package (`napi create-npm-dirs`: its name, os, cpu, libc and files);
 * this copies the built files into it, packs it, and packs the compiler with
 * every platform package as an optional dependency at its version. A missing
 * file fails the pack.
 */
import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const [artifacts, out] = process.argv.slice(2).map((dir) => resolve(dir));
if (!artifacts || !out) throw new Error('usage: pack-prebuilt.mjs <artifacts-dir> <out-dir>');

const root = resolve(import.meta.dirname, '..');
const stage = mkdtempSync(join(tmpdir(), 'bloom-language-compiler-'));
mkdirSync(out, { recursive: true });

// The compiler as published: its own files, no addon of a local build.
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
for (const entry of manifest.files)
  cpSync(join(root, entry), join(stage, entry), { recursive: true });
writeFileSync(join(stage, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`);

// The workspace's napi CLI (a devDependency, hoisted to the repository's node_modules).
const napi = join(root, '..', '..', 'node_modules', '.bin', 'napi');
execFileSync(napi, ['create-npm-dirs', '--npm-dir', 'npm'], { cwd: stage, stdio: 'inherit' });

const pack = (dir) =>
  execFileSync('npm', ['pack', '--pack-destination', out], { cwd: dir, encoding: 'utf8' }).trim();

const optional = {};
for (const platform of readdirSync(join(stage, 'npm'))) {
  const dir = join(stage, 'npm', platform);
  const platformManifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  for (const file of platformManifest.files) copyFileSync(join(artifacts, file), join(dir, file));
  copyFileSync(join(root, 'LICENSE'), join(dir, 'LICENSE'));
  optional[platformManifest.name] = platformManifest.version;
  console.log(`packed ${pack(dir)}`);
}

manifest.optionalDependencies = optional;
writeFileSync(join(stage, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`packed ${pack(stage)}`);
