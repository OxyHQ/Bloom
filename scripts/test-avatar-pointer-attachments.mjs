import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import ts from 'typescript';
import * as T from 'three';
const tmp = await mkdtemp('.local/pointer-attachments-');
async function load(name) {
  const path = `${tmp}/${name}.mjs`;
  await writeFile(
    path,
    ts.transpileModule(await readFile(`runtime/avatar/${name}.ts`, 'utf8'), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
    }).outputText,
  );
  return import(pathToFileURL(`${process.cwd()}/${path}`));
}
const { AvatarPointerController } = await load('pointer-controller'),
  { AvatarGazeController } = await load('gaze-controller');
test.after(() => rm(tmp, { recursive: true, force: true }));
const ocular = {
  alfred: [],
  purple_heart: [],
  lime_frog: [1, 2, 3, 4],
  coral_monocle: [3, 4],
  gus: [],
  blue_spectacles: [1, 2, 3, 4],
  lime_headphones: [1, 2],
};
for (const [preset, excluded] of Object.entries(ocular))
  test(`${preset}: all non-ocular attachments follow native body pivot`, async () => {
    const read = async (name) =>
      JSON.parse(
        await readFile(`.local/avatar-pointer-validation/${preset}/${name}-raw.json`, 'utf8'),
      );
    const frames = await read('pointer'),
      base = new Map((await read('idle')).map((f) => [f.time, f]));
    const pointer = new AvatarPointerController(),
      gaze = new AvatarGazeController(),
      B = new T.Matrix4().makeRotationY((8 * Math.PI) / 180),
      inv = B.clone().invert();
    let previous = 0,
      worldMax = 0,
      normalRelativeMax = 0,
      worst;
    for (const f of frames) {
      pointer.sample(f.time);
      const idle = base.get(f.time);
      const rotation = B.clone()
        .multiply(new T.Matrix4().makeRotationY(pointer.yaw + gaze.yaw))
        .multiply(new T.Matrix4().makeRotationX(pointer.pitch + gaze.pitch))
        .multiply(inv);
      const pivot = new T.Vector3().fromArray(idle.draws[0].blocks.DrawBlock, 12);
      const transform = rotation
        .clone()
        .setPosition(pivot.clone().sub(pivot.clone().applyMatrix4(rotation)));
      for (let p = 0; p < f.draws.length; p++) {
        if (excluded.includes(p)) continue;
        for (const offset of [0, 16]) {
          const raw = idle.draws[p].blocks.DrawBlock.slice(offset, offset + 16),
            actual = f.draws[p].blocks.DrawBlock;
          const expected = (offset === 0 ? transform : rotation)
            .clone()
            .multiply(new T.Matrix4().fromArray(raw));
          const magnitude = Math.max(1, ...raw.map(Math.abs));
          for (let k = 0; k < 16; k++) {
            const e = Math.abs(expected.elements[k] - actual[offset + k]);
            if (offset === 0 && e > worldMax) {
              worldMax = e;
              worst = { time: f.time, p, k, expected: expected.elements[k], actual: actual[k] };
            }
            if (offset === 16) normalRelativeMax = Math.max(normalRelativeMax, e / magnitude);
          }
        }
      }
      gaze.advance(f.time - previous);
      previous = f.time;
      for (const e of f.events) {
        if (e.kind === 'pointer-down') pointer.down(e.x, e.y, f.time);
        else if (e.kind === 'pointer') pointer.move(e.x, e.y);
        else pointer.up(f.time);
        gaze.point(e.x, e.y);
      }
    }
    console.log(preset, { worldMax, normalRelativeMax, worst });
    assert(worldMax < 1e-6, JSON.stringify(worst));
    assert(normalRelativeMax < 3e-7);
  });
