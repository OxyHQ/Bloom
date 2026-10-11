import {
  authoredAssemblyRecords,
  authoredEyeRecords,
  hasAuthoredLabel,
  transformAuthoredRecord,
  assembleAuthoredRecords,
} from './authored-parts.mjs';
import { sha256 } from './sha256.mjs';

const encoder = new TextEncoder();
const center = (bounds) => bounds.min.map((v, k) => (v + bounds.max[k]) / 2);
const span = (bounds, axis) => bounds.max[axis] - bounds.min[axis];
const fail = (message) => {
  throw new Error(`Single eye: ${message}`);
};

/** Single-eye placement is body-relative, never a collapsed left/right pair.
 * The upper-middle face keeps the eye on Todd's head rather than between its
 * raised eye stalks; the narrow clip uses its original upper face instead.
 */
export function cyclopsPlacement(body, eyes, clippo = false) {
  if (
    (clippo && !eyes.length) ||
    [...body.min, ...body.max].some((v) => !Number.isFinite(v))
  )
    fail('missing finite face bounds');
  const radius = Math.max(
    0.2,
    Math.min(0.6, span(body, 0) * (clippo ? 0.32 : 0.27)),
  );
  const location = center(body);
  location[1] = clippo
    ? eyes.reduce((sum, part) => sum + center(part.bounds)[1], 0) / eyes.length
    : body.min[1] + span(body, 1) * 0.62;
  location[2] = clippo ? 0.13 : body.max[2] - radius * 0.18;
  return { radius, center: location };
}

async function eyeRecord(bytes, part, origin, scale, destination, role, color) {
  const record = await transformAuthoredRecord(bytes, part, {
    scale,
    origin,
    translate: destination.map((v, k) => v - origin[k]),
  });
  const view = new DataView(record.bytes.buffer);
  if (color) {
    // Native fixed-pupil black bypasses material RGB. Disable only that flag,
    // retaining the original eye shader and its blink/look deformation data.
    record.bytes[88] = 0;
    for (const offset of [28, 60])
      color.forEach((v, k) => view.setFloat32(offset + k * 4, v, true));
  }
  if (role === 'iris') {
    // Radial iris striations use surface normals rather than a new texture or
    // dozens of draw calls. The three native normal bases receive the same
    // perturbation, so native blink/morph interpolation remains continuous.
    for (let i = 0; i < part.vertexCount; i++) {
      const at = part.vertexOffset - part.start + i * 96;
      const x = view.getFloat32(at, true) - destination[0];
      const y = view.getFloat32(at + 4, true) - destination[1];
      const angle = Math.atan2(y, x);
      const groove = 0.2 * Math.sin(angle * 53) + 0.09 * Math.sin(angle * 91);
      for (const offset of [12, 36, 60, 84]) {
        const nx =
          view.getFloat32(at + offset, true) + Math.cos(angle) * groove;
        const ny =
          view.getFloat32(at + offset + 4, true) + Math.sin(angle) * groove;
        const nz = view.getFloat32(at + offset + 8, true);
        const length = Math.hypot(nx, ny, nz);
        if (length > 1e-8)
          [nx, ny, nz].forEach((v, k) =>
            view.setFloat32(at + offset + k * 4, v / length, true),
          );
      }
    }
  }
  const key = await sha256(
    encoder.encode(JSON.stringify(['cyclops-v1', record.name, role, color])),
  );
  record.bytes.set(encoder.encode(key), part.nameOffset - part.start);
  record.name = key + record.name.slice(64);
  return record;
}

/** One original native eyeball, an iris, pupil and glint. Preserves the same
 * character controller, native eye motion and opaque work/activity payload.
 */
export async function composeCyclopsAssembly(module, bytes, request) {
  if (request.authoredParts?.eyes !== 'cyclops') return bytes;
  const target = authoredAssemblyRecords(bytes);
  const previousEyes = authoredEyeRecords(target);
  const prepared = module.orbitPrepareAssembly(
    module.presetAppearance('lime_frog'),
    request.quality,
    `${request.key}:single-eye-source`,
    false,
  );
  if (!prepared.bytes || prepared.error)
    fail(prepared.error || 'eye source unavailable');
  const sourceBytes = prepared.bytes.slice();
  const source = authoredAssemblyRecords(sourceBytes);
  const [outer, pupil] = source.records.slice(1, 3);
  if (
    !outer ||
    !pupil ||
    ![outer, pupil].every((p) =>
      hasAuthoredLabel(sourceBytes, p, 'source_integrated_eye'),
    )
  )
    fail('original eye layout changed');
  const layout = request.faceLayout;
  const placement = layout
    ? {
        radius: layout.radius * 2,
        center: [0, 1]
          .map((k) => (layout.centers[0][k] + layout.centers[1][k]) / 2)
          .concat(
            Math.max(...layout.centers.map((c) => c[2])) + layout.radius * 0.5,
          ),
      }
    : cyclopsPlacement(
        target.body.bounds,
        previousEyes,
        hasAuthoredLabel(bytes, target.body, 'metal'),
      );
  const origin = center(outer.bounds);
  const scale = (placement.radius * 2) / span(outer.bounds, 0);
  const white = await eyeRecord(
    sourceBytes,
    outer,
    origin,
    scale,
    placement.center,
    'white',
  );
  const pupilOrigin = center(pupil.bounds);
  const front = white.bounds.max[2];
  const layers = [
    ['rim', 0.57, [0.012, 0.08, 0.075], 0, 0],
    ['iris', 0.53, [0.035, 0.48, 0.37], 0, 0],
    ['pupil', 0.275, [0.006, 0.012, 0.016], 0, 0],
    ['glint', 0.065, [1, 1, 1], -0.19, 0.23],
  ];
  const records = [white];
  let previousFront = front;
  for (const [role, radius, color, x, y] of layers) {
    const partScale = (placement.radius * radius * 2) / span(pupil.bounds, 0);
    // Align visible fronts, not centers: iris and pupil have different depths.
    // Equal center positions hide the smaller pupil behind the larger iris.
    const destinationZ =
      previousFront +
      0.006 -
      (pupil.bounds.max[2] - pupilOrigin[2]) * partScale;
    const layer = await eyeRecord(
      sourceBytes,
      pupil,
      pupilOrigin,
      partScale,
      [
        placement.center[0] + x * placement.radius,
        placement.center[1] + y * placement.radius,
        destinationZ,
      ],
      role,
      color,
    );
    records.push(layer);
    previousFront = layer.bounds.max[2];
  }
  const eyeIds = new Set(previousEyes.map((p) => p.part));
  const retained = target.records
    .filter((p) => !eyeIds.has(p.part) && !hasAuthoredLabel(bytes, p, 'brows'))
    .map((p) => ({
      bytes: bytes.slice(p.start, p.end),
      name: p.name,
      bounds: p.bounds,
    }));
  retained.splice(1, 0, ...records);
  return assembleAuthoredRecords(target, retained);
}
