/** Build the semantic catalog controller library from validated offline rigs.
 * No rendering engine, assembly ABI, or draw-command stream ships in this data. */
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { catalogObservation } from './build-avatar-catalog-motion.mjs';
import { calibrateCatalogMaterials } from './calibrate-avatar-catalog-materials.mjs';
import { encodeMotionBinary } from './build-avatar-motion-binary.mjs';
const read = async (p) => JSON.parse(await readFile(p, 'utf8'));
const presets = [
  'blue_beret',
  'alfred',
  'purple_heart',
  'lime_frog',
  'coral_monocle',
  'gus',
  'blue_spectacles',
  'lime_headphones',
];
const out =
  process.env.AVATAR_CATALOG_MOTION_DESTINATION ||
  '.local/avatar-catalog-motion-library';
const start = 3.683333333333333,
  end = 9.633333333333333;
const centering = await read('.local/avatar-catalog-eye-centering.json');
const anchors = await read('.local/avatar-catalog-anchor-response.json');
const sizes = await read('.local/avatar-catalog-scale-response.json');
const equal = (a, b) => a.length === b.length && a.every((v, k) => v === b[k]);
function trim(raw, a, b) {
  const frames = raw.frames.filter(
    (f) => f.renderTime >= a - 1e-8 && f.renderTime <= b + 1e-8,
  );
  assert(Math.abs(frames[0].renderTime - a) < 1e-8);
  assert(Math.abs(frames.at(-1).renderTime - b) < 1e-8);
  return { ...raw, frames };
}
await mkdir(out, { recursive: true });
for (const preset of presets) {
  const rigs = [];
  for (const g of [0, 1]) {
    const base = `.local/avatar-catalog-rig/rig${g}`;
    const [manifest, geometry, shared, idle, reaction, work, wgeom, wmanifest] =
      await Promise.all([
        read(`${base}/manifest.json`),
        read(`${base}/combined-geometry.json`),
        read(`${base}/shared-idle/idle-raw.json`),
        read(`${base}/${preset}/idle-raw.json`),
        read(`${base}/${preset}/reaction-raw.json`),
        read(`${base}/work/work-raw.json`),
        read(`${base}/combined-work-geometry.json`),
        read(`${base}/work-manifest.json`),
      ]);
    const longIdle = structuredClone(shared);
    // Signature identity is constant in idle; all other fields and transforms
    // must agree with the independently observed profile at matching clocks.
    for (let p = 0; p < idle.frames[0].draws.length; p++)
      for (let k = 0; k < 92; k++) {
        const v = idle.frames[0].draws[p].blocks.DrawBlock[k];
        const constant = idle.frames.every(
          (f) => f.draws[p].blocks.DrawBlock[k] === v,
        );
        if (constant && k >= 32)
          for (const f of longIdle.frames) f.draws[p].blocks.DrawBlock[k] = v;
        else
          for (let i = 0; i < idle.frames.length; i++)
            assert.equal(
              idle.frames[i].draws[p].blocks.DrawBlock[k],
              shared.frames[i].draws[p].blocks.DrawBlock[k],
              `Idle profile mismatch ${preset}/${g}/${i}/${p}/${k}`,
            );
      }
    const idleRaw = trim(longIdle, start, end);
    for (let p = 0; p < idleRaw.frames[0].draws.length; p++)
      assert(
        equal(
          idleRaw.frames[0].draws[p].blocks.DrawBlock,
          idleRaw.frames.at(-1).draws[p].blocks.DrawBlock,
        ),
        'Unproved idle seam',
      );
    let lastDifferent = -1;
    for (let i = 0; i < reaction.frames.length; i++)
      if (
        reaction.frames[i].draws.some(
          (d, p) =>
            !equal(
              d.blocks.DrawBlock,
              idle.frames[i].draws[p].blocks.DrawBlock,
            ),
        )
      )
        lastDifferent = i;
    assert(
      lastDifferent >= 60 && lastDifferent < reaction.frames.length - 30,
      'Reaction requires sustained native return',
    );
    const returnTime = reaction.frames[lastDifferent + 1].renderTime;
    const i = catalogObservation(idleRaw, geometry, manifest);
    i.clip.loop = true;
    const r = catalogObservation(
      trim(reaction, 3, returnTime),
      geometry,
      manifest,
    );
    const w = catalogObservation(trim(work, 3, 7), wgeom, wmanifest, {
      ignoreActivityProps: true,
    });
    const calibration = [];
    for (const observation of [i, r, w])
      calibration.push(
        await calibrateCatalogMaterials(observation, idle, manifest),
      );
    for (const part of w.clip.parts) {
      const center = centering.rigs[g].parts[part.id];
      assert(center);
      part.fields.catalogCenterWeight = center;
      Object.assign(
        part.fields,
        anchors.rigs[g].parts[part.id] ?? {},
        sizes.rigs[g].parts[part.id] ?? {},
      );
    }
    rigs.push({
      sceneCenter: centering.rigs[g].center,
      calibration,
      render: i.render,
      parts: manifest.parts,
      idle: i.clip,
      reaction: r.clip,
      work: w.clip,
      returnNativeTime: returnTime,
      sourceGround: geometry.parts[0].bounds.min[1],
      sourceHeight:
        geometry.parts[0].bounds.max[1] - geometry.parts[0].bounds.min[1],
    });
  }
  assert.equal(rigs[0].returnNativeTime, rigs[1].returnNativeTime);
  const bundle = {
    schema: 'bloom.avatar.catalog-motion-library',
    version: 1,
    preset,
    materialCalibrated: true,
    workFittingCalibrated: true,
    workFittingLimitations: {
      source:
        '53 independently translated eye anchors; 27 half-size effect5 controls; validated against 12 isolated native Computer episodes',
      transientWorldResiduals: {
        swept_lids: 1.7513487488520532e-6,
        dots: 1.2122478598114526e-6,
        sleepy_lids: 4.26131818335719e-6,
      },
      residualNativeTime: 3.1166666666666667,
      maximumRelativeNormalResidual: 4.068790264710742e-7,
      claim:
        'Measured finite native motion retarget; not bit-exact matrices and not a proof of arbitrary Stop or new gaze styles.',
    },
    idleNativeStart: start,
    reactionNativeStart: 3,
    workNativeStart: 3,
    rigs,
    limitations: [
      'Observed quiet seam, not a proof of every future stochastic idle variant.',
      'Closure materials calibrated against isolated native style observations; Float32 blend reconstruction error is recorded.',
    ],
  };
  await writeFile(`${out}/${preset}.bin`, encodeMotionBinary(bundle));
  console.log(
    JSON.stringify({
      preset,
      reactionReturn: rigs[0].returnNativeTime,
      output: `${out}/${preset}.bin`,
    }),
  );
}
