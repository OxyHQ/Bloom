// node --test test/: which bloomc the extension runs.
import assert from 'node:assert/strict';
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { resolveBloomc, PLATFORMS, cliFile } = require('../src/bloomc-path.js');
const compiler = require('../../bloom-language-compiler/js/platform.js');

test('the extension names the platform packages and their bloomc as the compiler does', () => {
  assert.deepEqual(PLATFORMS, compiler.PLATFORMS);
  for (const platform of Object.values(PLATFORMS))
    assert.equal(cliFile(platform), compiler.cliFile(platform));
});

test('a trusted workspace runs its own bloomc, from the nearest node_modules up', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'bloom-vscode-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const folder = join(root, 'apps', 'mention');
  mkdirSync(folder, { recursive: true });
  const linux = { platform: 'linux', arch: 'x64' };
  const pkg = join(root, 'node_modules', '@oxy.so');

  // Nothing installed: the PATH's.
  assert.deepEqual(resolveBloomc({ folders: [folder], trusted: true, ...linux }), {
    command: 'bloomc',
    args: ['lsp'],
    from: 'path',
  });

  // The compiler without this platform's package: its shim, by Node.
  const shim = join(pkg, 'bloom-language-compiler', 'js', 'bloomc.js');
  mkdirSync(join(shim, '..'), { recursive: true });
  writeFileSync(shim, '');
  assert.deepEqual(resolveBloomc({ folders: [folder], trusted: true, ...linux }), {
    command: 'node',
    args: [shim, 'lsp'],
    from: 'workspace',
  });

  // This platform's binary, once executable.
  const binary = join(pkg, 'bloom-language-compiler-linux-x64-gnu', 'bloomc.linux-x64-gnu');
  mkdirSync(join(binary, '..'), { recursive: true });
  writeFileSync(binary, '');
  chmodSync(binary, 0o644);
  assert.equal(resolveBloomc({ folders: [folder], trusted: true, ...linux }).command, 'node');
  chmodSync(binary, 0o755);
  assert.deepEqual(resolveBloomc({ folders: [folder], trusted: true, ...linux }), {
    command: binary,
    args: ['lsp'],
    from: 'workspace',
  });

  // Untrusted, or a setting: never the workspace's.
  assert.equal(resolveBloomc({ folders: [folder], trusted: false, ...linux }).from, 'path');
  assert.deepEqual(
    resolveBloomc({ setting: '/opt/bloomc', folders: [folder], trusted: true, ...linux }),
    {
      command: '/opt/bloomc',
      args: ['lsp'],
      from: 'setting',
    },
  );
});
