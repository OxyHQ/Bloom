/** Export one complete native Computer cycle plus entry, with independent
 * breathing supplied at runtime. Extended captures include the fourth row. */
import assert from 'node:assert/strict';
import { readFile, writeFile, copyFile } from 'node:fs/promises';
const preset = process.env.AVATAR_PRESET || 'alfred';
const source = `.local/avatar-loop-assets/${preset}`;
const output = `runtime/avatar/assets/${preset}`;
const motion = JSON.parse(await readFile(`${source}/computer-motion.json`));
assert.equal(motion.preset, preset);
assert(motion.clip.duration >= 13);
const duration = 7,
  loopStart = 1,
  period = 6;
const end = motion.clip.times.findIndex((t) => t === duration);
assert(end > 0);
const times = motion.clip.times.slice(0, end + 1);
const channel = (c) => {
  if ('value' in c) return c;
  const width = c.samples.length / motion.clip.times.length;
  assert(Number.isInteger(width));
  return { samples: c.samples.slice(0, times.length * width) };
};
const parts = motion.clip.parts.map((p) =>
  Object.fromEntries(
    Object.entries(p).map(([k, v]) => [
      k,
      k === 'id'
        ? v
        : k === 'fields'
          ? Object.fromEntries(Object.entries(v).map(([n, c]) => [n, channel(c)]))
          : channel(v),
    ]),
  ),
);
const loop = {
  schema: 'bloom.avatar.computer-loop',
  version: 1,
  preset,
  nativeStart: 3,
  loopStart,
  period,
  clip: { duration, loop: false, times, parts },
  evidence: {
    rawSha256: motion.rawSha256,
    sourceHashes: motion.sourceHashes,
    interval: 'Native4..10 props repeat at10..16; body/shadows retain independent breathing',
    limitations: ['Start/Stop and interruptions require separate transition controllers.'],
  },
};
await writeFile(`${output}/computer-loop.json`, JSON.stringify(loop));
for (const name of ['computer-geometry.json', 'computer-geometry.bin', 'computer-material.json'])
  await copyFile(`${source}/${name}`, `${output}/${name}`);
console.log(JSON.stringify({ preset, samples: times.length, parts: parts.length }));
