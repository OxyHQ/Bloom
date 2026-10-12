/** Derive adapter presentation offsets from paired native runtime captures.
 * Output is diagnostic unless an explicit destination is supplied. */
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Matrix4, Quaternion, Vector3 } from 'three';
const cores = {
  alfred: 2.2,
  purple_heart: 2.4,
  lime_frog: 2.5,
  coral_monocle: 2.5,
  gus: 2.6,
  blue_spectacles: 2.6,
  lime_headphones: 2.1,
};
const smoother = (t) => {
  t = Math.max(0, Math.min(1, t));
  return t * t * t * (10 - 15 * t + 6 * t * t);
};
const scale = (f) => {
  const s = new Vector3();
  new Matrix4()
    .fromArray(f.draws[0].blocks.DrawBlock)
    .decompose(new Vector3(), new Quaternion(), s);
  return s.toArray();
};
const report = {
  schema: 'bloom.reaction-gaze-timing',
  version: 1,
  limits: [
    'Orientation comparison selects an unambiguous presentation alignment; different-command-phase captures do not establish expression parity. Headphones additionally validates the complete breathing translation envelope.',
  ],
  presets: {},
};
for (const [preset, coreSeconds] of Object.entries(cores)) {
  const path = `.local/avatar-runtime-motion-actions/${preset}`;
  const rt = await readFile(`${path}/reaction-raw.json`),
    it = await readFile(`${path}/idle-raw.json`);
  const reaction = JSON.parse(rt),
    idle = JSON.parse(it);
  const command = reaction.calls.find(
    (c) => c.method === 'playReaction' && c.result === 0,
  );
  assert(command);
  const after = reaction.frames.filter(
    (f) => f.renderTime > command.renderTime + 1e-8,
  );
  const entryIndex = after.findIndex((frame, index) => {
    if (index === 0) return false;
    const matchedIdle = idle.frames.find(
      (f) => Math.abs(f.renderTime - frame.renderTime) < 1e-8,
    );
    return (
      matchedIdle &&
      frame.draws[0].blocks.DrawBlock[13] ===
        after[index - 1].draws[0].blocks.DrawBlock[13] &&
      frame.draws[0].blocks.DrawBlock[13] !==
        matchedIdle.draws[0].blocks.DrawBlock[13]
    );
  });
  assert(
    entryIndex > 0,
    `${preset} missing observed frozen breathing presentation`,
  );
  const frozen = after[entryIndex - 1],
    entry = after[entryIndex];
  const idleFrozen = idle.frames.find(
    (f) => Math.abs(f.renderTime - frozen.renderTime) < 1e-8,
  );
  assert(idleFrozen);
  assert.equal(
    entry.draws[0].blocks.DrawBlock[13],
    idleFrozen.draws[0].blocks.DrawBlock[13],
  );
  const exit = entry.renderTime + coreSeconds;
  const directBytes = await readFile(
    `.local/avatar-eye-activities/${preset}/reaction-baseline-raw.json`,
  );
  const direct = JSON.parse(directBytes);
  const rotation = (f) => {
    const q = new Quaternion();
    new Matrix4()
      .fromArray(f.draws[0].blocks.DrawBlock)
      .decompose(new Vector3(), q, new Vector3());
    return new Matrix4().makeRotationFromQuaternion(q).elements;
  };
  let rotationMax = 0,
    rotationFrames = 0;
  for (const d of direct) {
    const target = entry.renderTime + (d.time - (0.5 + 1 / 30));
    if (target < entry.renderTime || target > exit + 0.18) continue;
    const f = reaction.frames.find(
      (f) => Math.abs(f.renderTime - target) < 1e-8,
    );
    assert(f);
    const dr = rotation(d),
      fr = rotation(f);
    for (let j = 0; j < 16; j++)
      rotationMax = Math.max(rotationMax, Math.abs(dr[j] - fr[j]));
    rotationFrames++;
  }
  assert(rotationFrames > 60);
  // Decomposing matrices with different breathing scales is not a parity gate.
  // Discriminate timing from either adjacent runtime presentation instead.
  const alternatives = [];
  for (const shift of [-1 / 60, 1 / 60]) {
    let maximum = 0;
    for (const d of direct) {
      const target = entry.renderTime + (d.time - (0.5 + 1 / 30)) + shift;
      if (target < entry.renderTime || target > exit + 0.18) continue;
      const f = reaction.frames.find(
        (f) => Math.abs(f.renderTime - target) < 1e-8,
      );
      assert(f);
      const dr = rotation(d),
        fr = rotation(f);
      for (let j = 0; j < 16; j++)
        maximum = Math.max(maximum, Math.abs(dr[j] - fr[j]));
    }
    alternatives.push(maximum);
  }
  assert(
    alternatives.every((error) => error > rotationMax),
    `${preset} ambiguous presentation alignment ${rotationMax} ${alternatives}`,
  );
  let scaleMax = 0,
    headphonesTranslationMax = 0,
    count = 0;
  for (const f of reaction.frames) {
    if (f.renderTime < entry.renderTime || f.renderTime > exit + 0.18) continue;
    const entering = f.renderTime < exit;
    const weight = entering
      ? 1 - smoother((f.renderTime - entry.renderTime) / 0.18)
      : smoother((f.renderTime - exit) / 0.18);
    const source = entering
      ? idleFrozen
      : idle.frames.find((g) => Math.abs(g.renderTime - f.renderTime) < 1e-8);
    assert(source);
    const nativeScale = scale(f),
      sourceScale = scale(source);
    for (let j = 0; j < 3; j++)
      scaleMax = Math.max(
        scaleMax,
        Math.abs(nativeScale[j] - (1 + (sourceScale[j] - 1) * weight)),
      );
    if (preset === 'lime_headphones')
      headphonesTranslationMax = Math.max(
        headphonesTranslationMax,
        Math.abs(
          f.draws[0].blocks.DrawBlock[13] -
            source.draws[0].blocks.DrawBlock[13] * weight,
        ),
      );
    count++;
  }
  if (preset === 'lime_headphones')
    assert(scaleMax < 3e-7, `${preset} scale residual ${scaleMax}`);
  assert(headphonesTranslationMax < 1e-9);
  report.presets[preset] = {
    nativeCommand: command.renderTime,
    frozenNativeTime: frozen.renderTime,
    entryNativeTime: entry.renderTime,
    exitNativeTime: exit,
    entryClipTime: entry.renderTime - command.renderTime,
    exitClipTime: exit - command.renderTime,
    coreSeconds,
    transitionSeconds: 0.18,
    normalizedBodyRotationMaximumError: rotationMax,
    adjacentPresentationErrors: alternatives,
    normalizedBodyRotationComparedFrames: rotationFrames,
    headphonesScaleMaximumError: preset === 'lime_headphones' ? scaleMax : null,
    headphonesTranslationMaximumError:
      preset === 'lime_headphones' ? headphonesTranslationMax : null,
    checkedFrames: count,
    sourceSha256: {
      directReaction: createHash('sha256').update(directBytes).digest('hex'),
      reaction: createHash('sha256').update(rt).digest('hex'),
      idle: createHash('sha256').update(it).digest('hex'),
    },
  };
}
const output =
  process.env.AVATAR_REACTION_GAZE_OUTPUT ||
  '.local/avatar-eye-activities/runtime-reaction-gaze-timing.json';
await writeFile(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
