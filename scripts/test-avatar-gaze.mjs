import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import ts from 'typescript';
import * as THREE from 'three';
const temporary = await mkdtemp('.local/gaze-contract-');
async function load(name) {
  const file = `${temporary}/${name}.mjs`;
  await writeFile(
    file,
    ts.transpileModule(await readFile(`runtime/avatar/${name}.ts`, 'utf8'), {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
      },
    }).outputText,
  );
  return import(pathToFileURL(`${process.cwd()}/${file}`));
}
const { AvatarGazeController } = await load('gaze-controller');
const { AvatarPointerController } = await load('pointer-controller');
test.after(() => rm(temporary, { recursive: true, force: true }));
const presets = (
  process.env.AVATAR_GAZE_PRESETS ||
  'alfred,purple_heart,lime_frog,coral_monocle,gus,blue_spectacles,lime_headphones'
).split(',');
for (const preset of presets)
  test(`${preset}: native body hover + drag, including reversals and cancellation`, async () => {
    const root = process.env.AVATAR_GAZE_SOURCE || '.local/avatar-pointer-validation';
    const frames = JSON.parse(
      await readFile(`${root}/${preset}/${process.env.AVATAR_GAZE_NAME || 'pointer'}-raw.json`),
    );
    const idle = JSON.parse(await readFile(`${root}/${preset}/idle-raw.json`));
    const baseline = new Map(idle.map((f) => [f.time, f]));
    const gaze = new AvatarGazeController(),
      pointer = new AvatarPointerController();
    const basis = new THREE.Matrix4().makeRotationY((8 * Math.PI) / 180),
      inverse = basis.clone().invert();
    let previous = 0,
      worldMax = 0,
      normalRelativeMax = 0,
      worst;
    for (const frame of frames) {
      pointer.sample(frame.time);
      const reference = baseline.get(frame.time);
      assert(reference);
      assert.equal(frame.draws.length, reference.draws.length);
      const rotation = basis
        .clone()
        .multiply(new THREE.Matrix4().makeRotationY(pointer.yaw + gaze.yaw))
        .multiply(new THREE.Matrix4().makeRotationX(pointer.pitch + gaze.pitch))
        .multiply(inverse);
      const actual = frame.draws[0].blocks.DrawBlock,
        original = reference.draws[0].blocks.DrawBlock;
      for (const offset of [0, 16]) {
        const expected = rotation
          .clone()
          .multiply(new THREE.Matrix4().fromArray(original.slice(offset, offset + 16)));
        if (offset === 0) expected.setPosition(original[12], original[13], original[14]);
        const magnitude = Math.max(1, ...original.slice(offset, offset + 16).map(Math.abs));
        for (let k = 0; k < 16; k++) {
          const error = Math.abs(expected.elements[k] - actual[offset + k]);
          if (offset === 0 && error > worldMax) {
            worldMax = error;
            worst = {
              time: frame.time,
              k,
              actual: actual[k],
              expected: expected.elements[k],
              yaw: gaze.yaw,
              pitch: gaze.pitch,
            };
          }
          if (offset === 16) normalRelativeMax = Math.max(normalRelativeMax, error / magnitude);
        }
      }
      for (let p = 0; p < frame.draws.length; p++) {
        assert.deepEqual(
          frame.draws[p].blocks.DrawBlock.slice(32),
          reference.draws[p].blocks.DrawBlock.slice(32),
        );
        assert.deepEqual(frame.draws[p].blocks.FrameBlock, reference.draws[p].blocks.FrameBlock);
        assert.deepEqual(frame.draws[p].blocks.SkinBlock, reference.draws[p].blocks.SkinBlock);
      }
      // Native presents the existing hover state, advances the spring, then updates input.
      gaze.advance(frame.time - previous);
      previous = frame.time;
      for (const event of frame.events) {
        if (event.kind === 'pointer-down') pointer.down(event.x, event.y, frame.time);
        else if (event.kind === 'pointer') pointer.move(event.x, event.y);
        else if (event.kind === 'pointer-up' || event.kind === 'pointer-cancel')
          pointer.up(frame.time);
        if (event.kind.startsWith('pointer') && event.x !== undefined) gaze.point(event.x, event.y);
      }
    }
    console.log(preset, { worldMax, normalRelativeMax, worst });
    assert(worldMax < 1e-6, JSON.stringify(worst));
    assert(normalRelativeMax < 3e-7);
  });
test('critical spring is time-partition independent for a constant target', () => {
  const a = new AvatarGazeController(),
    b = new AvatarGazeController();
  a.point(0.8, 0.2);
  b.point(0.8, 0.2);
  a.advance(0.3);
  for (let i = 0; i < 18; i++) b.advance(1 / 60);
  assert(Math.abs(a.yaw - b.yaw) < 1e-15);
  assert(Math.abs(a.pitch - b.pitch) < 1e-15);
  assert.throws(() => a.advance(-1));
  assert.throws(() => a.point(NaN, 0));
  a.reset();
  assert.equal(a.yaw, 0);
  assert.equal(a.pitch, 0);
  assert.notEqual(b.yaw, 0);
});
