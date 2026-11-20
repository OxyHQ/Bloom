import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  blobHashes,
  decodeBlob,
  encodeBlob,
  packVectorAsset,
  readVectorAsset,
  unpackVectorAsset,
} from './avatar-vector/pack-assets.mjs';

const directory = fileURLToPath(new URL('../src/agent-avatar/vector-assets/', import.meta.url));
const track = (n) => ({ translation: { value: [n, 0, 0] } });
const asset = {
  identity: { id: 'x' },
  parts: [
    { id: 0, label: 'a', points: [[1, 2, 3]], faces: [[0, 0, 0]], edges: [] },
    { id: 1, label: 'b', points: [[1, 2, 3]], faces: [[0, 0, 0]], edges: [], delta0: [[0, 0, 1]] },
  ],
  clips: {
    idle: { duration: 1, fps: 30, parts: [track(1), null] },
    work: { duration: 2, fps: 30, parts: [track(1), null] },
  },
};
test('packing shares identical payloads and unpacks to the original', () => {
  const { packed, blobs } = packVectorAsset(structuredClone(asset));
  assert.equal(packed.parts[0].geo === packed.parts[1].geo, false);
  assert.equal(new Set(packed.tracks).size, 2);
  assert.equal(blobHashes(packed).length, blobs.size);
  assert.deepStrictEqual(
    unpackVectorAsset(packed, (hash) => decodeBlob(JSON.parse(blobs.get(hash)))),
    asset,
  );
});

test('a payload decodes to exactly its numbers, each column in as few bytes as it needs', () => {
  const samples = Array.from({ length: 64 }, (_, i) => [
    Math.round(Math.sin(i / 7) * 325000) / 100000,
    0.5,
    i * 0.25,
    Math.round(Math.cos(i) * 1e6) / 1e6,
  ]).flat();
  const value = {
    points: [
      [-1.5, 0.25, 2],
      [0.125, -0.75, 1e-5],
    ],
    faces: [
      [0, 1, 65535],
      [5101, 2, 3],
    ],
    rotation: { samples },
    scale: { value: [1, 1, 1] },
  };
  const blob = encodeBlob(value);
  assert.deepStrictEqual(decodeBlob(blob), value);
  assert.deepEqual(blob.faces, {
    rows: 2,
    decimals: 0,
    columns: [
      [0, 2],
      [1, 1],
      [3, 2],
    ],
  });
  // A column that never changes takes no bytes.
  assert.deepEqual(blob.rotation.columns[1], [500000, 0]);
  assert.deepEqual(encodeBlob(decodeBlob(blob)), blob);
});

test('packing fails loudly on numbers it cannot hold exactly', () => {
  assert.throws(() => encodeBlob({ points: [[0, 1]] }), /a row of 2/);
  assert.throws(
    () => encodeBlob({ scale: { samples: [1, Number.NaN, 1] } }),
    /not a finite number/,
  );
  assert.throws(() => encodeBlob({ scale: { samples: [1, -0, 1] } }), /-0 would come back as 0/);
  assert.throws(() => encodeBlob({ scale: { samples: [0.1 + 0.2, 0, 0] } }), /not exact/);
  assert.throws(
    () =>
      encodeBlob({
        faces: [
          [0, 0, 0],
          [0, 0, 2 ** 33],
        ],
      }),
    /does not fit 4 bytes/,
  );
  assert.throws(() => encodeBlob({ shimmer: { samples: [1] } }), /unknown width/);
});

test('every shipped payload is named by its content and nothing is orphaned', () => {
  const manifest = JSON.parse(fs.readFileSync(directory + 'manifest.json', 'utf8'));
  const used = new Set(manifest.files.flatMap((record) => record.blobs));
  assert.deepEqual([...used].sort(), Object.keys(manifest.blobs).sort());
  for (const hash of used) {
    const text = fs.readFileSync(`${directory}blobs/${hash}.json`, 'utf8');
    assert.equal(createHash('sha256').update(text).digest('hex').slice(0, 16), hash);
  }
  assert.equal(fs.readdirSync(directory + 'blobs').length, used.size);
});

test('repacking the shipped assets reproduces every file byte for byte', () => {
  const manifest = JSON.parse(fs.readFileSync(directory + 'manifest.json', 'utf8'));
  for (const record of manifest.files) {
    const { packed, blobs } = packVectorAsset(readVectorAsset(directory, record.file));
    const file = JSON.parse(fs.readFileSync(directory + record.file, 'utf8'));
    assert.equal(file.data, JSON.stringify(packed), record.file);
    assert.deepEqual([...blobs.keys()].sort(), [...record.blobs].sort(), record.file);
    for (const [hash, text] of blobs)
      assert.equal(fs.readFileSync(`${directory}blobs/${hash}.json`, 'utf8'), text, hash);
  }
});
