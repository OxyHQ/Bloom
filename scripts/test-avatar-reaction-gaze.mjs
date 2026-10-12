import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { Matrix4, Vector3, Quaternion } from 'three';
import { AvatarGazeController } from '../runtime/avatar/gaze-controller.ts';
import {
  AvatarEyeGazeController,
  eyeClosureFromMorph,
} from '../runtime/avatar/eye-gaze-controller.ts';
import { ReactionGazeComposer, reactionGazeEnvelope } from '../runtime/avatar/reaction-gaze.ts';
const read = async (p) => JSON.parse(await readFile(p, 'utf8'));
for (const key of [
  'alfred',
  'purple_heart',
  'lime_frog',
  'coral_monocle',
  'gus',
  'blue_spectacles',
  'lime_headphones',
  'lime_headphones60',
  'lime_headphones_phase3',
])
  test(`${key} native reaction composition`, async () => {
    const phase3 = key.endsWith('_phase3');
    const sixty = key.endsWith('60') || phase3;
    const preset = sixty ? 'lime_headphones' : key;
    const composer = new ReactionGazeComposer();

    const root = `.local/avatar-eye-activities/${preset}${phase3 ? '/reaction-phase3' : sixty ? '/reaction-input' : ''}`;
    const a = await read(
        `${root}/${sixty && !phase3 ? 'reaction-live-gaze' : 'reaction-gaze'}-raw.json`,
      ),
      b = await read(`${root}/reaction-baseline-raw.json`);
    const profiles =
      (await read('runtime/avatar/assets/eye-gaze-profiles.json')).presets[preset]?.[0] || {};
    const idle = await read(
      `.local/${sixty ? 'avatar-gaze-extended' : 'avatar-pointer-validation'}/${preset}/idle-raw.json`,
    );
    const body = new AvatarGazeController(),
      eyes = new AvatarEyeGazeController(),
      poseEyes = new AvatarEyeGazeController();
    const mat = (d, offset = 0) =>
      new Matrix4().fromArray(d.blocks.DrawBlock.slice(offset, offset + 16));
    const blinkFrames = phase3
      ? await read('.local/avatar-gaze-extended/lime_frog/idle-raw.json')
      : null;
    const closureAt = (time) =>
      eyeClosureFromMorph(
        blinkFrames
          .find((f) => Math.abs(f.renderTime - time) < 1e-8)
          .draws[1].blocks.DrawBlock.slice(36, 40),
        'integrated',
      );
    const command = phase3 ? 1 : 0.5,
      entry = command + (a[1].time - a[0].time),
      // Public Character reaction core duration; not inferred from runtime clip end.
      exit =
        entry +
        {
          alfred: 2.2,
          purple_heart: 2.4,
          lime_frog: 2.5,
          coral_monocle: 2.5,
          gus: 2.6,
          blue_spectacles: 2.6,
          lime_headphones: 2.1,
        }[preset],
      duration = 0.18;
    const perPart = {};
    let frozen,
      previous = 0,
      worldMax = 0,
      normalRelativeMax = 0,
      worst,
      coreFrames = 0;
    for (let k = 0; k < a.length; k++) {
      const frame = a[k],
        base = b[k],
        t = frame.time;
      if (frame.events.some((e) => e.kind === 'reaction'))
        frozen = {
          yaw: body.yaw,
          pitch: body.pitch,
          x: eyes.x,
          y: eyes.y,
          base,
        };
      const { strength } = reactionGazeEnvelope(t - entry, exit - entry);
      const useFrozen = frozen && t < exit;
      const yaw = (useFrozen ? frozen.yaw : body.yaw) * strength,
        pitch = (useFrozen ? frozen.pitch : body.pitch) * strength;
      poseEyes.x = useFrozen ? frozen.x : eyes.x;
      poseEyes.y = useFrozen ? frozen.y : eyes.y;
      const rotation = new Matrix4(),
        delta = new Matrix4();
      const idleBase = idle.find((f) => Math.abs(f.renderTime - base.renderTime) < 1e-7);
      const center =
        frozen && t < exit + duration
          ? new Vector3()
              .fromArray((t < exit ? frozen.base : idleBase).draws[0].blocks.DrawBlock, 12)
              .multiplyScalar(strength)
          : new Vector3().fromArray(base.draws[0].blocks.DrawBlock, 12);
      const bodyScale = new Vector3();
      mat(base.draws[0]).decompose(new Vector3(), new Quaternion(), bodyScale);
      composer.writeBodyCorrection(yaw, pitch, center.toArray(), delta, rotation);
      if (strength === 0) {
        coreFrames++;
        for (let p = 0; p < frame.draws.length; p++)
          assert.deepEqual(frame.draws[p].blocks, base.draws[p].blocks);
      }
      for (let p = 0; p < frame.draws.length; p++) {
        assert.deepEqual(frame.draws[p].blocks.FrameBlock, base.draws[p].blocks.FrameBlock);
        assert.deepEqual(frame.draws[p].blocks.SkinBlock, base.draws[p].blocks.SkinBlock);
        assert.deepEqual(frame.draws[p].defines, base.draws[p].defines);
        assert.deepEqual(frame.draws[p].vertexAttributes, base.draws[p].vertexAttributes);
        const expected = delta.clone().multiply(mat(base.draws[p])),
          expectedN = rotation.clone().multiply(mat(base.draws[p], 16));
        if (profiles[p]) {
          const E = mat(base.draws[0]).invert().multiply(mat(base.draws[p])),
            c = new Matrix4(),
            n = new Matrix4();
          // Headphones hides blink in its exposed morph. The phase-3 control
          // supplies an independently observed scalar, blended toward zero in
          // reaction. Earlier controls have open entry/outro windows.
          const profile = profiles[p];
          const closure =
            profile.blink === 'external'
              ? phase3
                ? closureAt(useFrozen ? frozen.base.renderTime : base.renderTime) *
                  (frozen && t < exit + duration ? strength : 1)
                : 0
              : eyeClosureFromMorph(base.draws[p].blocks.DrawBlock.slice(36, 40), profile.blink);
          composer.writeEyeCorrection(
            poseEyes,
            profile,
            closure,
            strength,
            center.toArray(),
            bodyScale.toArray(),
            mat(base.draws[p]),
            c,
            n,
          );
          expected.multiply(c);
          expectedN.multiply(n);
        }
        const scale = Math.max(1, ...base.draws[p].blocks.DrawBlock.slice(16, 32).map(Math.abs));
        for (let j = 0; j < 16; j++) {
          const error = Math.abs(expected.elements[j] - frame.draws[p].blocks.DrawBlock[j]);
          perPart[p] = Math.max(perPart[p] || 0, error);
          if (error > worldMax) {
            worldMax = error;
            worst = { time: t, p, j, error, strength };
          }
          normalRelativeMax = Math.max(
            normalRelativeMax,
            Math.abs(expectedN.elements[j] - frame.draws[p].blocks.DrawBlock[16 + j]) / scale,
          );
        }
        assert.deepEqual(
          frame.draws[p].blocks.DrawBlock.slice(32),
          base.draws[p].blocks.DrawBlock.slice(32),
        );
      }
      body.advance(t - previous);
      eyes.advance(t - previous);
      previous = t;
      for (const e of frame.events)
        if (e.kind === 'pointer') {
          body.point(e.x, e.y);
          eyes.point(e.x, e.y);
        }
    }
    console.log({
      preset,
      perPart,
      worldMax,
      normalRelativeMax,
      coreFrames,
      worst,
    });
    assert(coreFrames > 40);
    assert(worldMax < 1e-6, JSON.stringify(worst));
    assert(normalRelativeMax < 3e-7);
  });

test('neutral composition validates frames and envelope boundaries', () => {
  const c = new ReactionGazeComposer(),
    out = new Matrix4();
  assert.throws(() => c.writeNeutralFrame([0, 0, 0], [1, 0, 1], out));
  assert.throws(() => c.writeNeutralFrame([0, NaN, 0], [1, 1, 1], out));
  assert.throws(() => reactionGazeEnvelope(0, 0.1));
  assert.deepEqual(reactionGazeEnvelope(0, 2.1), { frozen: true, strength: 1 });
  assert.deepEqual(reactionGazeEnvelope(0.18, 2.1), {
    frozen: true,
    strength: 0,
  });
  assert.deepEqual(reactionGazeEnvelope(2.1, 2.1), {
    frozen: false,
    strength: 0,
  });
  assert(Math.abs(reactionGazeEnvelope(2.28, 2.1).strength - 1) < 1e-12);
});
