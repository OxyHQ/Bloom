import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { Matrix4, Vector3 } from 'three';
import { AvatarGazeController } from '../runtime/avatar/gaze-controller.ts';
import {
  AvatarEyeGazeController,
  eyeClosureFromMorph,
} from '../runtime/avatar/eye-gaze-controller.ts';
const root = '.local/avatar-eye-activities/lime_headphones';
const read = async (path) => JSON.parse(await readFile(path, 'utf8'));
const baselineWork = await read(`${root}/work-baseline-raw.json`);
for (const [label, file] of [
  ['hover', 'work-gaze'],
  ['drag/up/cancel', 'drag/work-pointer'],
])
  test(`native activity mode ignores ${label}, including Start/Stop`, async () => {
    const frames = await read(`${root}/${file}-raw.json`);
    assert.equal(frames.length, 151);
    assert.equal(frames.length, baselineWork.length);
    assert(frames.some((f) => f.events.some((e) => e.kind === 'activity-start' && e.result === 0)));
    for (let k = 0; k < frames.length; k++) {
      assert.equal(frames[k].renderTime, baselineWork[k].renderTime);
      assert.equal(frames[k].draws.length, baselineWork[k].draws.length);
      for (let p = 0; p < frames[k].draws.length; p++) {
        assert.deepEqual(frames[k].draws[p].defines, baselineWork[k].draws[p].defines);
        assert.deepEqual(
          frames[k].draws[p].vertexAttributes,
          baselineWork[k].draws[p].vertexAttributes,
        );
        assert.deepEqual(
          frames[k].draws[p].blocks,
          baselineWork[k].draws[p].blocks,
          `${label} frame${k} part${p}`,
        );
      }
    }
  });
for (const observation of [
  { suffix: '', name: 'reaction-gaze', label: '30 Hz constant target' },
  {
    suffix: '/reaction-input',
    name: 'reaction-live-gaze',
    label: '60 Hz changed target during core',
  },
])
  test(`Headphones native reaction envelope: ${observation.label}`, async () => {
    const preset = 'lime_headphones';
    const root = `.local/avatar-eye-activities/${preset}${observation.suffix}`;
    const a = await read(`${root}/${observation.name}-raw.json`),
      b = await read(`${root}/reaction-baseline-raw.json`);
    const profiles = (await read('runtime/avatar/assets/eye-gaze-profiles.json')).presets[
      preset
    ][0];
    const body = new AvatarGazeController(),
      eyes = new AvatarEyeGazeController(),
      poseEyes = new AvatarEyeGazeController();
    const B = new Matrix4().makeRotationY((8 * Math.PI) / 180),
      inverse = B.clone().invert();
    const mat = (d, offset = 0) =>
      new Matrix4().fromArray(d.blocks.DrawBlock.slice(offset, offset + 16));
    const smoother = (value) => {
      let t = Math.max(0, Math.min(1, value));
      return t * t * t * (10 - 15 * t + 6 * t * t);
    };
    const command = 0.5,
      entry = command + (a[1].time - a[0].time),
      // Public Character reaction core duration; not inferred from runtime clip end.
      exit = entry + 2.1,
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
      const strength =
        t < entry
          ? 1
          : t < exit
            ? 1 - smoother((t - entry) / duration)
            : smoother((t - exit) / duration);
      const useFrozen = frozen && t < exit;
      const yaw = (useFrozen ? frozen.yaw : body.yaw) * strength,
        pitch = (useFrozen ? frozen.pitch : body.pitch) * strength;
      poseEyes.x = useFrozen ? frozen.x : eyes.x;
      poseEyes.y = useFrozen ? frozen.y : eyes.y;
      const rotation = B.clone()
        .multiply(new Matrix4().makeRotationY(yaw))
        .multiply(new Matrix4().makeRotationX(pitch))
        .multiply(inverse);
      const center = new Vector3().fromArray(base.draws[0].blocks.DrawBlock, 12);
      const delta = new Matrix4()
        .makeTranslation(...center.toArray())
        .multiply(rotation)
        .multiply(new Matrix4().makeTranslation(-center.x, -center.y, -center.z));
      if (strength === 0) {
        coreFrames++;
        for (let p = 0; p < frame.draws.length; p++)
          assert.deepEqual(frame.draws[p].blocks, base.draws[p].blocks);
      }
      for (let p = 0; p < frame.draws.length; p++) {
        const expected = delta.clone().multiply(mat(base.draws[p])),
          expectedN = rotation.clone().multiply(mat(base.draws[p], 16));
        if (profiles[p]) {
          const E = mat(base.draws[0]).invert().multiply(mat(base.draws[p])),
            c = new Matrix4(),
            n = new Matrix4();
          // There is no exposed blink here. The observed reaction suppresses gaze
          // throughout its core, and this finite window's entry/outro is fully open.
          const profile = profiles[p];
          const closure =
            profile.blink === 'external'
              ? 0
              : eyeClosureFromMorph(base.draws[p].blocks.DrawBlock.slice(36, 40), profile.blink);
          poseEyes.writeBeforePoseCorrection(profile, closure, E, c, n, strength);
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

for (const preset of [
  'alfred',
  'purple_heart',
  'lime_frog',
  'coral_monocle',
  'gus',
  'blue_spectacles',
  'lime_headphones',
])
  test(`${preset}: native reaction core suppresses gaze exactly across all block fields`, async () => {
    const path = `.local/avatar-eye-activities/${preset}`;
    const a = await read(`${path}/reaction-gaze-raw.json`),
      b = await read(`${path}/reaction-baseline-raw.json`);
    const duration = (await read(`runtime/avatar/assets/motion/${preset}.json`)).clips.reaction
      .duration;
    let checked = 0;
    for (let i = 0; i < a.length; i++) {
      if (a[i].time < 0.5 + 1 / 30 + 0.18 || a[i].time > 0.5 + duration - 0.2 - 1e-9) continue;
      assert.equal(a[i].renderTime, b[i].renderTime);
      assert.equal(a[i].draws.length, b[i].draws.length);
      for (let p = 0; p < a[i].draws.length; p++) {
        assert.deepEqual(
          a[i].draws[p].blocks,
          b[i].draws[p].blocks,
          `${preset} frame${i} part${p}`,
        );
        assert.deepEqual(a[i].draws[p].defines, b[i].draws[p].defines);
        assert.deepEqual(a[i].draws[p].vertexAttributes, b[i].draws[p].vertexAttributes);
      }
      checked++;
    }
    assert(checked >= 57);
  });

test('native reaction rejects an already held pointer, but accepted reaction responds to later drag with deformation', async () => {
  const root = '.local/avatar-eye-activities/lime_headphones/reaction-input';
  const held = await read(`${root}/reaction-pointer-raw.json`);
  assert.equal(held.flatMap((f) => f.events).find((e) => e.kind === 'reaction').result, 3);
  const active = await read(`${root}/reaction-active-pointer-raw.json`),
    base = await read(`${root}/reaction-baseline-raw.json`);
  assert.equal(active.flatMap((f) => f.events).find((e) => e.kind === 'reaction').result, 0);
  for (let i = 0; i <= 66; i++)
    assert.deepEqual(
      active[i].draws.map((d) => d.blocks),
      base[i].draws.map((d) => d.blocks),
    );
  assert.equal(active[67].time, 1.1166666666666667);
  assert.notDeepEqual(
    active[67].draws[0].blocks.DrawBlock.slice(0, 32),
    base[67].draws[0].blocks.DrawBlock.slice(0, 32),
  );
  assert.notEqual(active[67].draws[0].blocks.DrawBlock[89], base[67].draws[0].blocks.DrawBlock[89]);
  // Signature deformation disproves a purely rigid overlay or Work-style ignore.
  for (const j of [89, 90, 91])
    assert.notEqual(active[84].draws[0].blocks.DrawBlock[j], base[84].draws[0].blocks.DrawBlock[j]);
});
