/** Rebuild blue motion from the paired fixed60 controller observation, not wall-clock clips. */
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const source = '.local/avatar-return-source/blue_beret',
  destination = '.local/avatar-return-observations';
const result = spawnSync(process.execPath, ['scripts/build-avatar-motion-assets.mjs'], {
  env: {
    ...process.env,
    AVATAR_PRESET: 'blue_beret',
    AVATAR_MOTION_SOURCE: source,
    AVATAR_MOTION_DESTINATION: destination,
    AVATAR_MOTION_DIAGNOSTIC: '1',
  },
  encoding: 'utf8',
});
assert.equal(result.status, 0, result.stdout + result.stderr);
const read = async (p) => JSON.parse(await readFile(p, 'utf8'));
const observations = await read(`${destination}/blue_beret.json`),
  idle = await read(`${source}/idle-raw.json`),
  reaction = await read(`${source}/reaction-raw.json`);
const geometry = await read('.local/avatar-original-geometry/blue_beret/geometry.json');
function canonical(raw) {
  const identity = new Map(raw.vertexBuffers.map((b) => [b.id, b.sha256]));
  return raw.frames.map((frame) => {
    const draws = frame.draws
      .map((d) => ({
        id: identity.get(d.vertexAttributes.find((a) => a.name === 'position').bufferId),
        values: [...d.blocks.DrawBlock, ...d.blocks.FrameBlock, ...d.blocks.SkinBlock],
        defines: d.defines,
      }))
      .sort((a, b) => a.id.localeCompare(b.id));
    return {
      time: frame.renderTime,
      values: draws.flatMap((d) => d.values),
      body: draws.find((d) => d.id === geometry.parts[0].vertices.sha256).values,
      key: createHash('sha256').update(JSON.stringify(draws)).digest('hex'),
    };
  });
}
const frames = canonical(idle),
  quiet = frames
    .map((f, i) =>
      i > 0 && i + 1 < frames.length && f.key === frames[i - 1].key && f.key === frames[i + 1].key
        ? i
        : -1,
    )
    .filter((i) => i >= 0),
  pairs = new Map();
for (const a of quiet)
  for (const b of quiet)
    if (b - a >= 180 && b - a <= 720 && frames[a].key === frames[b].key && !pairs.has(b - a))
      pairs.set(b - a, [a, b]);
assert(pairs.size, 'Need exact quiet full-state seam');
const varying = frames[0].body
  .map((_, i) => i)
  .filter((k) => frames.some((f) => f.body[k] !== frames[0].body[k]));
let best;
for (const [step, pair] of pairs) {
  let square = 0,
    count = 0,
    max = 0;
  for (let i = 0; i + step < frames.length; i++)
    for (const k of varying) {
      const difference = frames[i].body[k] - frames[i + step].body[k];
      square += difference * difference;
      count++;
      max = Math.max(max, Math.abs(difference));
    }
  const rms = Math.sqrt(square / Math.max(1, count));
  if (!best || rms < best.rms) best = { step, pair, rms, max };
}
assert(
  best.max < 1e-12,
  'Blue body must repeat across the whole observed overlap, not merely touch a plateau',
);
let fullMax = 0;
for (let i = 0; i + best.step < frames.length; i++)
  for (let k = 0; k < frames[i].values.length; k++)
    fullMax = Math.max(fullMax, Math.abs(frames[i].values[k] - frames[i + best.step].values[k]));
assert(fullMax < 1e-12, 'Full native idle cycle must recur, including material/eye channels');
const command = reaction.calls.find((c) => c.method === 'playReaction' && c.result === 0);
assert(command);
const start = reaction.frames.findLastIndex((f) => f.renderTime <= command.renderTime),
  end = reaction.frames.length - 1;
const heldSeconds = reaction.finishedRenderTime - reaction.frames[end].renderTime;
assert(heldSeconds >= 1, 'No native terminal hold observed');
assert.equal(reaction.diagnostic.ready, true);
assert.equal(reaction.diagnostic.pending, false);
assert.equal(reaction.diagnostic.suspended, false);
const idleAt = new Map(frames.map((f) => [f.time, f.key])),
  reactionFrames = canonical(reaction);
assert(
  reactionFrames.slice(0, start + 1).every((f) => idleAt.get(f.time) === f.key),
  'Paired pre-command reference mismatch',
);
assert.notEqual(
  idleAt.get(reactionFrames.at(-1).time),
  reactionFrames.at(-1).key,
  'Hold must be distinguished from idle continuation',
);
function trim(clip, a, b, loop) {
  const times = clip.times.slice(a, b + 1).map((t) => t - clip.times[a]);
  const channel = (c, width) =>
    'value' in c ? c : { samples: c.samples.slice(a * width, (b + 1) * width) };
  return {
    transformEncoding: 'affine-qr-v1',
    duration: times.at(-1),
    loop,
    times,
    parts: clip.parts.map((p) => ({
      id: p.id,
      translation: channel(p.translation, 3),
      rotation: channel(p.rotation, 4),
      scale: channel(p.scale, 3),
      shear: channel(p.shear, 3),
      normalCorrection: channel(p.normalCorrection, 9),
      fields: Object.fromEntries(Object.entries(p.fields).map(([k, v]) => [k, channel(v, 4)])),
    })),
  };
}
const asset = {
  schema: 'bloom.avatar.semantic-motion',
  version: 2,
  preset: 'blue_beret',
  provenance: observations.provenance,
  clips: {
    idle: trim(observations.observations.idle, ...best.pair, true),
    reaction: trim(observations.observations.reaction, start, end, false),
  },
  reactionEnd: 'hold',
  evidence: {
    source,
    idle: {
      nativeStart: frames[best.pair[0]].time,
      nativeEnd: frames[best.pair[1]].time,
      seamError: 0,
      bodyCycleRms: best.rms,
      bodyCycleMax: best.max,
      completeCycleMax: fullMax,
      comparedOverlapFrames: frames.length - best.step,
    },
    reaction: {
      nativeStart: reaction.frames[start].renderTime,
      nativeEnd: reaction.frames[end].renderTime,
      observedRenderEnd: reaction.finishedRenderTime,
      noFurtherSubmissionsSeconds: heldSeconds,
      ready: true,
      pending: false,
      suspended: false,
    },
  },
  limitations: [
    'Blue idle recurs throughout the observed overlapping 8.8-second cycle with full native-block residual below 1e-12 and an exactly quiet seam. Future stochastic events beyond this observation are not inferred.',
    'Blue reaction holds its native terminal pose: public render continued for over ten more native seconds without another submission. This differs from the other seven preset controllers.',
    'Arbitrary phase entry, interruption, gaze and other commands are not proven by these clips.',
  ],
};
await writeFile(
  process.env.AVATAR_BLUE_MOTION_OUTPUT || 'runtime/avatar/assets/motion/blue_beret.json',
  JSON.stringify(asset),
);
console.log(JSON.stringify(asset.evidence, null, 2));
