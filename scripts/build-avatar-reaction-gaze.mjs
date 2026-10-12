/** Export independent reaction frames needed to compose live gaze before expression.
 * Source clocks come from paired, unmodified native observations; no baked pointer poses. */
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Matrix4, Vector3, Quaternion } from 'three';
import { eyeClosureFromMorph } from '../runtime/avatar/eye-gaze-controller.ts';
import { reactionGazeEnvelope } from '../runtime/avatar/reaction-gaze.ts';
const presets = {
  alfred: 2.2,
  purple_heart: 2.4,
  lime_frog: 2.5,
  coral_monocle: 2.5,
  gus: 2.6,
  blue_spectacles: 2.6,
  lime_headphones: 2.1,
};
const root = 'runtime/avatar/assets/motion';
const result = { schema: 'bloom.avatar.reaction-gaze', version: 1, presets: {} };
for (const [preset, coreSeconds] of Object.entries(presets)) {
  const sources = {};
  const read = async (path) => {
    const bytes = await readFile(path);
    sources[path] = createHash('sha256').update(bytes).digest('hex');
    return JSON.parse(bytes);
  };
  const motion = await read(`${root}/${preset}.json`),
    clip = motion.clips.reaction;
  const raw = await read(`.local/avatar-runtime-motion-actions/${preset}/reaction-raw.json`);
  const idle = await read(`.local/avatar-runtime-motion-actions/${preset}/idle-raw.json`);
  const command = raw.calls.find((c) => c.method === 'playReaction' && c.result === 0);
  assert(command);
  assert.equal(command.renderTime, motion.evidence.reaction.nativeStart);
  const start = command.renderTime;
  const after = raw.frames.filter((f) => f.renderTime > start + 1e-8);
  const entryIndex = after.findIndex(
    (f, i) =>
      i > 0 &&
      f.draws[0].blocks.DrawBlock[13] === after[i - 1].draws[0].blocks.DrawBlock[13] &&
      f.draws[0].blocks.DrawBlock[13] !==
        idle.frames.find((g) => Math.abs(g.renderTime - f.renderTime) < 1e-8)?.draws[0].blocks
          .DrawBlock[13],
  );
  assert(entryIndex > 0, `${preset}: missing observed frozen breathing presentation`);
  const freezeTime = after[entryIndex - 1].renderTime,
    origin = after[entryIndex].renderTime;
  const get = (frames, t) => {
    const frame = frames.find((f) => Math.abs(f.renderTime - t) < 1e-9);
    assert(frame, `Missing native frame ${preset}/${t}`);
    return frame;
  };
  const frozen = get(idle.frames, freezeTime).draws[0].blocks.DrawBlock.slice(12, 15);
  assert.deepEqual(
    get(raw.frames, origin).draws[0].blocks.DrawBlock.slice(0, 32),
    get(raw.frames, freezeTime).draws[0].blocks.DrawBlock.slice(0, 32),
    'Native adapter freezes the incoming pose before transition',
  );
  const translation = [],
    scale = [],
    eyeBlink = [];
  const blinkFrames =
    preset === 'lime_headphones'
      ? (await read('.local/avatar-runtime-motion-actions/lime_frog/idle-raw.json')).frames
      : undefined;
  const directBlink = blinkFrames
    ? await read('.local/avatar-gaze-extended/lime_frog/idle-raw.json')
    : undefined;
  const closureAt = (t) => {
    const source = get(blinkFrames, t).draws[1].blocks.DrawBlock.slice(36, 40);
    assert.deepEqual(
      source,
      get(directBlink, t).draws[1].blocks.DrawBlock.slice(36, 40),
      'Direct/runtime blink clocks must agree exactly',
    );
    return eyeClosureFromMorph(source, 'integrated');
  };
  for (const time of clip.times) {
    const frame = get(raw.frames, start + time),
      baseline = get(idle.frames, start + time);
    const envelope = reactionGazeEnvelope(start + time - origin, coreSeconds);
    const nativeTranslation =
      time < origin - start + coreSeconds
        ? frozen
        : baseline.draws[0].blocks.DrawBlock.slice(12, 15);
    // Before the transition the source clip still presents its incoming idle.
    const v =
      time < origin - start
        ? frame.draws[0].blocks.DrawBlock.slice(12, 15)
        : nativeTranslation.map((v) => v * envelope.strength);
    translation.push(...v, 0);
    const s = new Vector3();
    new Matrix4()
      .fromArray(frame.draws[0].blocks.DrawBlock)
      .decompose(new Vector3(), new Quaternion(), s);
    scale.push(...s.toArray(), 0);
    if (blinkFrames) {
      const closure =
        time < origin - start
          ? closureAt(start + time)
          : envelope.strength === 0
            ? 0
            : closureAt(envelope.frozen ? freezeTime : start + time) * envelope.strength;
      eyeBlink.push(closure, 0, 0, 0);
    }
  }
  result.presets[preset] = {
    entryTime: origin - start,
    coreSeconds,
    duration: clip.duration,
    times: clip.times,
    translation,
    scale,
    ...(blinkFrames ? { eyeBlink } : {}),
    evidence: {
      commandTime: start,
      frozenIdleTime: freezeTime,
      transitionOrigin: origin,
      pairedNativeIdle: true,
      sourceFilesSha256: sources,
    },
  };
}
await writeFile(`${root}/reaction-gaze.json`, JSON.stringify(result));
console.log(
  JSON.stringify(
    Object.fromEntries(
      Object.entries(result.presets).map(([k, v]) => [
        k,
        { entryTime: v.entryTime, coreSeconds: v.coreSeconds, samples: v.times.length },
      ]),
    ),
  ),
);
