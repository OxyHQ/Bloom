import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import ts from 'typescript';
import * as THREE from 'three';
const temporary = await mkdtemp('.local/eye-gaze-contract-');
async function load(name) {
  const file = `${temporary}/${name}.mjs`;
  await writeFile(
    file,
    ts.transpileModule(
      await readFile(`runtime/avatar/${name}.ts`, 'utf8'),
      {
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.ES2022,
        },
      },
    ).outputText,
  );
  return import(pathToFileURL(`${process.cwd()}/${file}`));
}
const { AvatarEyeGazeController, eyeClosureFromMorph } = await load(
  'eye-gaze-controller',
);
const { AvatarGazeController } = await load('gaze-controller');
const { AvatarPointerController } = await load('pointer-controller');
test.after(() => rm(temporary, { recursive: true, force: true }));
const read = async (p) => JSON.parse(await readFile(p, 'utf8'));
const profiles = await read(
  'runtime/avatar/assets/eye-gaze-profiles.json',
);
const presets = (
  process.env.AVATAR_EYE_PRESETS ||
  'lime_frog,blue_spectacles,lime_headphones,coral_monocle'
).split(',');
for (const preset of presets)
  for (const [source, name] of [
    ['.local/avatar-pointer-validation', 'pointer'],
    ['.local/avatar-gaze-axes', 'horizontal'],
    ['.local/avatar-gaze-axes', 'vertical'],
    ['.local/avatar-gaze-high', 'diagonal'],
    ...(preset === 'lime_headphones'
      ? [['.local/avatar-gaze-extended', 'constant']]
      : []),
    ...(preset === 'lime_frog'
      ? [['.local/avatar-gaze-extended', 'outside']]
      : []),
  ])
    test(`${preset} ${name}: every native world/normal/material channel and blink`, async () => {
      const frames = await read(`${source}/${preset}/${name}-raw.json`);
      const baseline = await read(`${source}/${preset}/idle-raw.json`);
      // This explicitly proves shared native-time blink in this observation. It is
      // not a runtime dependency on another avatar or proof for other actions.
      const blinkReference =
        preset === 'lime_headphones'
          ? await read(`${source}/lime_frog/idle-raw.json`)
          : null;
      const idle = new Map(baseline.map((f) => [f.time, f]));
      const eyes = new AvatarEyeGazeController(),
        body = new AvatarGazeController(),
        pointer = new AvatarPointerController();
      const basis = new THREE.Matrix4().makeRotationY((8 * Math.PI) / 180),
        inverse = basis.clone().invert();
      const correction = new THREE.Matrix4(),
        correctionN = new THREE.Matrix4();
      let previous = 0,
        worldMax = 0,
        normalRelativeMax = 0,
        blinkSamples = 0,
        worst;
      for (let frameIndex = 0; frameIndex < frames.length; frameIndex++) {
        const frame = frames[frameIndex],
          reference = idle.get(frame.time);
        assert(reference);
        assert.equal(frame.renderTime, reference.renderTime);
        pointer.sample(frame.time);
        const rotation = basis
          .clone()
          .multiply(new THREE.Matrix4().makeRotationY(pointer.yaw + body.yaw))
          .multiply(
            new THREE.Matrix4().makeRotationX(pointer.pitch + body.pitch),
          )
          .multiply(inverse);
        const center = new THREE.Vector3().fromArray(
          reference.draws[0].blocks.DrawBlock,
          12,
        );
        const delta = new THREE.Matrix4()
          .makeTranslation(...center.toArray())
          .multiply(rotation)
          .multiply(
            new THREE.Matrix4().makeTranslation(
              -center.x,
              -center.y,
              -center.z,
            ),
          );
        assert.equal(frame.draws.length, reference.draws.length);
        for (let id = 0; id < frame.draws.length; id++) {
          const actual = frame.draws[id],
            original = reference.draws[id];
          assert.deepEqual(actual.defines, original.defines);
          assert.deepEqual(actual.vertexAttributes, original.vertexAttributes);
          assert.deepEqual(
            actual.blocks.FrameBlock,
            original.blocks.FrameBlock,
          );
          assert.deepEqual(actual.blocks.SkinBlock, original.blocks.SkinBlock);
          assert.deepEqual(
            actual.blocks.DrawBlock.slice(32),
            original.blocks.DrawBlock.slice(32),
          );
          const expected = delta
            .clone()
            .multiply(new THREE.Matrix4().fromArray(original.blocks.DrawBlock));
          const expectedN = rotation
            .clone()
            .multiply(
              new THREE.Matrix4().fromArray(
                original.blocks.DrawBlock.slice(16, 32),
              ),
            );
          const profile =
            profiles.presets[preset][
              source === '.local/avatar-gaze-high' ? 1 : 0
            ][id];
          if (profile) {
            let closure;
            if (profile.blink === 'external') {
              const blinkFrame = blinkReference[frameIndex];
              assert.equal(blinkFrame.renderTime, frame.renderTime);
              closure = eyeClosureFromMorph(
                blinkFrame.draws[1].blocks.DrawBlock.slice(36, 40),
                'integrated',
              );
            } else
              closure = eyeClosureFromMorph(
                original.blocks.DrawBlock.slice(36, 40),
                profile.blink,
              );
            if (closure > 0.01) blinkSamples++;
            eyes.writeCorrection(profile, closure, correction, correctionN);
            expected.multiply(correction);
            expectedN.multiply(correctionN);
          }
          const magnitude = Math.max(
            1,
            ...original.blocks.DrawBlock.slice(16, 32).map(Math.abs),
          );
          for (let k = 0; k < 16; k++) {
            const e = Math.abs(
              expected.elements[k] - actual.blocks.DrawBlock[k],
            );
            if (e > worldMax) {
              worldMax = e;
              worst = {
                time: frame.time,
                id,
                k,
                actual: actual.blocks.DrawBlock[k],
                expected: expected.elements[k],
              };
            }
            normalRelativeMax = Math.max(
              normalRelativeMax,
              Math.abs(
                expectedN.elements[k] - actual.blocks.DrawBlock[16 + k],
              ) / magnitude,
            );
          }
        }
        const dt = frame.time - previous;
        previous = frame.time;
        body.advance(dt);
        eyes.advance(dt);
        for (const event of frame.events) {
          if (event.kind === 'pointer-down')
            pointer.down(event.x, event.y, frame.time);
          else if (event.kind === 'pointer') pointer.move(event.x, event.y);
          else if (
            event.kind === 'pointer-up' ||
            event.kind === 'pointer-cancel'
          )
            pointer.up(frame.time);
          if (event.kind.startsWith('pointer') && event.x !== undefined) {
            body.point(event.x, event.y);
            eyes.point(event.x, event.y);
          }
        }
      }
      console.log({
        preset,
        name,
        worldMax,
        normalRelativeMax,
        blinkSamples,
        worst,
      });
      assert(blinkSamples > 0, 'Real blink samples are required');
      assert(worldMax < 1e-6, JSON.stringify(worst));
      assert(
        normalRelativeMax < 3e-7,
        `normal relative error ${normalRelativeMax}`,
      );
    });
test('projection preserves depth; inverse transpose preserves tangent/normal orthogonality', () => {
  const eyes = new AvatarEyeGazeController();
  eyes.point(0.9, 0.2);
  eyes.advance(1);
  const world = new THREE.Matrix4(),
    normal = new THREE.Matrix4();
  eyes.writeCorrection(profiles.presets.lime_frog[0][1], 0, world, normal);
  assert.notEqual(world.elements[8], 0);
  for (const index of [2, 6, 14]) assert.equal(world.elements[index], 0);
  assert.equal(world.elements[10], 1);
  const tangent = new THREE.Vector3(0, 0, 1).transformDirection(world);
  const n = new THREE.Vector3(1, 0, 0).transformDirection(normal);
  assert(Math.abs(tangent.dot(n)) < 1e-14);
  eyes.writeCorrection(profiles.presets.lime_frog[0][1], 1, world, normal);
  assert.deepEqual(world.elements, new THREE.Matrix4().elements);
  assert.throws(() =>
    eyes.writeCorrection(
      profiles.presets.lime_headphones[0][1],
      NaN,
      world,
      normal,
    ),
  );
});
test('LOD-specific eye dimensions must survive export', () => {
  assert.notDeepEqual(
    profiles.presets.lime_headphones[0][1].halfSize,
    profiles.presets.lime_headphones[1][1].halfSize,
  );
});
