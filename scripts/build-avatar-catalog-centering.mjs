/** Author the two scalar scene-centering envelopes independently of geometry.
 * Body motion and contact-shadow centering are distinct native channels. */
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
const read = async (p) => JSON.parse(await readFile(p, 'utf8'));
const root = '.local/avatar-catalog-computer';
const [circle, beret, slender, centers] = await Promise.all(
  [
    'circle/work-raw.json',
    'circle-beret/work-raw.json',
    'slender/work-raw.json',
    'scene-centers.json',
  ].map((p) => read(`${root}/${p}`)),
);
const center = centers.find((c) => c.accessory === 'felipe_beret').center;
const slenderCenter = centers.find((c) => c.shape === 'slender').center;
const frames = circle.frames.filter((f) => f.renderTime >= 3);
const control = new Map(beret.frames.map((f) => [f.renderTime, f]));
const validation = new Map(slender.frames.map((f) => [f.renderTime, f]));
const body = [],
  shadow = [];
let bodyError = 0,
  shadowError = 0,
  independentError = 0;
for (const f of frames) {
  const b = control.get(f.renderTime);
  assert(b);
  const base = f.draws[0].blocks.DrawBlock,
    target = b.draws[0].blocks.DrawBlock;
  const w = -(target[13] - base[13]) / center[1];
  body.push(w);
  bodyError = Math.max(bodyError, Math.abs(base[12] - center[0] * w - target[12]));
  const shadows = (frame) => frame.draws.filter((d) => d.blocks.DrawBlock[43] === -16);
  const a = shadows(f),
    z = shadows(b);
  assert.equal(a.length, z.length);
  // The two body contact shadows share the centering channel. They are first
  // presented before the prop shadows and keep their buffer identities.
  if (a.length) {
    const delta = z[0].blocks.DrawBlock[12] - a[0].blocks.DrawBlock[12];
    const s = -delta / center[0];
    shadow.push(s);
    for (let i = 0; i < 2; i++)
      shadowError = Math.max(
        shadowError,
        Math.abs(a[i].blocks.DrawBlock[12] - center[0] * s - z[i].blocks.DrawBlock[12]),
      );
  } else shadow.push(0);
  const actual = validation.get(f.renderTime).draws[0].blocks.DrawBlock;
  independentError = Math.max(
    independentError,
    Math.abs(base[13] - slenderCenter[1] * w - actual[13]),
  );
}
assert(bodyError < 1e-7, `body XY disagreement ${bodyError}`);
assert(shadowError < 1e-7, `contact shadow disagreement ${shadowError}`);
assert(independentError < 1e-7, `independent Slender body disagreement ${independentError}`);
const output = {
  schema: 'bloom.avatar.catalog-centering',
  version: 1,
  times: frames.map((f) => f.renderTime - 3),
  body,
  shadow,
  verification: { bodyError, shadowError, independentError },
};
await writeFile(
  'runtime/avatar/assets/catalog-computer/centering.json',
  JSON.stringify(output),
);
console.log(output.verification);
