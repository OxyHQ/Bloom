/** Export the independently verified, finite Headphones idle blink channel. */
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { Matrix4 } from 'three';
import {
  AvatarEyeGazeController,
  eyeClosureFromMorph,
} from '../runtime/avatar/eye-gaze-controller.ts';
const output =
  process.env.AVATAR_BLINK_OUTPUT || 'runtime/avatar/assets/motion/lime-headphones-eye-blink.json';
const sources = {};
async function read(path) {
  const bytes = await readFile(path);
  sources[path] = createHash('sha256').update(bytes).digest('hex');
  return JSON.parse(bytes);
}
const frog = await read('.local/avatar-gaze-extended/lime_frog/idle-raw.json');
const baseline = await read('.local/avatar-gaze-extended/lime_headphones/idle-raw.json');
const observed = await read('.local/avatar-gaze-extended/lime_headphones/constant-raw.json');
const sourceClip = await read('runtime/avatar/assets/motion/lime_frog.json');
const targetClip = await read('runtime/avatar/assets/motion/lime_headphones.json');
const profileIndex = await read('runtime/avatar/assets/eye-gaze-profiles.json');
assert.equal(frog.length, baseline.length);
assert.equal(baseline.length, observed.length);
const eyes = new AvatarEyeGazeController(),
  correction = new Matrix4(),
  correctionN = new Matrix4();
const mat = (draw, offset = 0) =>
  new Matrix4().fromArray(draw.blocks.DrawBlock.slice(offset, offset + 16));
let previous = 0,
  worldMax = 0,
  normalRelativeMax = 0,
  tested = 0;
for (let i = 0; i < observed.length; i++) {
  const actual = observed[i],
    idle = baseline[i],
    blink = frog[i];
  assert.equal(actual.renderTime, idle.renderTime);
  assert.equal(actual.renderTime, blink.renderTime);
  const closure = eyeClosureFromMorph(blink.draws[1].blocks.DrawBlock.slice(36, 40), 'integrated');
  const bodyDelta = mat(actual.draws[0]).multiply(mat(idle.draws[0]).invert());
  const normalDelta = mat(actual.draws[0], 16).multiply(mat(idle.draws[0], 16).invert());
  for (const [partId, profile] of Object.entries(profileIndex.presets.lime_headphones[0])) {
    const id = Number(partId);
    eyes.writeCorrection(profile, closure, correction, correctionN);
    const expected = bodyDelta.clone().multiply(mat(idle.draws[id])).multiply(correction);
    const expectedN = normalDelta.clone().multiply(mat(idle.draws[id], 16)).multiply(correctionN);
    const scale = Math.max(1, ...idle.draws[id].blocks.DrawBlock.slice(16, 32).map(Math.abs));
    for (let k = 0; k < 16; k++) {
      worldMax = Math.max(
        worldMax,
        Math.abs(expected.elements[k] - actual.draws[id].blocks.DrawBlock[k]),
      );
      normalRelativeMax = Math.max(
        normalRelativeMax,
        Math.abs(expectedN.elements[k] - actual.draws[id].blocks.DrawBlock[16 + k]) / scale,
      );
    }
    assert.deepEqual(
      actual.draws[id].blocks.DrawBlock.slice(32),
      idle.draws[id].blocks.DrawBlock.slice(32),
    );
  }
  if (Math.abs(eyes.x) > 0.01) tested++;
  eyes.advance(actual.time - previous);
  previous = actual.time;
  for (const event of actual.events) if (event.kind === 'pointer') eyes.point(event.x, event.y);
}
assert(worldMax < 1e-6, `Native Headphones world ${worldMax}`);
assert(normalRelativeMax < 3e-7, `Native Headphones normal ${normalRelativeMax}`);
const sourceStart = sourceClip.evidence.idle.nativeStart;
const targetStart = targetClip.evidence.idle.nativeStart;
assert.equal(sourceStart, targetStart);
assert.equal(sourceClip.clips.idle.duration, targetClip.clips.idle.duration);
const sourcePart = sourceClip.clips.idle.parts.find((p) => p.id === 'mesh:1');
const times = targetClip.clips.idle.times,
  samples = [];
assert.deepEqual(times, sourceClip.clips.idle.times);
for (let i = 0; i < times.length; i++) {
  const nativeTime = targetStart + times[i];
  const frame = frog.find((f) => Math.abs(f.renderTime - nativeTime) < 1e-9);
  assert(frame, `Missing native blink at ${nativeTime}`);
  const parameters = sourcePart.fields.parameters.samples.slice(i * 4, i * 4 + 4);
  assert.deepEqual(
    parameters,
    frame.draws[1].blocks.DrawBlock.slice(36, 40),
    'Runtime and direct clocks must match, not nearest-fit',
  );
  samples.push(eyeClosureFromMorph(parameters, 'integrated'));
}
assert.equal(
  samples[0],
  samples[samples.length - 1],
  'Parent clip seam has matching observed closure',
);
const result = {
  schema: 'bloom.authored-hidden-eye-blink',
  version: 1,
  preset: 'lime_headphones',
  clips: {
    idle: {
      nativeStart: targetStart,
      nativeEnd: targetClip.evidence.idle.nativeEnd,
      duration: targetClip.clips.idle.duration,
      times,
      samples,
    },
  },
  evidence: {
    observedNativeStart: observed[0].renderTime,
    observedNativeEnd: observed[observed.length - 1].renderTime,
    comparedFrames: observed.length,
    informativeFrames: tested,
    worldMax,
    normalRelativeMax,
    sourceClipParametersExact: true,
    sourceFilesSha256: sources,
  },
  limitations: [
    'Finite observed scalar channel aligned to the existing idle clip; no claim that future native blinking repeats this interval.',
    'Original Headphones idle hides this scalar: it is identified through gaze, quantitatively matched to contemporaneous Frog closure, and exported as independent semantic data.',
    'Reaction and Computer blink/gaze semantics are not established by this idle evidence.',
  ],
};
await mkdir(dirname(output), { recursive: true });
await writeFile(output, JSON.stringify(result, null, 2) + '\n');
console.log(
  JSON.stringify({
    output,
    samples: samples.length,
    worldMax,
    normalRelativeMax,
  }),
);
