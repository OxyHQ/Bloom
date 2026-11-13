import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { compactVectorAsset } from './avatar-vector/compact-assets.mjs';

test('removes only unused exporter adjacency from otherwise constant-free data', () => {
  const data = {
    parts: [
      {
        role: 'body',
        points: [
          [0, 0, 0],
          [1, 0, 0],
          [0, 1, 0],
        ],
        faces: [[0, 1, 2]],
        edges: [[0, 1, 0, -1]],
      },
    ],
    clips: {
      idle: { parts: [{ translation: { samples: [0, 0, 0, 1, 0, 0] } }] },
    },
  };
  const expected = structuredClone(data);
  expected.parts[0].edges = [];
  assert.deepEqual(compactVectorAsset(data, 'shape'), expected);
});
test('every shipped vector omits adjacency payload and has accurate manifest bytes', () => {
  const directory = fileURLToPath(new URL('../src/agent-avatar/vector-assets/', import.meta.url));
  const manifest = JSON.parse(fs.readFileSync(directory + 'manifest.json', 'utf8'));
  for (const record of manifest.files) {
    const raw = fs.readFileSync(directory + record.file, 'utf8');
    assert.equal(Buffer.byteLength(raw), record.bytes, record.file);
    const data = JSON.parse(JSON.parse(raw).data);
    for (const part of data.parts) assert.deepEqual(part.edges, [], `${record.file}/${part.id}`);
  }
});
test('shared meshes resolve exactly and stay in lazily loaded groups', () => {
  const directory = fileURLToPath(new URL('../src/agent-avatar/vector-assets/', import.meta.url));
  const manifest = JSON.parse(fs.readFileSync(directory + 'manifest.json', 'utf8'));
  const geometry = new Map();
  for (const group of manifest.sharedGeometry ?? []) {
    const raw = fs.readFileSync(directory + group.file, 'utf8');
    assert.equal(Buffer.byteLength(raw), group.bytes, group.file);
    const values = JSON.parse(JSON.parse(raw).data);
    assert.equal(Object.keys(values).length, group.geometries, group.file);
    for (const [key, value] of Object.entries(values)) geometry.set(key, value);
  }
  let references = 0;
  for (const record of manifest.files) {
    const raw = fs.readFileSync(directory + record.file, 'utf8');
    const data = JSON.parse(JSON.parse(raw).data);
    for (const part of data.parts) {
      if (!part.geometryRef) continue;
      const shared = geometry.get(part.geometryRef);
      assert.ok(shared, `${record.file}/${part.id} references missing geometry`);
      assert.equal(part.points, undefined, `${record.file}/${part.id} retained duplicate points`);
      assert.equal(part.faces, undefined, `${record.file}/${part.id} retained duplicate faces`);
      references++;
    }
  }
  assert.ok(references > 0, 'expected repeated meshes to be extracted');
});
