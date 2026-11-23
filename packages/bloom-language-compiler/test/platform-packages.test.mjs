// node --test test/platform-packages.test.mjs: the committed platform packages
// are what napi generates for this version, and the compiler depends on each.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { NPM_DIR, platformPackages, ROOT } from '../scripts/platform-packages.mjs';

const compiler = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

test('npm/ is what `bun run generate:platforms` writes for this version', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'bloom-language-compiler-npm-'));
  copyFileSync(join(ROOT, 'package.json'), join(scratch, 'package.json'));
  const napi = join(ROOT, '..', '..', 'node_modules', '.bin', 'napi');
  execFileSync(napi, ['create-npm-dirs', '--npm-dir', 'npm'], { cwd: scratch, stdio: 'ignore' });
  const generated = readdirSync(join(scratch, 'npm')).sort();
  assert.deepEqual(
    platformPackages().map(({ platform }) => platform),
    generated,
  );
  for (const platform of generated)
    assert.deepEqual(
      JSON.parse(readFileSync(join(NPM_DIR, platform, 'package.json'), 'utf8')),
      JSON.parse(readFileSync(join(scratch, 'npm', platform, 'package.json'), 'utf8')),
      `npm/${platform}/package.json is stale: run bun run generate:platforms`,
    );
});

test('every platform package ships the licence', () => {
  const licence = readFileSync(join(ROOT, 'LICENSE'), 'utf8');
  for (const { platform, dir } of platformPackages())
    assert.equal(readFileSync(join(dir, 'LICENSE'), 'utf8'), licence, `npm/${platform}/LICENSE`);
});

test('the compiler lists every platform package as an optional workspace dependency', () => {
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(compiler.optionalDependencies ?? {}).sort(([a], [b]) => a.localeCompare(b)),
    ),
    Object.fromEntries(
      platformPackages()
        .map(({ manifest }) => [manifest.name, 'workspace:*'])
        .sort(([a], [b]) => a.localeCompare(b)),
    ),
  );
});

test('the published compiler carries no local addon', () => {
  assert.ok(!compiler.files.some((entry) => entry.endsWith('.node')));
});
