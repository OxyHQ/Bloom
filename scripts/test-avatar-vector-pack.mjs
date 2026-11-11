import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { packVectorAsset, unpackVectorAsset, blobHashes } from './avatar-vector/pack-assets.mjs';

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
  assert.deepEqual(
    unpackVectorAsset(packed, (hash) => blobs.get(hash)),
    asset,
  );
});
test('every shipped payload is named by its content and nothing is orphaned', () => {
  const manifest = JSON.parse(fs.readFileSync(directory + 'manifest.json', 'utf8'));
  const used = new Set(manifest.files.flatMap((record) => record.blobs));
  assert.deepEqual([...used].sort(), Object.keys(manifest.blobs).sort());
  for (const hash of used) {
    const file = JSON.parse(fs.readFileSync(`${directory}blobs/${hash}.json`, 'utf8'));
    const digest = createHash('sha256').update(file.data).digest('hex').slice(0, 16);
    assert.equal(digest, hash);
  }
  assert.equal(fs.readdirSync(directory + 'blobs').length, used.size);
});
