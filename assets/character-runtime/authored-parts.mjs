import { decodeAppearance, encodeAppearance } from './appearance-codec.mjs';
import { inspectLegacyAssembly } from './legacy-geometry.mjs';
import { sha256 } from './sha256.mjs';

const encoder = new TextEncoder();
const BODY = ':body:no-shadow:studio-fur-v6:';
const fail = (message) => {
  throw new Error(`Authored avatar parts: ${message}`);
};
const digest = (value) => sha256(encoder.encode(JSON.stringify(value)));

/** Complete native renderable records, including their material/pose prefix.
 * After the vertex/fur payload the native format stores vertex/index counts,
 * three flags and four scalars (27 bytes). The next record begins with bounds;
 * slicing at its mesh name instead would attach the next part's material.
 */
export function authoredAssemblyRecords(bytes) {
  const info = inspectLegacyAssembly(bytes);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let start = 4;
  const records = info.parts.map((part) => {
    const end = part.geometryEnd + 27;
    if (part.nameOffset - 4 < start + 24 || end > bytes.length)
      fail('truncated renderable');
    if (view.getUint32(part.geometryEnd, true) !== part.vertexCount)
      fail('vertex descriptor mismatch');
    let at = part.vertexOffset + part.vertexCount * 96;
    const indices32 = view.getUint32(at, true);
    at += 4 + indices32 * 4;
    const indices16 = view.getUint32(at, true);
    if (view.getUint32(part.geometryEnd + 4, true) !== indices32 + indices16)
      fail('index descriptor mismatch');
    for (let k = 0; k < 3; k++)
      if (bytes[part.geometryEnd + 8 + k] > 1) fail('descriptor flags');
    for (let k = 0; k < 6; k++)
      if (!Number.isFinite(view.getFloat32(start + k * 4, true)))
        fail('bounds');
    for (let k = 0; k < 3; k++)
      if (
        view.getFloat32(start + k * 4, true) >
        view.getFloat32(start + 12 + k * 4, true)
      )
        fail('inverted bounds');
    for (let k = 0; k < 4; k++)
      if (
        !Number.isFinite(view.getFloat32(part.geometryEnd + 11 + k * 4, true))
      )
        fail('descriptor scalar');
    for (let i = 0; i < part.furCount * 16; i++)
      if (!Number.isFinite(view.getFloat32(part.furOffset + i * 4, true)))
        fail('fur scalar');
    const record = { ...part, start, end };
    start = end;
    return record;
  });
  // Activity-enabled scenes append the original hands/panel assemblies here.
  // Keep that opaque payload intact, rather than imposing a static-scene size.
  if (bytes.length - start < 100 || bytes.length > 64 * 1024 * 1024)
    fail(`scene footer (${bytes.length - start} bytes)`);
  return {
    ...info,
    bytes,
    body: records[0],
    records,
    footer: bytes.slice(start),
  };
}

function prepared(
  module,
  appearance,
  request,
  label,
  activities = request.activities,
) {
  const result = module.orbitPrepareAssembly(
    appearance,
    request.quality,
    `${request.key}:${label}`,
    activities,
  );
  if (!result.bytes || result.error)
    fail(result.error || `${label} preparation failed`);
  return result.bytes.slice();
}
function midpoint(bounds, axis) {
  return (bounds.min[axis] + bounds.max[axis]) / 2;
}
function union(parts) {
  return {
    min: [0, 1, 2].map((k) =>
      Math.min(...parts.map((part) => part.bounds.min[k])),
    ),
    max: [0, 1, 2].map((k) =>
      Math.max(...parts.map((part) => part.bounds.max[k])),
    ),
  };
}
export function hasAuthoredLabel(bytes, part, label) {
  const needle = encoder.encode(label);
  for (
    let at = part.start + 24;
    at + 4 + needle.length <= part.nameOffset - 4;
    at++
  ) {
    if (
      new DataView(bytes.buffer, bytes.byteOffset + at, 4).getUint32(
        0,
        true,
      ) !== needle.length
    )
      continue;
    if (needle.every((value, i) => bytes[at + 4 + i] === value)) return true;
  }
  return false;
}
export async function translateAuthoredRecord(bytes, part, translate) {
  return transformAuthoredRecord(bytes, part, { translate });
}
/** Uniform native attachment fitting preserves authored proportions and all
 * material/normal records. Pose deltas and known native pivots follow the mesh. */
export async function transformAuthoredRecord(
  bytes,
  part,
  { scale = 1, origin = [0, 0, 0], translate = [0, 0, 0] } = {},
) {
  if (
    !Number.isFinite(scale) ||
    scale <= 0 ||
    scale > 8 ||
    [origin, translate].some(
      (v) =>
        !Array.isArray(v) ||
        v.length !== 3 ||
        v.some((x) => !Number.isFinite(x)),
    )
  )
    fail('non-finite translated coordinate or invalid attachment scale');
  const result = bytes.slice(part.start, part.end);
  const view = new DataView(result.buffer);
  const move = (at) => {
    for (let k = 0; k < 3; k++) {
      const next = Math.fround(
        (view.getFloat32(at + k * 4, true) - origin[k]) * scale +
          origin[k] +
          translate[k],
      );
      if (!Number.isFinite(next)) fail('non-finite translated coordinate');
      view.setFloat32(at + k * 4, next, true);
    }
  };
  move(0);
  move(12);
  // Authored eye/headwear records store their deformation anchor after the
  // first material albedo. Move that proven XYZ center with their geometry so
  // native blink/reaction deformation still pivots around the fitted part.
  if (view.getUint32(24, true) !== 1) fail('authored material prefix');
  // Original beret and eyewear records also carry an attachment/frame center
  // at96. Measured native labels+flags identify those layouts; eye records use
  // these bytes for different optional fields. Generic hat/frame anchors can
  // differ from the per-mesh material center at40.
  const attachmentKinds = {
    beret: [7],
    beanie: [7],
    hat: [7],
    crown: [7],
    headphones: [2, 3],
    bow: [9],
    orb: [8],
    three_lobe: [8],
  };
  const attachmentAnchor =
    part.nameOffset - 4 - part.start >= 108 &&
    result[93] === 1 &&
    ((result[95] === 0 &&
      Object.entries(attachmentKinds).some(
        ([label, kinds]) =>
          kinds.includes(result[94]) && hasAuthoredLabel(bytes, part, label),
      )) ||
      (result[92] === 1 &&
        result[94] === 1 &&
        result[95] === 1 &&
        [
          'monocle',
          'tall_oval_frames',
          'separate_trapezoid_lenses',
          'classic_sunglasses',
          'round_sunglasses',
        ].some((label) => hasAuthoredLabel(bytes, part, label))));
  move(40);
  if (attachmentAnchor) move(96);
  for (let i = 0; i < part.vertexCount; i++) {
    const at = part.vertexOffset - part.start + i * 96;
    move(at);
    if (scale !== 1)
      for (const offset of [24, 48])
        for (let k = 0; k < 3; k++) {
          const next = Math.fround(
            view.getFloat32(at + offset + k * 4, true) * scale,
          );
          if (!Number.isFinite(next)) fail('non-finite scaled morph');
          view.setFloat32(at + offset + k * 4, next, true);
        }
  }
  if (
    scale !== 1 &&
    part.nameOffset - 4 - part.start > 160 &&
    view.getUint32(108, true) === 0
  ) {
    const effectAt = 116 + view.getUint32(112, true) + 36;
    if (
      effectAt + 10 <= part.nameOffset - 4 - part.start &&
      result[effectAt] === 5
    )
      for (const offset of [2, 6])
        view.setFloat32(
          effectAt + offset,
          view.getFloat32(effectAt + offset, true) * scale,
          true,
        );
  }
  for (let i = 0; i < part.furCount; i++)
    move(part.furOffset - part.start + i * 64);
  // Normals, UVs, material parameters and original blink/reaction deltas stay
  // byte-exact. Translated geometry receives its own native cache identity.
  const key = await digest([part.name, scale, origin, translate]);
  result.set(encoder.encode(key), part.nameOffset - part.start);
  return {
    bytes: result,
    name: key + part.name.slice(64),
    bounds: {
      min: part.bounds.min.map(
        (v, k) => (v - origin[k]) * scale + origin[k] + translate[k],
      ),
      max: part.bounds.max.map(
        (v, k) => (v - origin[k]) * scale + origin[k] + translate[k],
      ),
    },
  };
}

/** Inject the actual Todd eyes / Felipe beret after custom contour fitting.
 * Native oval/beret are fitting references only; their meshes are removed.
 * Every other target record and the animation/activity payload are retained;
 * aggregate scene bounds expand when an authored part extends beyond them.
 */
export async function composeAuthoredParts(module, bytes, request) {
  // Clippo shape/face is composed first by the worker. This helper then handles
  // only Todd/Felipe so all parts remain independently selectable.
  const selected = {
    ...(request.authoredParts?.eyes === 'todd' ? { eyes: 'todd' } : {}),
    ...(request.authoredParts?.accessory === 'felipe_beret'
      ? { accessory: 'felipe_beret' }
      : {}),
  };
  if (!selected?.eyes && !selected?.accessory) return bytes;
  if (
    (selected.eyes && selected.eyes !== 'todd') ||
    (selected.accessory && selected.accessory !== 'felipe_beret')
  )
    fail('unknown part');
  const target = authoredAssemblyRecords(bytes);
  const appearance = decodeAppearance(request.appearance);
  if (
    selected.accessory &&
    appearance.accessories.length &&
    (appearance.accessories.length !== 1 ||
      appearance.accessories[0] !== 'beret')
  )
    fail('Felipe requires a beret or bare-head fitting reference');

  // The native eye shader identity is length-prefixed in each record. Named
  // presets can retain their original state when a virtual selection matches
  // its backing catalog value; stripping their accessory in a reference state
  // would violate the original engine's complete-Here-preset validation.
  let targetEyes = target.records
    .slice(1)
    .filter(
      (part) =>
        hasAuthoredLabel(bytes, part, appearance.eyes) ||
        hasAuthoredLabel(bytes, part, 'source_integrated_eye'),
    );
  if (selected.eyes && !targetEyes.length) {
    const eyeReference = structuredClone(appearance);
    eyeReference.hereCharacter = null;
    eyeReference.accessories = [];
    eyeReference.accessoryColors = {};
    eyeReference.eyewear = 'none';
    if (eyeReference.model) {
      eyeReference.model.accessories = {};
      eyeReference.model.eyewear = null;
    }
    const face = authoredAssemblyRecords(
      prepared(
        module,
        encodeAppearance(eyeReference),
        request,
        'authored-eye-reference',
      ),
    );
    const eyeNames = new Set(face.records.slice(1).map((part) => part.name));
    targetEyes = target.records.filter((part) => eyeNames.has(part.name));
  }
  if (selected.eyes && targetEyes.length < 2)
    fail('missing eye fitting meshes');
  const targetHat = selected.accessory
    ? target.records
        .slice(1)
        .filter((part) => hasAuthoredLabel(bytes, part, 'beret'))
    : [];

  const replacements = new Map();
  if (selected.eyes) {
    // Quality-0/1 authored renderable records were compared byte-for-byte with
    // activities on/off. The copied eyes/hat are identical; avoid preparing an
    // unused ~2.6 MB hands/panel payload for each reference, not the target.
    const sourceBytes = prepared(
      module,
      new Uint8Array(module.presetAppearance('lime_frog')),
      request,
      'authored-todd',
      request.quality === 0 || request.quality === 1
        ? false
        : request.activities,
    );
    const source = authoredAssemblyRecords(sourceBytes);
    const eyes = source.records.slice(1, 5);
    if (
      eyes.length !== 4 ||
      !eyes.every((part) =>
        hasAuthoredLabel(sourceBytes, part, 'source_integrated_eye'),
      )
    )
      fail('unrecognized Todd eye assembly');
    for (const sign of [-1, 1]) {
      const group = targetEyes.filter(
        (part) => Math.sign(midpoint(part.bounds, 0)) === sign,
      );
      if (!group.length) fail('missing eye fitting anchor');
      const destination = union(group);
      const pair = eyes.filter(
        (part) => Math.sign(midpoint(part.bounds, 0)) === sign,
      );
      if (pair.length !== 2) fail('Todd eye pair');
      const outer = pair[0];
      // Interocular distance controls centers, never the authored eye size.
      // Circle and Todd are both ~2 units wide but their native gaps differ
      // by more than 2x; scaling by that gap buried the white rim in the body.
      // Clippo is a narrow open wire: its bounds are not a solid face width.
      const clippo =
        target.body.furCount === 0 &&
        hasAuthoredLabel(bytes, target.body, 'metal');
      const scale = clippo
        ? 1
        : Math.max(
            0.65,
            Math.min(
              1.2,
              (target.body.bounds.max[0] - target.body.bounds.min[0]) /
                (source.body.bounds.max[0] - source.body.bounds.min[0]),
            ),
          );
      const origin = [0, 1, 2].map((k) => midpoint(outer.bounds, k));
      const translate = [0, 1].map((k) => midpoint(destination, k) - origin[k]);
      translate.push(
        destination.min[2] -
          ((outer.bounds.min[2] - origin[2]) * scale + origin[2]),
      );
      replacements.set(
        group[0].part,
        await Promise.all(
          pair.map((part) =>
            transformAuthoredRecord(sourceBytes, part, {
              scale,
              origin,
              translate,
            }),
          ),
        ),
      );
      for (const part of group.slice(1)) replacements.set(part.part, []);
    }
  }
  if (selected.accessory) {
    const sourceBytes = prepared(
      module,
      new Uint8Array(module.presetAppearance('blue_beret')),
      request,
      'authored-felipe',
      request.quality === 0 || request.quality === 1
        ? false
        : request.activities,
    );
    const source = authoredAssemblyRecords(sourceBytes);
    const hat = source.records.slice(3, 6);
    if (
      hat.length !== 3 ||
      !hat.every((part) => hasAuthoredLabel(sourceBytes, part, 'beret'))
    )
      fail('unrecognized Felipe beret assembly');
    const bounds = union(hat);
    const destinationBounds = targetHat.length ? union(targetHat) : null;
    const transforms = destinationBounds
      ? hat.map((part) => ({
          part,
          scale: Math.min(
            1.5,
            (destinationBounds.max[0] - destinationBounds.min[0]) /
              (bounds.max[0] - bounds.min[0]),
          ),
          origin: [0, 1, 2].map((k) => midpoint(bounds, k)),
          translate: [0, 1, 2].map(
            (k) => midpoint(destinationBounds, k) - midpoint(bounds, k),
          ),
        }))
      : fitCatalogPartRecords(target, source, 'accessory', 'beret');
    const fitted = await Promise.all(
      transforms.map(({ part, ...transform }) =>
        transformAuthoredRecord(sourceBytes, part, transform),
      ),
    );
    if (targetHat.length) {
      replacements.set(targetHat[0].part, fitted);
      for (const part of targetHat.slice(1)) replacements.set(part.part, []);
    } else replacements.set(-1, fitted);
  }
  const records = target.records.flatMap(
    (part) =>
      replacements.get(part.part) ?? [
        {
          bytes: bytes.slice(part.start, part.end),
          name: part.name,
          bounds: part.bounds,
        },
      ],
  );
  records.push(...(replacements.get(-1) ?? []));
  return assembleAuthoredRecords(target, records);
}

/** Rebuild the native cache identity and scene extents after attachment fitting. */
export async function assembleAuthoredRecords(target, records) {
  const names = records.slice(1).map((record) => record.name);
  const bodyName =
    (await digest([target.body.name, names])) +
    BODY +
    names.map((name) => `${name.length}:${name}`).join(':');
  const body = records[0].bytes,
    encoded = encoder.encode(bodyName);
  const nameAt = target.body.nameOffset - target.records[0].start;
  const renamedBody = new Uint8Array(
    body.length + encoded.length - target.body.nameLength,
  );
  renamedBody.set(body.subarray(0, nameAt - 4));
  new DataView(renamedBody.buffer).setUint32(nameAt - 4, encoded.length, true);
  renamedBody.set(encoded, nameAt);
  renamedBody.set(
    body.subarray(nameAt + target.body.nameLength),
    nameAt + encoded.length,
  );
  records[0].bytes = renamedBody;
  const result = new Uint8Array(
    4 +
      records.reduce((sum, record) => sum + record.bytes.length, 0) +
      target.footer.length,
  );
  new DataView(result.buffer).setUint32(0, records.length, true);
  let at = 4;
  for (const record of records) {
    result.set(record.bytes, at);
    at += record.bytes.length;
  }
  result.set(target.footer, at);
  const bounds = union(records),
    footer = new DataView(result.buffer, at, target.footer.length);
  // The footer retains the original animation/panel payload. Its first and
  // third bounds sets are aggregate scene extents; the middle set belongs to
  // the original body and must not move when a hat is added.
  for (const offset of [0, 56])
    for (let k = 0; k < 3; k++) {
      footer.setFloat32(
        offset + k * 4,
        Math.min(footer.getFloat32(offset + k * 4, true), bounds.min[k]),
        true,
      );
      footer.setFloat32(
        offset + 12 + k * 4,
        Math.max(footer.getFloat32(offset + 12 + k * 4, true), bounds.max[k]),
        true,
      );
    }
  // Reinspect the assembled native layout before allowing it into the renderer.
  authoredAssemblyRecords(result);
  return result;
}

/** Saved spacing adjusts each authored eye group without stretching its meshes. */
export async function fitAuthoredEyeSpacing(bytes, request) {
  const amount = request.eyeSpacing ?? 1;
  if (!Number.isFinite(amount) || amount < 0.5 || amount > 1.5)
    fail('eye spacing range');
  if (amount === 1 || request.authoredParts?.eyes === 'cyclops') return bytes;
  const info = authoredAssemblyRecords(bytes),
    appearance = decodeAppearance(request.appearance);
  const labels = [
    appearance.eyes,
    'source_integrated_eye',
    'brows',
    request.authoredParts?.eyes,
  ].filter(Boolean);
  const eyes = info.records
    .slice(1)
    .filter((p) => labels.some((label) => hasAuthoredLabel(bytes, p, label)));
  const groups = [-1, 1].map((sign) =>
    eyes.filter((p) => Math.sign(midpoint(p.bounds, 0)) === sign),
  );
  if (groups.some((group) => !group.length))
    fail('missing eye spacing anchors');
  const centers = groups.map((group) =>
      midpoint(
        union(group.filter((p) => !hasAuthoredLabel(bytes, p, 'brows'))),
        0,
      ),
    ),
    middle = (centers[0] + centers[1]) / 2;
  const fitted = new Map();
  for (let side = 0; side < 2; side++)
    for (const part of groups[side])
      fitted.set(
        part.part,
        await translateAuthoredRecord(bytes, part, [
          (centers[side] - middle) * (amount - 1),
          0,
          0,
        ]),
      );
  const eyewear = request.authoredParts?.eyewear ?? appearance.eyewear;
  if (eyewear && eyewear !== 'none') {
    const face = union(
      eyes.filter((p) => !hasAuthoredLabel(bytes, p, 'brows')),
    );
    const origin = [middle, midpoint(face, 1), face.max[2]];
    for (const part of info.records
      .slice(1)
      .filter((p) => hasAuthoredLabel(bytes, p, eyewear))) {
      if (
        eyewear === 'monocle' ||
        Math.abs(midpoint(part.bounds, 0) - middle) >
          (centers[1] - centers[0]) * 0.15
      ) {
        const side = midpoint(part.bounds, 0) < middle ? 0 : 1;
        fitted.set(
          part.part,
          await translateAuthoredRecord(bytes, part, [
            (centers[side] - middle) * (amount - 1),
            0,
            0,
          ]),
        );
      } else
        fitted.set(
          part.part,
          await transformAuthoredRecord(bytes, part, { scale: amount, origin }),
        );
    }
  }
  return assembleAuthoredRecords(
    info,
    info.records.map(
      (p) =>
        fitted.get(p.part) ?? {
          bytes: bytes.slice(p.start, p.end),
          name: p.name,
          bounds: p.bounds,
        },
    ),
  );
}

const EYE_LABELS = [
  'source_integrated_eye',
  'oval',
  'dots',
  'swept_lids',
  'sparkle_capsules',
  'highlight_capsules',
  'double_highlights',
  'round_inset',
  'crescent_inset',
  'sleepy_lids',
];
export function authoredEyeRecords(info) {
  return info.records
    .slice(1)
    .filter((p) =>
      EYE_LABELS.some((id) => hasAuthoredLabel(info.bytes, p, id)),
    );
}
function eyeCenters(info) {
  const eyes = authoredEyeRecords(info);
  const sides = [-1, 1].map((sign) =>
    eyes.filter((p) => Math.sign(midpoint(p.bounds, 0)) === sign),
  );
  if (sides.some((side) => !side.length)) fail('catalog face anchors missing');
  return sides.map((side) => union(side));
}
/** Fit independently selectable native parts against the target's real body
 * and face records. Donor proportions remain uniform, never stretched flat. */
export function fitCatalogPartRecords(target, donor, category, id) {
  const selected =
    category === 'eyes'
      ? authoredEyeRecords(donor)
      : donor.records
          .slice(1)
          .filter((p) => hasAuthoredLabel(donor.bytes, p, id));
  if (!selected.length) fail(`missing catalog ${category}:${id}`);
  const bodyWidth = (info) => info.body.bounds.max[0] - info.body.bounds.min[0];
  if (category === 'eyes' || category === 'eyewear') {
    const dst = eyeCenters(target),
      src = eyeCenters(donor);
    const gap = (a) => Math.abs(midpoint(a[1], 0) - midpoint(a[0], 0));
    const scale = Math.max(0.25, Math.min(2, gap(dst) / gap(src)));
    if (category === 'eyes')
      return selected.map((part) => {
        const side = midpoint(part.bounds, 0) < 0 ? 0 : 1;
        const origin = [0, 1, 2].map((k) => midpoint(src[side], k));
        const translate = [0, 1].map((k) => midpoint(dst[side], k) - origin[k]);
        translate.push(
          dst[side].min[2] - (src[side].min[2] - origin[2]) * scale - origin[2],
        );
        return { part, scale, origin, translate };
      });
    const middle = [0, 1, 2].map(
      (k) => (midpoint(src[0], k) + midpoint(src[1], k)) / 2,
    );
    const destination = [0, 1, 2].map(
      (k) => (midpoint(dst[0], k) + midpoint(dst[1], k)) / 2,
    );
    const sideParts = [0, 1].map((side) =>
      selected.filter(
        (p) =>
          Math.abs(midpoint(p.bounds, 0) - middle[0]) > gap(src) * 0.15 &&
          (midpoint(p.bounds, 0) < middle[0] ? 0 : 1) === side,
      ),
    );
    const frontBounds = sideParts.map((parts) => {
      if (!parts.length) return null;
      const z = Math.max(...parts.map((p) => p.bounds.max[2]));
      return union(parts.filter((p) => p.bounds.max[2] > z - 0.05));
    });
    return selected.map((part) => {
      const x = midpoint(part.bounds, 0) - middle[0];
      if (Math.abs(x) <= gap(src) * 0.15)
        return {
          part,
          scale,
          origin: middle,
          translate: destination.map((v, k) => v - middle[k]),
        };
      const side = x < 0 ? 0 : 1,
        front = frontBounds[side];
      const lensScale = Math.min(
        2,
        Math.max(
          Math.min(scale, 1.2),
          ((dst[side].max[0] - dst[side].min[0]) * 1.08) /
            (front.max[0] - front.min[0]),
        ),
      );
      const origin = [0, 1, 2].map((k) => midpoint(src[side], k));
      const translate = [0, 1].map((k) => midpoint(dst[side], k) - origin[k]);
      translate.push(
        dst[side].max[2] +
          0.012 -
          ((front.min[2] - origin[2]) * lensScale + origin[2]),
      );
      return { part, scale: lensScale, origin, translate };
    });
  }
  if (category !== 'accessory') fail('unknown catalog fitting category');
  // Clippo's crown is narrower than its full curved-wire silhouette.
  const clippo =
    target.body.furCount === 0 &&
    hasAuthoredLabel(target.bytes, target.body, 'metal');
  const scale = clippo
    ? 0.56
    : Math.max(0.35, Math.min(1.5, bodyWidth(target) / bodyWidth(donor)));
  const origin = [
    midpoint(donor.body.bounds, 0),
    donor.body.bounds.max[1],
    midpoint(donor.body.bounds, 2),
  ];
  const crown = [
    clippo ? 0.02 : midpoint(target.body.bounds, 0),
    target.body.bounds.max[1],
    clippo ? 0 : midpoint(target.body.bounds, 2),
  ];
  // A bow belongs near the lower face. Crown-mounted accessories retain the
  // source offset above the actual target crown.
  if (id === 'bow') {
    const src = eyeCenters(donor),
      dst = eyeCenters(target);
    for (let k = 0; k < 2; k++) {
      origin[k] = (midpoint(src[0], k) + midpoint(src[1], k)) / 2;
      crown[k] = (midpoint(dst[0], k) + midpoint(dst[1], k)) / 2;
    }
  }
  const translate = crown.map((v, k) => v - origin[k]);
  return selected.map((part) => ({ part, scale, origin, translate }));
}
