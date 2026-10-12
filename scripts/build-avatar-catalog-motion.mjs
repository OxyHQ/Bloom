/** Offline extraction of named affine/material animation channels. This builder
 * never treats draw commands as a runtime animation format. Observations stay
 * finite until endpoint and retarget proofs authorize a runtime clip. */
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { Matrix4, Vector3, Quaternion } from 'three';
import ts from 'typescript';
import { encodeMotionBinary } from './build-avatar-motion-binary.mjs';

// Exercise the actual runtime sampler while keeping this ordinary Node script
// independent of Node's optional TypeScript syntax flags.
const samplerSource = ts
  .transpileModule(
    await readFile(
      new URL('../runtime/avatar/motion.ts', import.meta.url),
      'utf8',
    ),
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
      },
    },
  )
  .outputText.replace(
    /(['"])three\1/g,
    JSON.stringify(import.meta.resolve('three')),
  );
const { AuthoredMotionSampler } = await import(
  `data:text/javascript;base64,${Buffer.from(samplerSource).toString('base64')}`
);

export const catalogDrawFields = [
  'colorRoughness',
  'parameters',
  'referencePose',
  'emissiveMetallic',
  'coverage',
  'eyeCurveOriginAmount',
  'eyeCurveRightWidth',
  'eyeCurveUp',
  'paletteBounds',
  'paletteClosure',
  'paletteReference',
  'fur',
  'furEye0',
  'furEye1',
  'signatureDeform',
];
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const read = async (path) => JSON.parse(await readFile(path, 'utf8'));
export function channel(samples) {
  return samples.every((sample) => sample.every((v, k) => v === samples[0][k]))
    ? { value: samples[0] }
    : { samples: samples.flat() };
}
export function affineChannels(world, normal) {
  const e = world.elements;
  assert.deepEqual([e[3], e[7], e[11], e[15]], [0, 0, 0, 1]);
  const x = new Vector3(e[0], e[1], e[2]);
  const y = new Vector3(e[4], e[5], e[6]);
  const z = new Vector3(e[8], e[9], e[10]);
  const sx = x.length();
  assert(sx > 1e-10, 'Singular catalog X basis');
  x.divideScalar(sx);
  let xy = x.dot(y);
  y.addScaledVector(x, -xy);
  const residual = x.dot(y);
  xy += residual;
  y.addScaledVector(x, -residual);
  const sy = y.length();
  assert(sy > 1e-10, 'Singular catalog Y basis');
  y.divideScalar(sy);
  const axisZ = new Vector3().crossVectors(x, y).normalize();
  const sz = axisZ.dot(z);
  assert(Math.abs(sz) > 1e-10, 'Singular catalog Z basis');
  const rotation = new Quaternion()
    .setFromRotationMatrix(new Matrix4().makeBasis(x, y, axisZ))
    .normalize();
  // Correct against the exact QR reconstruction used by the sampler, not
  // the input matrix: closed eyelids can have a 1e9 condition number, so even
  // a one-ULP world residual otherwise becomes a measurable normal residual.
  const shear = [xy, x.dot(z), y.dot(z)];
  const rebuilt = new Matrix4()
    .makeRotationFromQuaternion(rotation)
    .setPosition(e[12], e[13], e[14]);
  for (let row = 0; row < 3; row++) {
    const a = rebuilt.elements[row],
      b = rebuilt.elements[4 + row],
      c = rebuilt.elements[8 + row];
    rebuilt.elements[row] = a * sx;
    rebuilt.elements[4 + row] = a * shear[0] + b * sy;
    rebuilt.elements[8 + row] = a * shear[1] + b * shear[2] + c * sz;
  }
  const inverseTranspose = rebuilt.invert().transpose().elements;
  return {
    translation: e.slice(12, 15),
    rotation: rotation.toArray(),
    scale: [sx, sy, sz],
    shear,
    normalCorrection: [0, 1, 2].flatMap((col) =>
      [0, 1, 2].map(
        (row) =>
          normal.elements[col * 4 + row] - inverseTranspose[col * 4 + row],
      ),
    ),
  };
}

export function catalogObservation(raw, geometry, manifest, options = {}) {
  assert.equal(raw.errors.length, 0);
  if (options.observedPreparation === true) {
    // Unmodified public preparation: geometry identities below must still
    // match every selected vertex buffer. No substituted assembly is claimed.
    assert.equal(raw.offlineRig?.replacements, 0);
    assert.equal(raw.offlineRig?.assemblySha256, null);
  } else {
    assert(raw.offlineRig?.replacements > 0);
    assert.equal(raw.offlineRig.assemblySha256, manifest.assemblySha256);
  }
  const identities = new Map();
  for (const part of geometry.parts) {
    for (const [suffix, buffer] of [
      ['mesh', part.vertices],
      ['fur', part.fur],
    ]) {
      if (!buffer) continue;
      assert(
        !identities.has(buffer.sha256),
        'Ambiguous catalog geometry identity',
      );
      identities.set(buffer.sha256, `${suffix}:${part.id}`);
    }
  }
  const buffers = new Map(
    raw.vertexBuffers.map((buffer) => [
      buffer.id,
      identities.get(buffer.sha256),
    ]),
  );
  const ids = [...identities.values()];
  const frames = raw.frames.map((frame) => {
    const draws = new Map();
    for (const draw of frame.draws) {
      const id = buffers.get(
        draw.vertexAttributes.find((a) => a.name === 'position')?.bufferId,
      );
      if (!id && options.ignoreActivityProps === true) continue;
      assert(id, 'Unknown catalog geometry in observation');
      assert(!draws.has(id), 'Duplicate catalog draw identity');
      assert.equal(draw.blocks.DrawBlock.length, 92);
      assert(draw.blocks.DrawBlock.every(Number.isFinite));
      draws.set(id, draw);
    }
    assert.equal(draws.size, ids.length, 'Catalog topology changed');
    return { time: frame.renderTime, draws };
  });
  assert(frames.length > 1);
  for (let k = 1; k < frames.length; k++)
    assert(frames[k].time > frames[k - 1].time);
  const start = frames[0].time;
  const times = frames.map((frame) => frame.time - start);
  const dynamicFields = {};
  const clip = { duration: times.at(-1), times, loop: false, parts: [] };
  for (const id of ids) {
    const values = frames.map((frame) => frame.draws.get(id).blocks.DrawBlock);
    const first = frames[0].draws.get(id);
    for (const frame of frames) {
      const draw = frame.draws.get(id);
      assert.deepEqual(draw.defines, first.defines, `Shader transition ${id}`);
      assert.deepEqual(
        Object.keys(draw.samplers).sort(),
        Object.keys(first.samplers).sort(),
        `Sampler interface transition ${id}`,
      );
    }
    const transforms = values.map((data) =>
      affineChannels(
        new Matrix4().fromArray(data),
        new Matrix4().fromArray(data, 16),
      ),
    );
    // Quaternion sign is representational; keep adjacent rotations on one sheet.
    for (let k = 1; k < transforms.length; k++)
      if (
        transforms[k].rotation.reduce(
          (sum, v, j) => sum + v * transforms[k - 1].rotation[j],
          0,
        ) < 0
      )
        transforms[k].rotation = transforms[k].rotation.map((v) => -v);
    const fields = Object.fromEntries(
      catalogDrawFields.map((name, at) => [
        name,
        channel(values.map((data) => data.slice(32 + 4 * at, 36 + 4 * at))),
      ]),
    );
    dynamicFields[id] = Object.entries(fields)
      .filter(([, value]) => 'samples' in value)
      .map(([name]) => name);
    clip.parts.push({
      id,
      ...Object.fromEntries(
        ['translation', 'rotation', 'scale', 'shear', 'normalCorrection'].map(
          (name) => [name, channel(transforms.map((t) => t[name]))],
        ),
      ),
      fields,
    });
  }
  const sampler = new AuthoredMotionSampler(clip),
    pose = sampler.createPose();
  let worldMax = 0,
    normalRelativeMax = 0;
  for (let f = 0; f < frames.length; f++) {
    sampler.sample(times[f], pose);
    for (const part of pose) {
      const native = frames[f].draws.get(part.id).blocks.DrawBlock;
      const magnitude = Math.max(1, ...native.slice(16, 32).map(Math.abs));
      for (let k = 0; k < 16; k++) {
        worldMax = Math.max(
          worldMax,
          Math.abs(part.world.elements[k] - native[k]),
        );
        normalRelativeMax = Math.max(
          normalRelativeMax,
          Math.abs(part.normalMatrix.elements[k] - native[16 + k]) / magnitude,
        );
      }
      for (const [index, name] of catalogDrawFields.entries())
        assert.deepEqual(
          part.fields[name],
          native.slice(32 + index * 4, 36 + index * 4),
        );
    }
  }
  assert(worldMax < 2e-12, `Catalog affine reconstruction ${worldMax}`);
  assert(
    normalRelativeMax < 2e-12,
    `Catalog native normal reconstruction ${normalRelativeMax}`,
  );
  return {
    schema: 'bloom.avatar.catalog-motion-observation',
    version: 1,
    nativeStart: start,
    nativeEnd: frames.at(-1).time,
    parts: manifest.parts,
    render: Object.fromEntries(
      ids.map((id) => [
        id,
        {
          universal: !frames[0].draws
            .get(id)
            .defines.join('\n')
            .includes('#define FELIPE_MATERIAL'),
        },
      ]),
    ),
    clip,
    evidence: {
      frames: frames.length,
      parts: ids.length,
      worldMax,
      normalRelativeMax,
      dynamicFields,
    },
    limitations: [
      'Finite native observation; recording boundaries do not establish an idle period or action endpoint.',
      'These are named affine and material channels, not draw-command replay. Geometry and shader interfaces must retain the recorded identities.',
    ],
  };
}

export async function buildCatalogObservations() {
  const root =
    process.env.AVATAR_CATALOG_MOTION_SOURCE || '.local/avatar-catalog-rig';
  const output =
    process.env.AVATAR_CATALOG_MOTION_DESTINATION ||
    '.local/avatar-catalog-motion-channels';
  const groups = (process.env.AVATAR_CATALOG_RIG_GROUPS || '0,1').split(',');
  const presets = (
    process.env.AVATAR_PRESETS ||
    'blue_beret,alfred,purple_heart,lime_frog,coral_monocle,gus,blue_spectacles,lime_headphones'
  ).split(',');
  const scenarios = (
    process.env.AVATAR_SCENARIOS || 'idle,reaction,gaze'
  ).split(',');
  const report = [];
  for (const group of groups) {
    const source = `${root}/rig${group}`;
    const geometry = await read(`${source}/combined-geometry.json`),
      manifest = await read(`${source}/manifest.json`);
    for (const preset of presets)
      for (const scenario of scenarios) {
        const sourcePath = `${source}/${preset}/${scenario}-raw.json`;
        const bytes = await readFile(sourcePath),
          data = catalogObservation(JSON.parse(bytes), geometry, manifest);
        data.preset = preset;
        data.scenario = scenario;
        data.provenance = {
          sourcePath,
          sourceSha256: hash(bytes),
          assemblySha256: manifest.assemblySha256,
        };
        const packed = encodeMotionBinary(data),
          dir = `${output}/rig${group}/${preset}`;
        await mkdir(dir, { recursive: true });
        await writeFile(`${dir}/${scenario}.bin`, packed);
        const result = {
          group: Number(group),
          preset,
          scenario,
          bytes: packed.length,
          sha256: hash(packed),
          ...data.evidence,
        };
        await writeFile(
          `${dir}/${scenario}-report.json`,
          JSON.stringify(result, null, 2),
        );
        report.push(result);
        console.log(JSON.stringify({ ...result, dynamicFields: undefined }));
      }
  }
  return report;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await buildCatalogObservations();
