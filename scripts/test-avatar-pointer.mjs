import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import ts from 'typescript';
import * as THREE from 'three';
const temporary = await mkdtemp('.local/pointer-contract-');
await writeFile(
  `${temporary}/pointer.mjs`,
  ts.transpileModule(await readFile('runtime/avatar/pointer-controller.ts', 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
  }).outputText,
);
const { AvatarPointerController } = await import(
  pathToFileURL(`${process.cwd()}/${temporary}/pointer.mjs`)
);
test.after(() => rm(temporary, { recursive: true, force: true }));
const read = async (p) => JSON.parse(await readFile(p, 'utf8'));

async function compare(source, name) {
  const baseline = await read(`${source}/idle-raw.json`);
  const frames = await read(`${source}/${name}-raw.json`);
  const idle = new Map(baseline.map((f) => [f.time, f]));
  const pointer = new AvatarPointerController();
  const basis = new THREE.Matrix4().makeRotationY((8 * Math.PI) / 180);
  const inverse = basis.clone().invert();
  let worldMax = 0,
    normalMax = 0,
    normalRelativeMax = 0,
    worst,
    worstNormal;
  for (const frame of frames) {
    pointer.sample(frame.time);
    const rotation = basis
      .clone()
      .multiply(new THREE.Matrix4().makeRotationY(pointer.yaw))
      .multiply(new THREE.Matrix4().makeRotationX(pointer.pitch))
      .multiply(inverse);
    const paired = idle.get(frame.time);
    assert(paired, `Missing independent baseline at ${frame.time}`);
    assert.equal(frame.draws.length, paired.draws.length);
    for (let p = 0; p < frame.draws.length; p++) {
      const actual = frame.draws[p],
        expected = paired.draws[p];
      assert.equal(actual.method, expected.method);
      assert.deepEqual(actual.defines, expected.defines);
      assert.deepEqual(actual.vertexAttributes, expected.vertexAttributes);
      assert.deepEqual(
        actual.blocks.FrameBlock,
        expected.blocks.FrameBlock,
        'Pointer leaves the camera/lighting unchanged',
      );
      assert.deepEqual(actual.blocks.SkinBlock, expected.blocks.SkinBlock);
      assert.deepEqual(
        actual.blocks.DrawBlock.slice(32),
        expected.blocks.DrawBlock.slice(32),
        'Pointer preserves every material channel',
      );
      for (const offset of [0, 16]) {
        const matrix = rotation
          .clone()
          .multiply(
            new THREE.Matrix4().fromArray(expected.blocks.DrawBlock.slice(offset, offset + 16)),
          );
        for (let k = 0; k < 16; k++) {
          const error = Math.abs(matrix.elements[k] - actual.blocks.DrawBlock[offset + k]);
          if (offset === 0 && error > worldMax) {
            worldMax = error;
            worst = {
              time: frame.time,
              p,
              k,
              expected: matrix.elements[k],
              actual: actual.blocks.DrawBlock[k],
              yaw: pointer.yaw,
              pitch: pointer.pitch,
            };
          }
          if (offset === 16) {
            const magnitude = Math.max(1, ...expected.blocks.DrawBlock.slice(16, 32).map(Math.abs));
            normalRelativeMax = Math.max(normalRelativeMax, error / magnitude);
            if (error > normalMax) {
              normalMax = error;
              worstNormal = {
                time: frame.time,
                p,
                k,
                expected: matrix.elements[k],
                actual: actual.blocks.DrawBlock[offset + k],
                magnitude,
              };
            }
          }
        }
      }
    }
    // Public native render presents the pose before that iteration's input
    // update; the following observed frame is the first affected presentation.
    for (const event of frame.events) {
      if (event.kind === 'pointer-down') pointer.down(event.x, event.y, frame.time);
      else if (event.kind === 'pointer') pointer.move(event.x, event.y);
      else if (event.kind === 'pointer-up' || event.kind === 'pointer-cancel')
        pointer.up(frame.time);
    }
  }
  assert(worldMax < 1e-6, `${source}/${name} world: ${JSON.stringify({ worldMax, worst })}`);
  assert(
    normalRelativeMax < 3e-7,
    `${source}/${name} normal: ${JSON.stringify({ normalMax, normalRelativeMax, worstNormal })}`,
  );
  return { frames: frames.length, worldMax, normalMax, normalRelativeMax, worstNormal };
}

for (const name of ['drag-horizontal', 'drag-vertical', 'drag-diagonal'])
  test(`60Hz independent native blue ${name}: every world/normal/material/camera channel`, async () => {
    console.log(name, await compare('.local/avatar-pointer-source/blue_beret', name));
  });

if (process.env.AVATAR_POINTER_AXES_ONLY !== '1')
  for (const preset of (process.env.AVATAR_POINTER_PRESETS || 'blue_beret').split(','))
    test(`${preset}: held-out 30Hz hover, drag, reverse, release, regrab, cancel`, async () => {
      console.log(preset, await compare(`.local/avatar-pointer-validation/${preset}`, 'pointer'));
    });

test('unpressed hover never rotates; instances retain independent gestures', () => {
  const a = new AvatarPointerController(),
    b = new AvatarPointerController();
  a.move(1, 0);
  assert.equal(a.yaw, 0);
  assert.equal(a.pitch, 0);
  a.down(0.5, 0.5, 0);
  a.move(0.6, 0.4);
  assert(a.yaw > 0 && a.pitch < 0);
  assert.equal(b.yaw, 0);
  assert.equal(b.pitch, 0);
  a.up(1);
  a.sample(2);
  assert(a.yaw > 0 && a.yaw < 0.001);
  a.reset();
  a.sample(3);
  assert.equal(a.yaw, 0);
  assert.equal(a.pitch, 0);
});
