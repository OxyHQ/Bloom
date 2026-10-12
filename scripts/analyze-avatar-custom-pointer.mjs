/** Native pointer response analysis. Fit coordinates are diagnostics, not runtime approximation. */
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import * as THREE from 'three';
const presets = (
  process.env.AVATAR_POINTER_PRESETS ||
  'blue_beret,alfred,purple_heart,lime_frog,coral_monocle,gus,blue_spectacles,lime_headphones'
).split(',');
const root =
  process.env.AVATAR_POINTER_SOURCE || '.local/avatar-pointer-validation';
const output =
  process.env.AVATAR_POINTER_ANALYSIS ||
  '.local/avatar-custom-pointer-analysis.json';
const reports = [];
const basis = new THREE.Matrix4().makeRotationY((8 * Math.PI) / 180),
  inverse = basis.clone().invert();
for (const preset of presets) {
  let idle, frames;
  try {
    idle = JSON.parse(await readFile(`${root}/${preset}/idle-raw.json`));
    frames = JSON.parse(
      await readFile(
        `${root}/${preset}/${process.env.AVATAR_POINTER_NAME || 'pointer'}-raw.json`,
      ),
    );
  } catch (e) {
    if (e.code === 'ENOENT') continue;
    throw e;
  }
  const byTime = new Map(idle.map((f) => [f.time, f]));
  const result = {
    preset,
    samples: [],
    worldRigidMax: 0,
    materialMax: 0,
    cameraMax: 0,
    skinMax: 0,
    deltaTranslationMax: 0,
    decompositionMax: 0,
  };
  for (const frame of frames) {
    const ref = byTime.get(frame.time);
    assert(ref);
    if (!frame.draws.length || !ref.draws.length) continue;
    assert.equal(frame.draws.length, ref.draws.length);
    const delta = new THREE.Matrix4()
      .fromArray(frame.draws[0].blocks.DrawBlock)
      .multiply(
        new THREE.Matrix4().fromArray(ref.draws[0].blocks.DrawBlock).invert(),
      );
    const local = inverse.clone().multiply(delta).multiply(basis),
      rotation = new THREE.Euler().setFromRotationMatrix(local, 'YXZ');
    const reconstructed = basis
      .clone()
      .multiply(new THREE.Matrix4().makeRotationY(rotation.y))
      .multiply(new THREE.Matrix4().makeRotationX(rotation.x))
      .multiply(inverse);
    result.deltaTranslationMax = Math.max(
      result.deltaTranslationMax,
      ...delta.elements.slice(12, 15).map(Math.abs),
    );
    result.decompositionMax = Math.max(
      result.decompositionMax,
      ...delta.elements.map((v, k) => Math.abs(v - reconstructed.elements[k])),
    );
    for (let p = 0; p < frame.draws.length; p++) {
      const a = frame.draws[p].blocks,
        b = ref.draws[p].blocks;
      const expected = delta
        .clone()
        .multiply(new THREE.Matrix4().fromArray(b.DrawBlock));
      result.worldRigidMax = Math.max(
        result.worldRigidMax,
        ...expected.elements.map((v, k) => Math.abs(v - a.DrawBlock[k])),
      );
      result.materialMax = Math.max(
        result.materialMax,
        ...a.DrawBlock.slice(32).map((v, k) =>
          Math.abs(v - b.DrawBlock[k + 32]),
        ),
      );
      result.cameraMax = Math.max(
        result.cameraMax,
        ...a.FrameBlock.map((v, k) => Math.abs(v - b.FrameBlock[k])),
      );
      result.skinMax = Math.max(
        result.skinMax,
        ...a.SkinBlock.map((v, k) => Math.abs(v - b.SkinBlock[k])),
      );
    }
    result.samples.push({
      time: frame.time,
      yaw: rotation.y,
      pitch: rotation.x,
      roll: rotation.z,
      events: frame.events,
    });
  }
  reports.push(result);
  console.log(
    JSON.stringify({
      ...result,
      samples: result.samples.filter(
        (f) =>
          f.events.length ||
          [0.3, 0.6, 1, 1.4, 1.9, 2.5, 3, 4].some(
            (t) => Math.abs(f.time - t) < 1e-9,
          ),
      ),
    }),
  );
}
await writeFile(output, JSON.stringify(reports, null, 2));
