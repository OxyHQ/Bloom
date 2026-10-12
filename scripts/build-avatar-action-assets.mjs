/** Promote validated semantic observations into cycles/actions only after
 * proving their seam and return against an independently observed idle. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const preset = process.env.AVATAR_PRESET || 'alfred';
assert(/^[a-z0-9_]+$/.test(preset) && preset !== 'blue_beret');
const source = `.local/avatar-runtime-motion-actions/${preset}`;
const read = async (path) => JSON.parse(await readFile(path, 'utf8'));
const observation = await read(`.local/avatar-motion-observations-actions/${preset}.json`);
const idleRaw = await read(`${source}/idle-raw.json`);
const reactionRaw = await read(`${source}/reaction-raw.json`);
const geometry = await read(`.local/avatar-original-geometry/${preset}/geometry.json`);
assert.equal(observation.schema, 'bloom.avatar.motion-observations');
assert.equal(idleRaw.fixedStep, 60);
assert.equal(reactionRaw.fixedStep, 60);
const { idle, reaction } = observation.observations;
assert(idle && reaction);
function canonical(raw) {
  const buffers = new Map(raw.vertexBuffers.map((b) => [b.id, b.sha256]));
  return raw.frames.map((f) => {
    for (const draw of f.draws)
      assert.deepEqual(
        draw.blocks.FrameBlock,
        raw.frames[0].draws[0].blocks.FrameBlock,
        'Idle/reaction must not hide animated camera or lighting',
      );
    const draws = f.draws
      .map((d) => ({
        identity: buffers.get(d.vertexAttributes.find((a) => a.name === 'position').bufferId),
        values: [...d.blocks.DrawBlock, ...d.blocks.FrameBlock, ...d.blocks.SkinBlock],
      }))
      .sort((a, b) => a.identity.localeCompare(b.identity));
    assert(draws.every((d) => d.identity));
    return {
      time: f.renderTime,
      values: draws.flatMap((d) => d.values),
      body: draws.find((d) => d.identity === geometry.parts[0].vertices.sha256).values,
    };
  });
}
const iFrames = canonical(idleRaw),
  rFrames = canonical(reactionRaw);
const signature = (f) => createHash('sha256').update(JSON.stringify(f.values)).digest('hex');
const hashes = iFrames.map(signature);
const quiet = hashes
  .map((h, i) =>
    i > 0 && i + 1 < hashes.length && h === hashes[i - 1] && h === hashes[i + 1] ? i : -1,
  )
  .filter((i) => i >= 0);
// Search all observed quiet seams, including the approximately six-second
// cycle. The old 7.5–10s window accidentally excluded seven complete cycles.
const pairs = new Map();
for (const a of quiet)
  for (const b of quiet) {
    if (b - a < 180 || b - a > 720 || hashes[a] !== hashes[b]) continue;
    if (!pairs.has(b - a)) pairs.set(b - a, [a, b]);
  }
assert(pairs.size, 'No exact quiet full-state seam; refusing to invent a loop');
// Select the period with the best agreement over the WHOLE overlapping cycle,
// not the shortest pair of matching plateau samples (which truncates a hold).
// Breathing and eyelid events are independent. A blink need not recur in the
// next breath. Determine the breath period from the BODY, while still requiring
// exact quiet equality of EVERY part at the loop seam above. Keep and report
// the full-state recurrence shortfall instead of presenting it as periodic eyes.
const varying = iFrames[0].body
  .map((_, k) => k)
  .filter((k) => iFrames.some((f) => f.body[k] !== iFrames[0].body[k]));
let best;
for (const [step, pair] of pairs) {
  let square = 0,
    count = 0,
    max = 0;
  for (let i = 0; i + step < iFrames.length; i += 3)
    for (const k of varying) {
      const d = iFrames[i].body[k] - iFrames[i + step].body[k];
      square += d * d;
      count++;
      max = Math.max(max, Math.abs(d));
    }
  const rms = Math.sqrt(square / Math.max(1, count));
  if (!best || rms < best.rms) best = { pair, rms, max, step };
}
assert(best && best.rms < 0.0001, 'Observed cycle does not repeat closely enough');
let completeCycleMax = 0;
for (let i = 0; i + best.step < iFrames.length; i++)
  for (let k = 0; k < iFrames[i].values.length; k++)
    completeCycleMax = Math.max(
      completeCycleMax,
      Math.abs(iFrames[i].values[k] - iFrames[i + best.step].values[k]),
    );
const command = reactionRaw.calls.find((c) => c.method === 'playReaction' && c.result === 0);
assert(command, 'Original must accept the reaction');
const idleByTime = new Map(iFrames.map((f, i) => [f.time.toFixed(9), i]));
const equal = rFrames.map((f) => {
  const i = idleByTime.get(f.time.toFixed(9));
  assert(i !== undefined, 'Unpaired native timestamp');
  return signature(f) === hashes[i];
});
const start = rFrames.findLastIndex((f) => f.time <= command.renderTime);
assert(
  start >= 0 && equal.slice(0, start + 1).every(Boolean),
  'Pre-command state differs from idle',
);
const lastDifferent = equal.findLastIndex((v) => !v),
  end = lastDifferent + 1;
assert(lastDifferent > start && end < rFrames.length, 'Reaction has no observed return to idle');
const tail = rFrames.at(-1).time - rFrames[end].time;
assert(
  tail >= 1,
  'Require at least one second of exact independently observed idle after reaction',
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
const result = {
  schema: 'bloom.avatar.semantic-motion',
  version: 2,
  preset,
  provenance: observation.provenance,
  clips: {
    idle: trim(idle, ...best.pair, true),
    reaction: trim(reaction, start, end, false),
  },
  reactionEnd: 'return-idle',
  evidence: {
    idle: {
      nativeStart: iFrames[best.pair[0]].time,
      nativeEnd: iFrames[best.pair[1]].time,
      seamError: 0,
      bodyCycleRms: best.rms,
      bodyCycleMax: best.max,
      completeCycleMax,
    },
    reaction: {
      nativeStart: rFrames[start].time,
      nativeEnd: rFrames[end].time,
      exactIdleTailSeconds: tail,
      comparedBlocks: ['DrawBlock', 'FrameBlock', 'SkinBlock'],
    },
  },
  limitations: [
    'Observed breathing cycle including its captured eyelid events, with an exact quiet full-state seam. Eyelid recurrence need not share the breathing period; long-term stochastic blink timing is not inferred.',
    'Reaction returns to the exact phase of the separately observed idle. Entry from arbitrary idle phases and interruption fidelity remain unverified; the recorded entry pose is used.',
    'These actions do not establish parity for gaze, drag, arbitrary configuration or other activity controllers.',
  ],
};
const destination = 'runtime/avatar/assets/motion';
await mkdir(destination, { recursive: true });
await writeFile(`${destination}/${preset}.json`, JSON.stringify(result));
await writeFile(`${source}/action-validation.json`, JSON.stringify(result.evidence, null, 2));
console.log(JSON.stringify({ preset, ...result.evidence }));
