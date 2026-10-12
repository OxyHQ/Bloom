import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const NATIVE_PARTS = {
  shape: [
    'circle',
    'rounded_triangle',
    'capsule',
    'rounded_head_two_ears',
    'six_lobed_flower',
    'heart',
    'four_lobed_butterfly',
    'circle_two_ears',
    'twelve_scalloped_rosette',
    'rounded_cube',
    'rounded_diamond',
  ],
  eyes: [
    'swept_lids',
    'oval',
    'sparkle_capsules',
    'highlight_capsules',
    'dots',
    'double_highlights',
    'round_inset',
    'crescent_inset',
    'sleepy_lids',
  ],
  eyewear: [
    'none',
    'monocle',
    'tall_oval_frames',
    'separate_trapezoid_lenses',
    'classic_sunglasses',
    'round_sunglasses',
  ],
  accessory: ['none', 'headphones', 'bow', 'beanie', 'hat', 'beret', 'orb', 'three_lobe', 'crown'],
};
const MIGRATED_SHAPE_IDS = [
  'slender',
  'pocket',
  'petal',
  'star',
  'cloud',
  'shield',
  'pebble',
  'squircle',
];
const root = 'runtime/avatar/assets/catalog-library';
const read = async (path) => JSON.parse(await readFile(path, 'utf8'));
const index = await read(`${root}/index.json`);
const expected = {
  body: ['clippo', 'todd', ...NATIVE_PARTS.shape, ...MIGRATED_SHAPE_IDS],
  eyes: [...NATIVE_PARTS.eyes, 'todd', 'clippo', 'cyclops'],
  eyewear: [...NATIVE_PARTS.eyewear],
  accessory: [...NATIVE_PARTS.accessory, 'felipe_beret'],
};
const hash = (b) => createHash('sha256').update(b).digest('hex');
test('complete selector catalog has every distinct body/eye/eyewear/accessory at both LODs', () => {
  assert.equal(index.complete, true);
  for (const [category, ids] of Object.entries(expected))
    assert.deepEqual(Object.keys(index.donors[category]).sort(), ids.sort());
});
test('opaque eyewear keeps the hidden eye anchors required for refitting', async () => {
  for (const id of ['separate_trapezoid_lenses', 'classic_sunglasses', 'round_sunglasses'])
    for (const lod of ['low', 'high']) {
      const entry = index.donors.eyewear[id];
      const material = await read(`${root}/${entry[lod]}/material.json`);
      const eyes = material.parts.filter((part) => part.category === 'eyes');
      assert.equal(eyes.length, 2, `${id}/${lod}: hidden original oval eyes`);
      assert(eyes.every((part) => !entry.selectedPartIds.includes(part.id)));
      assert(eyes[0].pivot[0] < 0 && eyes[1].pivot[0] > 0);
    }
});
test('native face layouts are calculated independently for each geometry LOD', () => {
  const { low, high } = index.donors.body.circle.face;
  assert.notEqual(low.centers[0][0], high.centers[0][0]);
  assert.equal(high.centers[0][0], -0.20530472323323448);
});
for (const [category, ids] of Object.entries(expected))
  for (const id of ids)
    for (const lod of ['low', 'high'])
      test(`${category}:${id}/${lod} original geometry integrity and semantic material coverage`, async () => {
        const entry = index.donors[category][id];
        assert(entry, `${category}:${id}`);
        const path = `${root}/${entry[lod]}`;
        const [geometry, material, buffer] = await Promise.all([
          read(`${path}/geometry.json`),
          read(`${path}/material.json`),
          readFile(`${path}/geometry.bin`),
        ]);
        assert.equal(buffer.length, geometry.buffer.byteLength);
        assert.equal(hash(buffer), geometry.buffer.sha256);
        assert.equal(geometry.parts.length, material.parts.length);
        assert.deepEqual(entry.selectedPartIds, material.selectedPartIds);
        assert.deepEqual(entry.face[lod], material.face);
        assert.equal(entry.signaturePreset, material.signaturePreset);
        assert(
          material.crop.length === 4 &&
            material.crop.every(Number.isFinite) &&
            material.crop[2] > 0,
        );
        assert(material.face.centers.length === 2 && material.face.radius > 0);
        for (const center of material.face.centers)
          assert(center.length === 3 && center.every(Number.isFinite));
        for (const part of geometry.parts) {
          const desc = material.parts.find((p) => p.id === part.id);
          assert(desc);
          assert(['body', 'eyes', 'eyewear', 'accessory'].includes(desc.category));
          assert(desc.pivot.length === 3 && desc.pivot.every(Number.isFinite));
          for (const field of Object.values(desc.fields)) assert(field.every(Number.isFinite));
          assert.equal(desc.fields.world.length, 16);
          assert.equal(desc.fields.normalMatrix.length, 16);
          assert.equal(desc.neutralBodyRelativeWorld.length, 16);
          assert.equal(desc.neutralBodyRelativeNormal.length, 16);
          assert.equal(part.fur !== null, desc.fur);
          const ranges = [part.vertices, ...part.indices, ...(part.fur ? [part.fur] : [])];
          for (const range of ranges) {
            assert(range.byteOffset >= 0 && range.byteOffset + range.byteLength <= buffer.length);
            assert.equal(
              hash(buffer.subarray(range.byteOffset, range.byteOffset + range.byteLength)),
              range.sha256,
            );
          }
          const vertex = new Float32Array(
            buffer.buffer,
            buffer.byteOffset + part.vertices.byteOffset,
            part.vertices.byteLength / 4,
          );
          assert.equal(vertex.length, part.vertices.count * 24);
          for (const value of vertex) assert(Number.isFinite(value));
          for (const range of part.indices) {
            const Type = range.componentType === 'uint16' ? Uint16Array : Uint32Array;
            const values = new Type(
              buffer.buffer,
              buffer.byteOffset + range.byteOffset,
              range.count,
            );
            for (const v of values) assert(v < part.vertices.count);
          }
          assert(!('unresolvedMaterialAndPosePrefixHex' in part));
          assert(!('unresolvedDescriptorHex' in part));
        }
        assert(!('unresolvedFooterHex' in geometry.sourceAssembly));
        for (const part of material.parts.filter((p) => entry.selectedPartIds.includes(p.id)))
          assert.equal(part.category, category);
        assert(id === 'none' || entry.selectedPartIds.length > 0);
      });
