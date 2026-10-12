/** Semantic response to native half-size fitting. Effect 5's readable adapter
 * changes half-width/height; its projection contains linear and quadratic size
 * terms. Independent fitted recipes are the acceptance gate for this export. */
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { channel } from './build-avatar-catalog-motion.mjs';
const read = async (p) => JSON.parse(await readFile(p, 'utf8'));
const document = {
  schema: 'bloom.avatar.catalog-scale-response',
  version: 1,
  rigs: [],
  limitations: [
    'Finite Computer observations; only exported half-size effect5. Acceptance requires native independently fitted eye recipes, not interpolation through these controls alone.',
  ],
};
for (const g of [0, 1]) {
  const root = `.local/avatar-catalog-rig/rig${g}`,
    original = await read(`${root}/combined-work-geometry.json`),
    manifest = await read(`${root}/work-manifest.json`);
  const eyeIds = manifest.parts
    .filter((p) => p.category === 'eyes')
    .map((p) => p.id)
    .filter((id) => {
      const b = Buffer.from(
        original.parts.find((p) => p.id === id)
          .unresolvedMaterialAndPosePrefixHex,
        'hex',
      );
      return (
        b.readUInt32LE(108) === 0 && b[116 + b.readUInt32LE(112) + 36] === 5
      );
    });
  const parts = {};
  for (let group = 0; group < Math.ceil(eyeIds.length / 12); group++) {
    const dir = `${root}/work-scales-${group}`;
    let raw;
    try {
      raw = await read(`${dir}/work-raw.json`);
    } catch (e) {
      if (process.env.AVATAR_ANCHOR_PARTIAL === '1') continue;
      throw e;
    }
    const geometry = await read(`${dir}/geometry.json`),
      control = await read(`${dir}/manifest.json`),
      hashes = new Map(geometry.parts.map((p) => [p.vertices.sha256, p.id])),
      buffers = new Map(
        raw.vertexBuffers.map((b) => [b.id, hashes.get(b.sha256)]),
      );
    const frames = raw.frames
      .filter((f) => f.renderTime >= 3)
      .map(
        (f) =>
          new Map(
            f.draws.map((d) => [
              buffers.get(
                d.vertexAttributes.find((a) => a.name === 'position')?.bufferId,
              ),
              d.blocks.DrawBlock,
            ]),
          ),
      );
    assert.equal(frames.length, 241);
    for (const id of new Set(control.controls.map((c) => c.sourceId))) {
      const controls = control.controls.filter((c) => c.sourceId === id),
        a = controls.find((c) => c.scale === 0.75),
        b = controls.find((c) => c.scale === 1.25);
      assert(a && b);
      const values = frames.map((f) => {
        const zero = f.get(a.baseId),
          lo = f.get(a.id),
          hi = f.get(b.id);
        assert(zero && lo && hi);
        return {
          linear: Array.from({ length: 16 }, (_, k) => (hi[k] - lo[k]) / 0.5),
          quadratic: Array.from(
            { length: 16 },
            (_, k) => (hi[k] + lo[k] - 2 * zero[k]) / 0.125,
          ),
        };
      });
      const fields = {};
      for (let column = 0; column < 4; column++)
        for (const name of ['linear', 'quadratic'])
          fields[`catalogSize${name === 'linear' ? 'L' : 'Q'}${column}`] =
            channel(
              values.map((v) => v[name].slice(column * 4, column * 4 + 4)),
            );
      parts[`mesh:${id}`] = fields;
    }
  }
  document.rigs.push({ parts });
}
await writeFile(
  '.local/avatar-catalog-scale-response.json',
  JSON.stringify(document),
);
console.log(document.rigs.map((r) => Object.keys(r.parts).length));
