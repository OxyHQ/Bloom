/** Infer only the measured native X-centering offset, with independent frames
 * checking the original body envelope. This is not a fitted motion curve. */
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const read = async (p) => JSON.parse(await readFile(p, 'utf8'));
const targetPath = '.local/avatar-catalog-clippo-special/work-raw.json',
  basePath = '.local/avatar-catalog-computer/clippo/work-raw.json';
const target = await read(targetPath),
  base = await read(basePath),
  env = await read('runtime/avatar/assets/catalog-computer/centering.json');
const at = (raw, t) => {
  const frame = raw.frames.find((f) => Math.abs(f.renderTime - t) < 1e-9);
  assert(frame);
  return frame.draws[0].blocks.DrawBlock;
};
const t = 6.016666666666667,
  index = env.times.findIndex((v) => Math.abs(v - (t - 3)) < 1e-9),
  a = at(target, t),
  b = at(base, t),
  delta = (b[12] - a[12]) / env.body[index];
let maximum = 0,
  shadowMaximum = 0,
  otherMaximum = 0,
  values = 0;
for (let i = 0; i < env.times.length; i++) {
  const time = 3 + env.times[i],
    a = at(target, time),
    b = at(base, time);
  maximum = Math.max(maximum, Math.abs(a[12] - b[12] + delta * env.body[i]));
  assert.equal(a[13], b[13], 'Unexpected Y centering');
  for (let k = 0; k < 12; k++) assert.equal(a[k], b[k], 'Unexpected body rotation/scale');
  values++;
  const get = (raw) =>
    raw.frames
      .find((f) => Math.abs(f.renderTime - time) < 1e-9)
      .draws.filter((d) => d.blocks.DrawBlock[43] < 0);
  const propsA = get(target),
    propsB = get(base);
  assert.equal(propsA.length, propsB.length);
  let shadow = 0;
  for (let p = 0; p < propsA.length; p++) {
    const a = propsA[p].blocks.DrawBlock,
      b = propsB[p].blocks.DrawBlock;
    const contact = a[43] === -16 && shadow++ < 2;
    for (let k = 0; k < 92; k++) {
      const predicted = b[k] - (contact && k === 12 ? delta * env.shadow[i] : 0),
        error = Math.abs(a[k] - predicted);
      if (contact) shadowMaximum = Math.max(shadowMaximum, error);
      else otherMaximum = Math.max(otherMaximum, error);
    }
  }
}
assert(maximum < 3e-8, `Centering residual ${maximum}`);
assert(
  Math.abs(shadowMaximum - 4.413544429926475e-8) < 1e-15,
  `Measured contact shadow residual changed: ${shadowMaximum}`,
);
assert.equal(otherMaximum, 0);
const result = {
  schema: 'bloom.avatar.catalog-construction-centering',
  version: 1,
  construction: 'clippo-special',
  detail: 'high',
  referenceEyes: 'todd',
  centerDelta: [delta, 0],
  application:
    'Add to the target-minus-baseline scene center before applying the existing native body and contact-shadow centering envelopes.',
  evidence: {
    frames: values,
    nativeTimeRange: [3, 7],
    worldXMax: maximum,
    contactShadowMax: shadowMaximum,
    otherPropMax: otherMaximum,
    derivationTime: t,
    sources: await Promise.all(
      [targetPath, basePath].map(async (path) => ({
        path,
        sha256: createHash('sha256')
          .update(await readFile(path))
          .digest('hex'),
      })),
    ),
  },
  limitations: [
    'Body and both contact shadows validated for all sampled frames; all other prop fields unchanged.',
    'High-detail source; low-detail body-ground and scene bounds are a distinct native observation.',
  ],
};
await writeFile(
  'runtime/avatar/assets/catalog-motion/clippo-special-centering.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(JSON.stringify(result));
