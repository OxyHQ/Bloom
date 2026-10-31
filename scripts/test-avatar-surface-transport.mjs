import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import { surfaceGeometryTransport } from './avatar-surface-transport.mjs';

const root = 'runtime/avatar/assets';
test('all transported meshes preserve every vertex/index byte while omitting strand seeds', async () => {
  const paths = (await readdir(root, { recursive: true })).filter((p) =>
    /(?:^|\/)geometry(?:-low)?\.json$/.test(p),
  );
  let originalBytes = 0,
    surfaceBytes = 0,
    furRecords = 0;
  for (const file of paths) {
    const original = JSON.parse(await readFile(`${root}/${file}`, 'utf8'));
    const originalBinary = await readFile(`${root}/${file.replace(/\.json$/, '.bin')}`);
    const saved = JSON.stringify(original);
    const { manifest, binary } = surfaceGeometryTransport(original, originalBinary);
    assert.equal(JSON.stringify(original), saved, 'Authored oracle remains immutable');
    assert.equal(manifest.buffer.byteLength, binary.length);
    assert.equal(manifest.buffer.sha256, createHash('sha256').update(binary).digest('hex'));
    for (let i = 0; i < original.parts.length; i++) {
      const before = original.parts[i],
        after = manifest.parts[i];
      assert.equal(after.fur, null, `${file}/${i} no strand transport`);
      furRecords += !!before.fur;
      for (const [a, b] of [
        [before.vertices, after.vertices],
        ...before.indices.map((index, j) => [index, after.indices[j]]),
      ]) {
        assert.equal(a.byteLength, b.byteLength);
        assert.equal(a.count, b.count);
        assert.deepEqual(
          originalBinary.subarray(a.byteOffset, a.byteOffset + a.byteLength),
          binary.subarray(b.byteOffset, b.byteOffset + b.byteLength),
          `${file}/${i} exact surface bytes`,
        );
      }
    }
    originalBytes += originalBinary.length;
    surfaceBytes += binary.length;
  }
  assert(paths.length > 100);
  assert(furRecords > 20);
  assert(surfaceBytes < originalBytes);
  console.log(
    JSON.stringify({
      files: paths.length,
      furRecords,
      originalBytes,
      surfaceBytes,
      removedBytes: originalBytes - surfaceBytes,
    }),
  );
});
