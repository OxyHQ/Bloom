// Compatibility comes from original native donor meshes, never a fake enabled
// catalog selection. Source assemblies and the target's activity payload stay
// in the original renderer.
import { decodeAppearance, encodeAppearance } from './appearance-codec.mjs';
import {
  authoredAssemblyRecords,
  assembleAuthoredRecords,
  fitCatalogPartRecords,
  transformAuthoredRecord,
} from './authored-parts.mjs';
import { NATIVE_PARTS } from './character-recipe.mjs';
import { sha256 } from './sha256.mjs';
const encoder = new TextEncoder();
const fail = (message) => {
  throw Error(`Catalog avatar parts: ${message}`);
};
const references = new Map();
let retainedBytes = 0;
const MAXIMUM_BYTES = 8 * 1024 * 1024;
const originalPaint = new Map();
/** Read an unnamed paint from the actual original body material, not a palette approximation. */
export function originalBodyColor(module, preset) {
  if (originalPaint.has(preset)) return originalPaint.get(preset);
  const result = module.orbitPrepareAssembly(
    module.presetAppearance(preset),
    0,
    `original-paint:${preset}`,
    false,
  );
  if (!result.bytes || result.error)
    fail(result.error || 'original body paint missing');
  const bytes = result.bytes,
    view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (
    bytes.length < 48 ||
    view.getUint32(0, true) < 1 ||
    view.getUint32(28, true) !== 1
  )
    fail('unrecognized original body paint layout');
  const rgb = [0, 1, 2].map((k) => view.getFloat32(32 + k * 4, true));
  if (rgb.some((v) => !Number.isFinite(v) || v < 0 || v > 1))
    fail('invalid original body paint');
  const hex =
    '#' +
    rgb
      .map((v) =>
        Math.round(v * 255)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('');
  originalPaint.set(preset, hex);
  return hex;
}
export function recordHasLabel(info, part, label) {
  const needle = encoder.encode(label),
    bytes = info.bytes;
  for (
    let at = part.start + 24;
    at + 4 + needle.length <= part.nameOffset - 4;
    at++
  )
    if (
      new DataView(bytes.buffer, bytes.byteOffset + at, 4).getUint32(
        0,
        true,
      ) === needle.length &&
      needle.every((v, i) => bytes[at + 4 + i] === v)
    )
      return true;
  return false;
}
function isCategory(info, part, category) {
  const ids =
    category === 'eyes'
      ? [...NATIVE_PARTS.eyes, 'source_integrated_eye', 'brows']
      : NATIVE_PARTS[category].filter((id) => id !== 'none');
  return ids.some((id) => recordHasLabel(info, part, id));
}
function record(info, part) {
  return {
    bytes: info.bytes.slice(part.start, part.end),
    name: part.name,
    bounds: part.bounds,
  };
}
function mappedFaceReference(module, appearance, request) {
  const result = module.orbitPrepareAssembly(
    appearance,
    request.quality,
    `${request.key}:uncovered-donor`,
    false,
  );
  if (!result.bytes || result.error) return null;
  const info = authoredAssemblyRecords(result.bytes.slice());
  return info.records.slice(1).some((part) => isCategory(info, part, 'eyes'))
    ? info
    : null;
}
async function reference(module, category, id, request) {
  const key = JSON.stringify([category, id, request.quality]);
  if (references.has(key)) {
    const cached = references.get(key);
    references.delete(key);
    references.set(key, cached);
    return cached;
  }
  const shapes = module.catalog(0).map((item) => item.id),
    eyes =
      category === 'eyes'
        ? [id]
        : ['oval', ...NATIVE_PARTS.eyes.filter((id) => id !== 'oval')];
  let donor;
  for (const shape of ['circle', ...shapes.filter((id) => id !== 'circle')]) {
    for (const eye of eyes) {
      const appearance = encodeAppearance({
        version: 1,
        shape,
        color: 'blue',
        eyes: eye,
        eyewear: category === 'eyewear' ? id : 'none',
        accessories: category === 'accessory' ? [id] : [],
        accessoryColors: {},
        constrained: 0,
        depth: 0.5,
        model: null,
        rig: null,
        hereCharacter: null,
      });
      const result = module.orbitPrepareAssembly(
        appearance,
        request.quality,
        `${request.key}:donor:${category}:${id}:${shape}:${eye}`,
        false,
      );
      if (!result.bytes || result.error) continue;
      let info = authoredAssemblyRecords(result.bytes.slice());
      if (!info.records.slice(1).some((part) => recordHasLabel(info, part, id)))
        continue;
      if (
        !info.records.slice(1).some((part) => isCategory(info, part, 'eyes'))
      ) {
        const exposed = decodeAppearance(appearance);
        exposed.eyewear = 'none';
        const face = mappedFaceReference(
          module,
          encodeAppearance(exposed),
          request,
        );
        if (!face) continue;
        const records = info.records.map((part) => record(info, part));
        records.splice(
          1,
          0,
          ...face.records
            .slice(1)
            .filter((part) => isCategory(face, part, 'eyes'))
            .map((part) => record(face, part)),
        );
        info = authoredAssemblyRecords(
          await assembleAuthoredRecords(info, records),
        );
      }
      donor = info;
      break;
    }
    if (donor) break;
  }
  if (!donor) fail(`no original donor for ${category}:${id}`);
  if (donor.bytes.length <= MAXIMUM_BYTES) {
    references.set(key, donor);
    retainedBytes += donor.bytes.length;
    while (references.size > 24 || retainedBytes > MAXIMUM_BYTES) {
      const first = references.keys().next().value;
      retainedBytes -= references.get(first).bytes.length;
      references.delete(first);
    }
  }
  return donor;
}
/** Keep actual named-preset geometry/default pieces when only parts or paint
 * change. Original untouched presets never enter this adapter. */
export async function composePresetBody(module, bytes, request) {
  const preset = request.authoredParts?.bodyPreset;
  if (!preset) return bytes;
  const prepared = module.orbitPrepareAssembly(
    module.presetAppearance(preset),
    request.quality,
    `${request.key}:body:${preset}`,
    request.activities,
  );
  if (!prepared.bytes || prepared.error)
    fail(prepared.error || 'original preset body missing');
  const source = authoredAssemblyRecords(prepared.bytes.slice()),
    target = authoredAssemblyRecords(bytes),
    records = source.records.map((part) => record(source, part));
  if (
    !source.records.slice(1).some((part) => isCategory(source, part, 'eyes'))
  ) {
    // Opaque sunglasses legitimately omit the original eye meshes. Recover the
    // engine's actual hidden-eye reference without changing the preserved body.
    const exposed = decodeAppearance(module.presetAppearance(preset));
    exposed.hereCharacter = null;
    exposed.eyewear = 'none';
    if (exposed.model) exposed.model.eyewear = null;
    const result = module.orbitPrepareAssembly(
      encodeAppearance(exposed),
      request.quality,
      `${request.key}:hidden-eyes:${preset}`,
      false,
    );
    if (!result.bytes || result.error)
      fail(result.error || 'hidden original eye reference missing');
    const face = authoredAssemblyRecords(result.bytes.slice()),
      eyes = face.records
        .slice(1)
        .filter((part) => isCategory(face, part, 'eyes'));
    if (!eyes.length) fail('hidden original eye classification missing');
    records.splice(1, 0, ...eyes.map((part) => record(face, part)));
  }

  if (request.authoredParts.paintBody) {
    const out = new DataView(records[0].bytes.buffer),
      sourceView = new DataView(source.bytes.buffer, source.bytes.byteOffset),
      targetView = new DataView(target.bytes.buffer, target.bytes.byteOffset);
    if (
      sourceView.getUint32(source.body.start + 24, true) !== 1 ||
      targetView.getUint32(target.body.start + 24, true) !== 1
    )
      fail('unrecognized body paint layout');
    for (const at of [28, 60])
      for (let k = 0; k < 3; k++)
        out.setFloat32(
          at + k * 4,
          targetView.getFloat32(target.body.start + at + k * 4, true),
          true,
        );
    const hash = await sha256(records[0].bytes);
    records[0].bytes.set(
      encoder.encode(hash),
      source.body.nameOffset - source.body.start,
    );
    records[0].name = hash + source.body.name.slice(64);
  }
  // Preserve the body's actual authored activity payload and fitted hands,
  // instead of borrowing the neutral backing circle's fit.
  const footer = source.footer.slice(),
    view = new DataView(footer.buffer);
  for (let k = 0; k < 3; k++) {
    view.setFloat32(28 + k * 4, source.body.bounds.min[k], true);
    view.setFloat32(40 + k * 4, source.body.bounds.max[k], true);
  }
  return assembleAuthoredRecords(
    { ...source, body: { ...source.body, name: records[0].name }, footer },
    records,
  );
}
/** Native catalog pieces can be transplanted onto any actual body. */
export async function composeCatalogParts(module, bytes, request) {
  let info = authoredAssemblyRecords(bytes);
  for (const category of ['eyes', 'eyewear', 'accessory']) {
    const id = request.authoredParts?.[category];
    if (!id) continue;
    const virtualAccessory = category === 'accessory' && id === 'felipe_beret';
    if (!NATIVE_PARTS[category].includes(id) && !virtualAccessory) continue;
    const records = info.records.map((part) => record(info, part));
    const removed = new Set(
      info.records
        .slice(1)
        .filter((part) => isCategory(info, part, category))
        .map((part) => part.part),
    );
    if (category === 'eyes' && !removed.size)
      fail('target face classification missing');
    let fitted = [];
    if (id !== 'none' && !virtualAccessory) {
      const donor = await reference(module, category, id, request);
      const transforms = fitCatalogPartRecords(info, donor, category, id);
      fitted = await Promise.all(
        transforms.map(({ part, ...transform }) =>
          transformAuthoredRecord(donor.bytes, part, transform),
        ),
      );
    }
    const kept = records.filter((_, index) => !removed.has(index));
    const at = category === 'eyes' ? 1 : kept.length;
    kept.splice(at, 0, ...fitted);
    bytes = await assembleAuthoredRecords(info, kept);
    info = authoredAssemblyRecords(bytes);
  }
  return bytes;
}
export function catalogPartCacheStats() {
  return {
    entries: references.size,
    bytes: retainedBytes,
    maximumBytes: MAXIMUM_BYTES,
  };
}
