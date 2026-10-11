import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  inspectLegacyAssembly,
  deformLegacyAssembly,
  legacyAttachmentOffset,
} from '../assets/character-runtime/legacy-geometry.mjs';

const hash = 'b'.repeat(64);
const surface = `${hash}:surface:shadow`;
const highlight = `${hash}:surface:no-shadow`;
const uint = (value) => {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(value);
  return b;
};

// Small records with the observed 96-byte vertex / 64-byte fur layout. Real
// assemblies contain megabytes of geometry; no recovered binary is copied here.
function record(name, fur = false) {
  const vertices = Buffer.alloc(3 * 96);
  [
    [0.3, 0.1, 0],
    [0.1, 0.4, 0],
    [-0.2, 0.1, 0],
  ].forEach((position, i) => {
    position.forEach((value, k) => vertices.writeFloatLE(value, i * 96 + k * 4));
    for (const offset of [12, 36, 60, 84]) vertices.writeFloatLE(1, i * 96 + offset + 8);
  });
  const fibers = Buffer.alloc(64);
  fibers.writeFloatLE(0.3, 0);
  fibers.writeFloatLE(0.1, 4);
  fibers.writeFloatLE(1, 20);
  fibers.writeFloatLE(1, 24);
  return Buffer.concat([
    uint(name.length),
    Buffer.from(name),
    uint(3),
    vertices,
    uint(3),
    uint(0),
    uint(1),
    uint(2),
    uint(0),
    uint(0),
    Buffer.from([0, 0, Number(fur)]),
    ...(fur ? [uint(1), fibers] : []),
  ]);
}

function assembly(kinds = [surface, highlight]) {
  const header = Buffer.alloc(299);
  header.writeUInt32LE(1 + kinds.length);
  for (let k = 0; k < 3; k++) {
    header.writeFloatLE(-1, 4 + k * 4);
    header.writeFloatLE(1, 16 + k * 4);
  }
  // Body cache keys also contain the surface keys as text, not separate records.
  const bodyName = `${hash}:body:no-shadow:studio-fur-v6:${kinds.map((key) => `${key.length}:${key}`).join(':')}`;
  return new Uint8Array(
    Buffer.concat([
      header,
      record(bodyName, true),
      ...kinds.flatMap((key) => [
        Buffer.alloc(339, 42),
        record(key, key.includes(':studio-fur-v6:')),
      ]),
    ]),
  );
}

test('includes original highlight meshes and ignores nested cache-key text', () => {
  const bytes = assembly();
  const info = inspectLegacyAssembly(bytes);
  assert.deepEqual(
    info.parts.slice(1).map((part) => part.name),
    [surface, highlight],
  );
  assert.equal(info.body.furCount, 1);
  const result = deformLegacyAssembly(bytes, {
    radii: Array(64).fill(0.9),
    geometryKey: 'a'.repeat(64),
  });
  const eyeStart = info.parts[1].nameOffset - 4;
  assert.deepEqual(result.subarray(eyeStart), bytes.subarray(eyeStart));
  assert.notDeepEqual(result, bytes);
});

test('keeps original furry accessory geometry and fibers intact', () => {
  const accessory = `${hash}:surface:shadow:studio-fur-v6:79:${surface}:82:${highlight}`;
  const bytes = assembly([surface, highlight, accessory]);
  const info = inspectLegacyAssembly(bytes);
  assert.equal(info.parts.length, 4);
  assert.equal(info.parts[3].furCount, 1);
  const result = deformLegacyAssembly(bytes, {
    radii: Array(64).fill(0.9),
    geometryKey: 'a'.repeat(64),
  });
  const eyeStart = info.parts[1].nameOffset - 4;
  assert.deepEqual(result.subarray(eyeStart), bytes.subarray(eyeStart));
});

test('anchors accessories rigidly while preserving face meshes and fur vectors', () => {
  const points = Array.from({ length: 64 }, (_, i) => {
    const angle = (i * Math.PI) / 32;
    return [Math.cos(angle), Math.sin(angle) * 0.8];
  });
  assert.ok(Math.abs(legacyAttachmentOffset(points, 'orb')[1] + 0.2) < 1e-8);
  assert.ok(Math.abs(legacyAttachmentOffset(points, 'bow')[1] - 0.2) < 1e-8);
  assert.equal(legacyAttachmentOffset(points, 'headphones'), undefined);
  const accessory = `${hash}:surface:shadow:studio-fur-v6:79:${surface}`;
  const bytes = assembly([surface, accessory]),
    info = inspectLegacyAssembly(bytes);
  const result = deformLegacyAssembly(bytes, {
    points,
    geometryKey: 'a'.repeat(64),
    attachments: [{ part: 2, translate: [0, -0.2, 0] }],
    attachmentKeys: { 2: 'c'.repeat(64) },
  });
  const eyeStart = info.parts[1].nameOffset - 4,
    accessoryStart = info.parts[2].nameOffset - 4;
  assert.deepEqual(
    result.subarray(eyeStart, accessoryStart),
    bytes.subarray(eyeStart, accessoryStart),
  );
  const old = new DataView(bytes.buffer),
    next = new DataView(result.buffer),
    fur = info.parts[2].furOffset;
  assert.ok(Math.abs(next.getFloat32(fur + 4, true) - old.getFloat32(fur + 4, true) + 0.2) < 1e-6);
  assert.deepEqual(result.subarray(fur + 12, fur + 64), bytes.subarray(fur + 12, fur + 64));
});

test('rejects missing meshes, unknown kinds and truncated buffers', () => {
  assert.throws(
    () => inspectLegacyAssembly(assembly([`${hash}:surface:unsupported`])),
    /mesh count/,
  );
  const bytes = assembly();
  assert.throws(() => inspectLegacyAssembly(bytes.subarray(0, 200)), /truncated/);
  assert.throws(() => inspectLegacyAssembly(bytes.subarray(0, bytes.length - 2)), /mesh flags/);
  const wrongCount = bytes.slice();
  new DataView(wrongCount.buffer).setUint32(0, 4, true);
  assert.throws(() => inspectLegacyAssembly(wrongCount), /mesh count/);
});

test('rejects invalid vertex, index and fur bounds', () => {
  const bytes = assembly(),
    info = inspectLegacyAssembly(bytes);
  const invalidVertex = bytes.slice();
  new DataView(invalidVertex.buffer).setFloat32(info.body.vertexOffset, NaN, true);
  assert.throws(() => inspectLegacyAssembly(invalidVertex), /non-finite/);
  const invalidIndex = bytes.slice();
  new DataView(invalidIndex.buffer).setUint32(info.body.vertexOffset + 3 * 96 + 4, 3, true);
  assert.throws(() => inspectLegacyAssembly(invalidIndex), /index outside/);
  const truncatedFur = bytes.subarray(0, info.body.furOffset + 20);
  assert.throws(() => inspectLegacyAssembly(truncatedFur));
  const overlapping = bytes.slice();
  new DataView(overlapping.buffer).setUint32(info.body.furOffset - 4, 7, true);
  assert.throws(() => inspectLegacyAssembly(overlapping), /overlapping/);
});
