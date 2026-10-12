/** Offline extraction of semantic anchor response, measured with independent
 * axis translations. This contains no draw commands or original runtime code. */
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { channel } from './build-avatar-catalog-motion.mjs';
const read = async (p) => JSON.parse(await readFile(p, 'utf8'));
const mapFrames = (raw, geometry) => {
  const hashes = new Map(geometry.parts.map((p) => [p.vertices.sha256, p.id])),
    buffers = new Map(raw.vertexBuffers.map((b) => [b.id, hashes.get(b.sha256)]));
  return raw.frames
    .filter((f) => f.renderTime >= 3)
    .map(
      (f) =>
        new Map(
          f.draws.map((d) => [
            buffers.get(d.vertexAttributes.find((a) => a.name === 'position')?.bufferId),
            d.blocks.DrawBlock,
          ]),
        ),
    );
};
const document = {
  schema: 'bloom.avatar.catalog-anchor-response',
  version: 1,
  rigs: [],
  limitations: [
    'Finite native Computer observation at 60 Hz. Anchor response is only valid while verified linear transforms remain unchanged under translation.',
  ],
};
for (const g of [0, 1]) {
  const dir = `.local/avatar-catalog-rig/rig${g}`,
    manifest = await read(`${dir}/work-manifest.json`),
    parts = {};
  let linear = 0,
    normal = 0;
  const count = Math.ceil(manifest.parts.filter((p) => p.category === 'eyes').length / 9);
  for (let group = 0; group < count; group++) {
    const base = `${dir}/work-anchors-${group}`;
    let raw;
    try {
      raw = await read(`${base}/work-raw.json`);
    } catch (e) {
      if (process.env.AVATAR_ANCHOR_PARTIAL === '1') continue;
      throw e;
    }
    const geometry = await read(`${base}/geometry.json`),
      control = await read(`${base}/manifest.json`),
      frames = mapFrames(raw, geometry);
    assert.equal(frames.length, 241);
    for (const c of control.controls) {
      const source = geometry.parts.find((p) => p.id === c.baseId),
        target = geometry.parts.find((p) => p.id === c.id),
        a = source.pose.deformationCenter,
        b = target.pose.deformationCenter,
        delta = b[c.axis] - a[c.axis];
      assert(delta > 0.24 && delta < 0.26);
      for (let k = 0; k < 3; k++) if (k !== c.axis) assert.equal(a[k], b[k]);
      const rows = frames.map((f) => {
        const s = f.get(c.baseId),
          t = f.get(c.id);
        assert(s && t);
        for (let k = 0; k < 12; k++) linear = Math.max(linear, Math.abs(s[k] - t[k]));
        for (let k = 16; k < 32; k++) normal = Math.max(normal, Math.abs(s[k] - t[k]));
        return [0, 1, 2].map((k) => (t[k + 12] - s[k + 12]) / delta).concat(0);
      });
      (parts[`mesh:${c.sourceId}`] ??= {})[`catalogAnchor${'XYZ'[c.axis]}`] = channel(rows);
    }
  }
  assert.equal(linear, 0, 'Anchor translation changed native linear frame');
  assert.equal(normal, 0, 'Anchor translation changed native normal frame');
  document.rigs.push({ parts, linearMax: linear, normalMax: normal });
}
await writeFile('.local/avatar-catalog-anchor-response.json', JSON.stringify(document));
console.log(
  document.rigs.map((r) => ({
    parts: Object.keys(r.parts).length,
    linear: r.linearMax,
    normal: r.normalMax,
  })),
);
