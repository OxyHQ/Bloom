import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { assertAvatarVectorsShip } from './verify-avatar-cutover.mjs';
function fixture(run) {
  const root = mkdtempSync(join(tmpdir(), 'bloom-vector-package-'));
  try {
    writeFileSync(join(root, 'package.json'), '{}');
    mkdirSync(join(root, 'src/agent-avatar/vector-assets'), { recursive: true });
    writeFileSync(
      join(root, 'src/agent-avatar/vector-assets/manifest.json'),
      JSON.stringify({ version: 1, files: [{ file: 'shape-example.json' }] }),
    );
    const packed = new Set();
    for (const p of [
      'src/agent-avatar/',
      'lib/module/agent-avatar/',
      'lib/commonjs/agent-avatar/',
    ]) {
      packed.add(p + 'VectorCharacterAvatar.' + (p.startsWith('src/') ? 'tsx' : 'js'));
      packed.add(p + 'vector-assets/shape-example.json');
    }
    run(root, packed);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}
test('requires the actual SVG renderer and lazy assets on every published platform', () =>
  fixture((root, packed) => {
    assert.deepEqual(assertAvatarVectorsShip(packed, root), []);
    packed.delete('lib/commonjs/agent-avatar/vector-assets/shape-example.json');
    assert.match(assertAvatarVectorsShip(packed, root).join('\n'), /Vector asset absent/);
  }));
test('rejects old hosted runtime, native bridge and offline source in a package', () =>
  fixture((root, packed) => {
    for (const file of [
      'assets/character-runtime/runtime.mjs',
      'src/agent-avatar/character-webview.ts',
      'lib/commonjs/agent-avatar/character-still.js',
      'lib/module/agent-avatar/CharacterStillHost.js',
      'runtime/avatar-runtime.ts',
    ]) {
      const result = assertAvatarVectorsShip(new Set([...packed, file]), root);
      assert.ok(
        result.some((message) => message.includes(file)),
        file,
      );
    }
  }));

test('rejects a reintroduced native bridge peer or hosted runtime build hook', () =>
  fixture((root, packed) => {
    writeFileSync(
      join(root, 'package.json'),
      JSON.stringify({
        peerDependencies: { 'react-native-webview': '*' },
        scripts: { prebuild: 'bun run build:avatar-runtime' },
      }),
    );
    const errors = assertAvatarVectorsShip(packed, root);
    assert.ok(errors.some((message) => message.includes('WebView peer')));
    assert.ok(errors.some((message) => message.includes('build/shipping')));
  }));
