/** Build semantic affine/material-deformation tracks from offline app observations.
 * No GPU commands, binary engine, or GL bindings are emitted to runtime assets. */
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, sep } from 'node:path';
import * as THREE from 'three';

const preset = process.env.AVATAR_PRESET || 'blue_beret';
assert(/^[a-z0-9_]+$/.test(preset));
const source = process.env.AVATAR_MOTION_SOURCE || `.local/avatar-runtime-motion/${preset}`;
// Diagnostic observations cannot be loaded by the runtime motion catalog. Their
// last sample is a recording boundary, not evidence that an action has finished.
const diagnostic = process.env.AVATAR_MOTION_DIAGNOSTIC === '1';
const destination =
  process.env.AVATAR_MOTION_DESTINATION ||
  (diagnostic ? '.local/avatar-motion-observations' : 'runtime/avatar/assets/motion');
if (diagnostic)
  assert(
    resolve(destination).startsWith(`${resolve('.local')}${sep}`),
    'Diagnostic observations must remain under .local',
  );
const evidence = JSON.parse(await readFile(`${source}/report.json`, 'utf8'));
assert.equal(evidence.preset, preset);
const geometry = JSON.parse(
  await readFile(`.local/avatar-original-geometry/${preset}/geometry.json`, 'utf8'),
);
const fields = [
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
const animatedFields = [
  'colorRoughness',
  'parameters',
  'referencePose',
  'coverage',
  'eyeCurveOriginAmount',
  'eyeCurveRightWidth',
  'eyeCurveUp',
  'paletteBounds',
  'paletteClosure',
  'paletteReference',
  'furEye0',
  'furEye1',
  'signatureDeform',
];
const supportedAnimatedFields = new Set([
  'parameters',
  'signatureDeform',
  'colorRoughness',
  'paletteClosure',
]);
const ids = [
  ...geometry.parts.map((p) => `mesh:${p.id}`),
  ...geometry.parts.filter((p) => p.fur).map((p) => `fur:${p.id}`),
];
const sourceHashes = new Map(
  geometry.parts.flatMap((p) => [
    [p.vertices.sha256, `mesh:${p.id}`],
    ...(p.fur ? [[p.fur.sha256, `fur:${p.id}`]] : []),
  ]),
);
assert.equal(
  sourceHashes.size,
  ids.length,
  'Ambiguous identical geometry needs an explicit identity mapping',
);
const clipEvidence = {};
const asset = {
  schema: diagnostic ? 'bloom.avatar.motion-observations' : 'bloom.avatar.semantic-motion',
  version: 2,
  preset: evidence.preset,
  provenance: evidence.provenance,
  clips: {},
  limitations: [
    'Only the listed clips for this preset. No gaze, drag, Work or interruption state machine is implied.',
    'Idle is an observed segment trimmed at identical quiet endpoint poses; it does not prove all future stochastic idle behavior.',
    'Affine QR channels (translation, proper rotation, signed scale, shear) and native normal corrections reproduce captured keyframes. Interpolation is continuous and nonsingular for constant orientation, but unobserved native trajectories and fast blink peaks remain unverified. Sampling density is recorded per clip.',
    'Reaction holds its terminal pose, matching the observed native stop in submissions; it is not automatically blended into idle.',
  ],
};
if (diagnostic)
  asset.limitations = [
    'Finite offline observations for diagnostic playback only; no natural period, terminal pose or complete action is inferred.',
    'The recording boundary is not an animation endpoint. Do not loop or ship these observations as idle/reaction controllers.',
    'Interpolation reproduces observed keyframes; unsampled blink peaks and stochastic or input-dependent behavior remain unverified.',
    'Shader define stability is checked per original geometry identity. Full per-frame shader source and texture bindings were not recorded, so this is not proof of complete rendering-state equivalence.',
  ];
const maxDifference = (a, b) => Math.max(...a.map((x, i) => Math.abs(x - b[i])));
const allFields = (frame) => frame.draws.flatMap((d) => d.blocks.DrawBlock);
function channel(samples) {
  return samples.every((v) => maxDifference(samples[0], v) === 0)
    ? { value: samples[0] }
    : { samples: samples.flat() };
}
/** Modified Gram-Schmidt with a right-handed orthonormal basis. Reflection
 * lives exclusively in sz, so same-orientation interpolation cannot cross zero.
 * These are ordinary affine transform channels, not a GPU command recording. */
function affineChannels(matrix) {
  const e = matrix.elements;
  assert.deepEqual([e[3], e[7], e[11], e[15]], [0, 0, 0, 1], 'Affine world matrix required');
  const x = new THREE.Vector3(e[0], e[1], e[2]);
  const y = new THREE.Vector3(e[4], e[5], e[6]);
  const z = new THREE.Vector3(e[8], e[9], e[10]);
  const magnitude = Math.max(x.length(), y.length(), z.length());
  const minimum = Math.max(1e-10, magnitude * 1e-10);
  const sx = x.length();
  assert(sx > minimum, 'Singular or ill-conditioned affine transform');
  x.divideScalar(sx);
  let xy = x.dot(y);
  y.addScaledVector(x, -xy);
  // Reorthogonalization limits cancellation for nearly parallel columns.
  const residual = x.dot(y);
  xy += residual;
  y.addScaledVector(x, -residual);
  const sy = y.length();
  assert(sy > minimum, 'Singular or ill-conditioned affine transform');
  y.divideScalar(sy);
  const axisZ = new THREE.Vector3().crossVectors(x, y).normalize();
  const sz = axisZ.dot(z);
  assert(Math.abs(sz) > minimum, 'Singular or ill-conditioned affine transform');
  const rotation = new THREE.Quaternion()
    .setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, axisZ))
    .normalize();
  return {
    position: new THREE.Vector3(e[12], e[13], e[14]),
    rotation,
    scale: new THREE.Vector3(sx, sy, sz),
    shear: [xy, x.dot(z), y.dot(z)],
  };
}
function composeAffine({ position, rotation, scale, shear }) {
  const matrix = new THREE.Matrix4().makeRotationFromQuaternion(rotation).setPosition(position);
  const e = matrix.elements;
  for (let row = 0; row < 3; row++) {
    const x = e[row],
      y = e[4 + row],
      z = e[8 + row];
    e[row] = x * scale.x;
    e[4 + row] = x * shear[0] + y * scale.y;
    e[8 + row] = x * shear[1] + y * shear[2] + z * scale.z;
  }
  return matrix;
}
for (const name of ['idle', 'reaction']) {
  try {
    const rawBytes = await readFile(`${source}/${name}-raw.json`),
      raw = JSON.parse(rawBytes);
    let frames = raw.frames.filter((f, i, a) => i === 0 || f.renderTime > a[i - 1].renderTime);
    const bufferIdentities = new Map(
      (raw.vertexBuffers || []).map((b) => [b.id, sourceHashes.get(b.sha256)]),
    );
    frames = frames.map((frame) => {
      const mapped = new Map(
        frame.draws.map((draw, index) => {
          const bufferId = draw.vertexAttributes.find((a) => a.name === 'position')?.bufferId;
          const id = raw.vertexBuffers
            ? bufferIdentities.get(bufferId)
            : preset === 'blue_beret' && bufferId === index
              ? ids[index]
              : undefined;
          assert(id, `${name}: unidentified source buffer ${bufferId}`);
          return [id, draw];
        }),
      );
      assert.equal(
        mapped.size,
        ids.length,
        `${name}: topology changed or duplicate source geometry`,
      );
      return {
        ...frame,
        draws: ids.map((id) => {
          assert(mapped.has(id), `${name}: missing ${id}`);
          return mapped.get(id);
        }),
      };
    });
    const gaps = frames.slice(1).map((f, i) => f.renderTime - frames[i].renderTime);
    const unsupportedAnimatedFields = [];
    for (let i = 0; i < ids.length; i++)
      for (const field of fields.filter((f) => !supportedAnimatedFields.has(f))) {
        const at = 32 + fields.indexOf(field) * 4;
        const maxChange = Math.max(
          ...[0, 1, 2, 3].map(
            (k) =>
              Math.max(...frames.map((f) => f.draws[i].blocks.DrawBlock[at + k])) -
              Math.min(...frames.map((f) => f.draws[i].blocks.DrawBlock[at + k])),
          ),
        );
        if (maxChange) unsupportedAnimatedFields.push({ id: ids[i], field, maxChange });
      }
    const sampling = {
      observedFrames: frames.length,
      minimumGapSeconds: Math.min(...gaps),
      maximumGapSeconds: Math.max(...gaps),
      meanSamplesPerSecond: (frames.length - 1) / (frames.at(-1).renderTime - frames[0].renderTime),
      nativeRenderClock: true,
      fixedStep: raw.fixedStep || null,
    };
    clipEvidence[name] = {
      sampling,
      unsupportedAnimatedFields,
      initialCopy: raw.initialCopy || null,
    };
    // Reject variant changes even outside the trimmed interval: the current
    // renderer has a fixed material program for each original geometry part.
    const shaderVariants = ids.map((id, index) => {
      const defines = frames[0].draws[index].defines;
      assert(
        Array.isArray(defines) &&
          defines.length === 2 &&
          defines.every((value) => typeof value === 'string'),
        `${name} ${id}: missing shader variant evidence`,
      );
      for (const frame of frames)
        assert.deepEqual(
          frame.draws[index].defines,
          defines,
          `${name} ${id}: unsupported shader variant transition`,
        );
      return { id, defines };
    });
    clipEvidence[name].shaderVariants = shaderVariants;
    const originalCount = frames.length;
    let start = frames[0].renderTime,
      end = frames.at(-1).renderTime;
    let seamError = null;
    if (name === 'idle' && !diagnostic) {
      // Require exact equality across every DrawBlock channel and quiet samples
      // on both sides. Never hide a bad seam with a crossfade or a relaxed gate.
      let best, bestEndpoint;
      for (let i = 1; i < frames.length - 1; i++)
        for (let j = i + 1; j < frames.length - 1; j++) {
          const duration = frames[j].renderTime - frames[i].renderTime;
          if (duration < 7.5 || duration > 10) continue;
          const a = allFields(frames[i]),
            b = allFields(frames[j]);
          const endpointError = maxDifference(a, b);
          if (!bestEndpoint || endpointError < bestEndpoint.error)
            bestEndpoint = {
              start: frames[i].renderTime,
              end: frames[j].renderTime,
              period: duration,
              error: endpointError,
            };
          const error = Math.max(
            maxDifference(a, b),
            maxDifference(a, allFields(frames[i - 1])),
            maxDifference(b, allFields(frames[j + 1])),
          );
          if (!best || error < best.error) best = { i, j, error };
        }
      clipEvidence[name].bestEndpointMatch = bestEndpoint;
      clipEvidence[name].minimumQuietSeamError = best?.error;
      assert(
        best && best.error === 0,
        'No exact quiet idle loop seam in observations; no loop exported',
      );
      seamError = best.error;
      frames = frames.slice(best.i, best.j + 1);
      start = frames[0].renderTime;
      end = frames.at(-1).renderTime;
    } else if (name === 'reaction') {
      const command = raw.calls.find((c) => c.method === 'playReaction' && c.result === 0);
      assert(command, 'Reaction must have been accepted by the original controller');
      const index = frames.findLastIndex((f) => f.renderTime <= command.renderTime);
      assert(index >= 0, 'Reaction requires a pre-command reference pose');
      // Preserve the complete observation (including its pre-command context)
      // in diagnostic mode. Production reactions begin at the command boundary.
      if (!diagnostic) frames = frames.slice(index);
      start = frames[0].renderTime;
      // No public completion flag exists. A held terminal clip is only allowed
      // when the original actually stops submissions for at least one second.
      const lastPresentation = frames.at(-1).presentedAt;
      if (!diagnostic)
        assert(
          (raw.fixedStep && raw.finishedRenderTime
            ? raw.finishedRenderTime - frames.at(-1).renderTime
            : raw.finishedAt
              ? raw.finishedAt - lastPresentation
              : preset === 'blue_beret'
                ? 8 - frames.at(-1).time
                : 0) >= 1,
          'Reaction still submits frames at capture end; terminal semantics unresolved',
        );
    }
    for (const frame of frames) {
      assert.equal(
        frame.draws.length,
        ids.length,
        'Unresolved topology changes cannot be assigned by draw order',
      );
      for (const [i, draw] of frame.draws.entries()) {
        assert.equal(draw.blocks.DrawBlock.length, 92);
        assert(draw.blocks.DrawBlock.every(Number.isFinite));
        if (i < geometry.parts.length)
          assert.equal(
            draw.args[1],
            geometry.parts[i].indices.reduce((sum, range) => sum + range.count, 0),
            'Mesh topology differs from exported original asset',
          );
        else assert.equal(draw.method, 'drawArraysInstanced');
        for (const field of fields.filter((f) => !supportedAnimatedFields.has(f))) {
          const at = 32 + fields.indexOf(field) * 4;
          assert.deepEqual(
            draw.blocks.DrawBlock.slice(at, at + 4),
            frames[0].draws[i].blocks.DrawBlock.slice(at, at + 4),
            `${name} ${ids[i]}: unsupported animated field ${field}`,
          );
        }
        assert.deepEqual(
          draw.blocks.SkinBlock,
          frames[0].draws[i].blocks.SkinBlock,
          'Skin animation needs a separate semantic exporter',
        );
      }
    }
    assert.equal(
      unsupportedAnimatedFields.length,
      0,
      `Unsupported animated fields: ${JSON.stringify(unsupportedAnimatedFields)}`,
    );
    let maxTrsError = 0,
      maxAffineError = 0,
      maxNormalCorrection = 0,
      maxNormalError = 0;
    let maxTrsErrorLocation = null;
    const parts = ids.map((id, index) => {
      const positions = [],
        rotations = [],
        scales = [],
        shears = [],
        normalCorrections = [],
        values = Object.fromEntries(animatedFields.map((f) => [f, []]));
      for (const frame of frames) {
        const data = frame.draws[index].blocks.DrawBlock,
          matrix = new THREE.Matrix4().fromArray(data),
          position = new THREE.Vector3(),
          rotation = new THREE.Quaternion(),
          scale = new THREE.Vector3();
        // Keep the old TRS residual as diagnostic evidence. It is no longer
        // discarded or accepted by weakening the previous 1e-6 tolerance.
        matrix.decompose(position, rotation, scale);
        const legacyTrs = new THREE.Matrix4().compose(position, rotation, scale);
        const trsError = maxDifference(data.slice(0, 16), legacyTrs.elements);
        if (trsError > maxTrsError) {
          maxTrsError = trsError;
          maxTrsErrorLocation = { id, renderTime: frame.renderTime };
        }
        const affine = affineChannels(matrix);
        if (
          rotations.length &&
          affine.rotation.dot(new THREE.Quaternion().fromArray(rotations.at(-1))) < 0
        )
          affine.rotation.set(
            -affine.rotation.x,
            -affine.rotation.y,
            -affine.rotation.z,
            -affine.rotation.w,
          );
        if (scales.length)
          assert.equal(
            Math.sign(affine.scale.z),
            Math.sign(scales[0][2]),
            'Affine orientation changes through a singularity',
          );
        const composed = composeAffine(affine);
        maxAffineError = Math.max(
          maxAffineError,
          maxDifference(data.slice(0, 16), composed.elements),
        );
        const normal = composed.clone().invert().transpose();
        assert.deepEqual(
          [3, 7, 11, 12, 13, 14, 15].map((k) => data[16 + k]),
          [0, 0, 0, 0, 0, 0, 1],
          'Homogeneous native normal basis required',
        );
        const correction = [0, 1, 2, 4, 5, 6, 8, 9, 10].map(
          (k) => data[16 + k] - normal.elements[k],
        );
        maxNormalCorrection = Math.max(maxNormalCorrection, ...correction.map(Math.abs));
        for (const [j, k] of [0, 1, 2, 4, 5, 6, 8, 9, 10].entries())
          maxNormalError = Math.max(
            maxNormalError,
            Math.abs(normal.elements[k] + correction[j] - data[16 + k]),
          );
        positions.push(affine.position.toArray());
        rotations.push(affine.rotation.toArray());
        scales.push(affine.scale.toArray());
        shears.push(affine.shear);
        normalCorrections.push(correction);
        for (const field of animatedFields) {
          const offset = 32 + fields.indexOf(field) * 4;
          values[field].push(data.slice(offset, offset + 4));
        }
      }
      return {
        id,
        translation: channel(positions),
        rotation: channel(rotations),
        scale: channel(scales),
        shear: channel(shears),
        normalCorrection: channel(normalCorrections),
        fields: Object.fromEntries(
          Object.entries(values).map(([key, value]) => [key, channel(value)]),
        ),
      };
    });
    Object.assign(clipEvidence[name], {
      maxTrsError,
      maxAffineError,
      maxNormalCorrection,
      maxNormalError,
      maxTrsErrorLocation,
    });
    assert(maxAffineError < 1e-6, 'Affine reconstruction differs from observed matrix');
    assert(maxNormalError < 5e-5, 'Recomputed normals do not match original shader matrices');
    asset.clips[name] = {
      sampling,
      transformEncoding: 'affine-qr-v1',
      duration: end - start,
      loop: !diagnostic && name === 'idle',
      times: frames.map((f) => f.renderTime - start),
      parts,
      ...(diagnostic
        ? {
            endSemantics: 'observation-boundary',
            observedCommands: raw.calls.filter((call) =>
              [
                'playReaction',
                'applyActivity',
                'pointer',
                'setReadyGaze',
                'clearReadyGaze',
              ].includes(call.method),
            ),
          }
        : {}),
    };
    clipEvidence[name] = {
      ...clipEvidence[name],
      originalCount,
      selectedCount: frames.length,
      start,
      end,
      seamError,
      maxTrsError,
      maxNormalError,
      rawSha256: createHash('sha256').update(rawBytes).digest('hex'),
      geometryIdentities: ids,
      identityEvidence: raw.vertexBuffers
        ? 'Exact SHA256 of original source vertex/fur buffers'
        : 'Legacy blue topology counts and fixed buffer identities',
      initialCopy: raw.initialCopy || null,
    };
  } catch (error) {
    clipEvidence[name] = {
      ...clipEvidence[name],
      rejected: true,
      reason: error.message,
    };
  }
}
await mkdir(destination, { recursive: true });
if (diagnostic) {
  const { clips, ...metadata } = asset;
  if (Object.keys(clips).length)
    await writeFile(
      `${destination}/${preset}.json`,
      JSON.stringify({ ...metadata, observations: clips }),
    );
} else if (asset.clips.idle)
  await writeFile(`${destination}/${preset}.json`, JSON.stringify(asset));
await writeFile(
  `${source}/${diagnostic ? 'observation' : 'semantic'}-validation.json`,
  JSON.stringify(clipEvidence, null, 2),
);
console.log(JSON.stringify(clipEvidence, null, 2));
if (diagnostic ? !Object.keys(asset.clips).length : !asset.clips.idle) process.exitCode = 1;
