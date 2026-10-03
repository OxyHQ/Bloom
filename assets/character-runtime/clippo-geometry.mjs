// Clippo is a native prepared-scene mesh, not a second renderer. The original
// character controllers, lighting, gaze, blink and activity payload stay in use.
import {
  authoredAssemblyRecords,
  translateAuthoredRecord,
  transformAuthoredRecord,
} from './authored-parts.mjs';
import { decodeAppearance } from './appearance-codec.mjs';
import { sha256 } from './sha256.mjs';
const encoder = new TextEncoder();
const BODY = ':body:no-shadow:studio-fur-v6:';
const VERSION = 'clippo-tube-v1';
const fail = (message) => {
  throw new Error(`Clippo geometry: ${message}`);
};
const unit = (p) => {
  const n = Math.hypot(...p);
  if (!(n > 1e-9)) fail('degenerate tangent');
  return p.map((x) => x / n);
};
const point = ([x, y, z = 0]) => [(x - 650) / 240, (400 - y) / 240, z];
export const CLIPPO_EYES = Object.freeze([
  Object.freeze({
    center: [-102 / 240, 135 / 240, 0.17],
    radius: [0.255, 0.265, 0.14],
  }),
  Object.freeze({
    center: [46 / 240, 93 / 240, 0.17],
    radius: [0.255, 0.265, 0.14],
  }),
]);
/** Eye size follows the solid face, independently from native eye spacing.
 * A narrow native gap is a placement choice, not a request for shallow eyes. */
export function clippoFaceEyeFit(bodyBounds, anchor) {
  const values = [
    ...bodyBounds.min,
    ...bodyBounds.max,
    ...anchor.min,
    ...anchor.max,
  ];
  if (
    !values.every(Number.isFinite) ||
    [bodyBounds, anchor].some((bounds) =>
      bounds.min.some((v, k) => v > bounds.max[k]),
    )
  )
    fail('invalid eye fitting bounds');
  const eyeScale = Math.max(
    0.65,
    Math.min(1.2, (bodyBounds.max[0] - bodyBounds.min[0]) / 2),
  );
  return {
    eyeScale,
    center: [
      (anchor.min[0] + anchor.max[0]) / 2,
      (anchor.min[1] + anchor.max[1]) / 2,
      anchor.min[2] + 0.14 * eyeScale,
    ],
    radius: [0.2, 0.21, 0.14].map((v) => v * eyeScale),
  };
}
// Continuous open wire, from the inner endpoint through the upper curl to the
// outer endpoint. The two holes come from geometry, never an alpha cutout.
const PATH = [
  [
    [604, 383],
    [590, 484],
    [611, 528],
    [656, 530],
  ],
  [
    [656, 530],
    [707, 532],
    [688, 471],
    [684, 417],
  ],
  [
    [684, 417],
    [675, 350],
    [692, 264],
    [711, 218],
  ],
  [
    [711, 218],
    [742, 142],
    [689, 109],
    [648, 119],
  ],
  [
    [648, 119],
    [596, 115],
    [570, 179],
    [553, 235],
  ],
  [
    [553, 235],
    [521, 323],
    [520, 395],
    [536, 482],
  ],
  [
    [536, 482],
    [553, 589],
    [591, 669],
    [663, 657],
  ],
  [
    [663, 657],
    [744, 650],
    [769, 616],
    [754, 526],
  ],
  [
    [754, 526],
    [737, 442],
    [743, 403],
    [778, 360],
  ],
];
function bezier(points, t) {
  const s = 1 - t;
  return [0, 1, 2].map(
    (k) =>
      s * s * s * points[0][k] +
      3 * s * s * t * points[1][k] +
      3 * s * t * t * points[2][k] +
      t * t * t * points[3][k],
  );
}
export function clippoPath(steps = 12) {
  if (!Number.isInteger(steps) || steps < 4 || steps > 64)
    fail('path resolution');
  return PATH.flatMap((curve, index) =>
    Array.from(
      { length: steps + (index === PATH.length - 1 ? 1 : 0) },
      (_, i) => bezier(curve.map(point), i / steps),
    ),
  );
}
/** A rounded, closed tube around an open planar centerline. Native vertex layout
 * stores three position/normal poses, two constant weights and a bend weight.
 * The editable original circle has zero position deltas; preserve that contract.
 */
export function tubeMesh(path, radius = 0.063, sides = 12) {
  if (
    !Array.isArray(path) ||
    path.length < 2 ||
    path.length > 10000 ||
    !Number.isFinite(radius) ||
    radius <= 0 ||
    radius > 1 ||
    !Number.isInteger(sides) ||
    sides < 6 ||
    sides > 64
  )
    fail('tube parameters');
  if (
    path.some(
      (p) =>
        !Array.isArray(p) ||
        p.length !== 3 ||
        p.some((v) => !Number.isFinite(v)),
    )
  )
    fail('non-finite path');
  const ringCount = path.length + 8,
    vertices = new Float32Array(ringCount * sides * 24),
    indices = [];
  const tangent = path.map((p, i) =>
    unit(
      path[Math.min(i + 1, path.length - 1)].map(
        (v, k) => v - path[Math.max(0, i - 1)][k],
      ),
    ),
  );
  const rings = [];
  for (let i = 4; i > 0; i--) {
    const a = (i * Math.PI) / 8;
    rings.push({
      p: path[0].map((v, k) => v - tangent[0][k] * radius * Math.sin(a)),
      t: tangent[0],
      r: radius * Math.cos(a),
      cap: -Math.sin(a),
    });
  }
  path.forEach((p, i) => rings.push({ p, t: tangent[i], r: radius, cap: 0 }));
  for (let i = 1; i <= 4; i++) {
    const a = (i * Math.PI) / 8;
    rings.push({
      p: path
        .at(-1)
        .map((v, k) => v + tangent.at(-1)[k] * radius * Math.sin(a)),
      t: tangent.at(-1),
      r: radius * Math.cos(a),
      cap: Math.sin(a),
    });
  }
  rings.forEach(({ p, t, r, cap }, i) => {
    const n = unit([-t[1], t[0], 0]);
    for (let j = 0; j < sides; j++) {
      const a = (j / sides) * Math.PI * 2,
        radial = n.map((v, k) => v * Math.cos(a) + (k === 2 ? Math.sin(a) : 0));
      const normal = unit(radial.map((v, k) => (v * r) / radius + t[k] * cap));
      const at = (i * sides + j) * 24;
      vertices.set(
        p.map((v, k) => v + radial[k] * r),
        at,
      );
      for (const o of [3, 9, 15, 21]) vertices.set(normal, at + o);
      vertices[at + 18] = vertices[at + 19] = 1;
      vertices[at + 20] = 0;
    }
  });
  for (let i = 0; i < rings.length - 1; i++)
    for (let j = 0; j < sides; j++) {
      const a = i * sides + j,
        b = i * sides + ((j + 1) % sides),
        c = (i + 1) * sides + j,
        d = (i + 1) * sides + ((j + 1) % sides);
      indices.push(a, b, c, b, d, c);
    }
  return { vertices, indices: Uint32Array.from(indices) };
}
function boundsOf(vertices) {
  const min = [Infinity, Infinity, Infinity],
    max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < vertices.length; i += 24)
    for (let k = 0; k < 3; k++) {
      const v = vertices[i + k];
      if (!Number.isFinite(v)) fail('non-finite vertex');
      min[k] = Math.min(min[k], v);
      max[k] = Math.max(max[k], v);
    }
  return { min, max };
}
function boundsUnion(records) {
  return {
    min: [0, 1, 2].map((k) => Math.min(...records.map((r) => r.bounds.min[k]))),
    max: [0, 1, 2].map((k) => Math.max(...records.map((r) => r.bounds.max[k]))),
  };
}
function floats(prefix, offset, values) {
  const view = new DataView(
    prefix.buffer,
    prefix.byteOffset,
    prefix.byteLength,
  );
  values.forEach((v, k) => view.setFloat32(offset + k * 4, v, true));
}
function meshRecord(
  bytes,
  source,
  mesh,
  name,
  { body = false, prefix: customPrefix } = {},
) {
  const prefix =
      customPrefix ?? bytes.slice(source.start, source.nameOffset - 4),
    bounds = boundsOf(mesh.vertices);
  floats(prefix, 0, bounds.min);
  floats(prefix, 12, bounds.max);
  const encoded = encoder.encode(name),
    furBytes = body ? 4 : 0;
  if (mesh.vertices.length / 24 > 65535) fail('16-bit mesh limit');
  const packedIndices = Uint16Array.from(mesh.indices);
  const out = new Uint8Array(
      prefix.length +
        4 +
        encoded.length +
        4 +
        mesh.vertices.byteLength +
        4 +
        packedIndices.byteLength +
        4 +
        7 +
        furBytes +
        27,
    ),
    view = new DataView(out.buffer);
  let at = 0;
  out.set(prefix, at);
  at += prefix.length;
  view.setUint32(at, encoded.length, true);
  at += 4;
  out.set(encoded, at);
  at += encoded.length;
  view.setUint32(at, mesh.vertices.length / 24, true);
  at += 4;
  out.set(
    new Uint8Array(
      mesh.vertices.buffer,
      mesh.vertices.byteOffset,
      mesh.vertices.byteLength,
    ),
    at,
  );
  at += mesh.vertices.byteLength;
  at += 4;
  view.setUint32(at, packedIndices.length, true);
  at += 4;
  out.set(new Uint8Array(packedIndices.buffer), at);
  at += packedIndices.byteLength; // native 16-bit index stream
  let sourceFlags = source.vertexOffset + source.vertexCount * 96;
  const sourceView = new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength,
  );
  sourceFlags += 4 + sourceView.getUint32(sourceFlags, true) * 4;
  sourceFlags += 4 + sourceView.getUint32(sourceFlags, true) * 2;
  sourceFlags += 4;
  at += 4;
  out[at++] = bytes[sourceFlags];
  out[at++] = bytes[sourceFlags + 1];
  out[at++] = body ? 1 : 0;
  if (body) at += 4; // fur layout, zero fur strands
  const trailer = bytes.slice(source.geometryEnd, source.geometryEnd + 27);
  out.set(trailer, at);
  view.setUint32(at, mesh.vertices.length / 24, true);
  view.setUint32(at + 4, mesh.indices.length, true);
  return { bytes: out, name, bounds };
}
function nativeMesh(bytes, part) {
  const vertices = new Float32Array(part.vertexCount * 24),
    view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let i = 0; i < vertices.length; i++)
    vertices[i] = view.getFloat32(part.vertexOffset + i * 4, true);
  let at = part.vertexOffset + part.vertexCount * 96;
  const n32 = view.getUint32(at, true);
  at += 4;
  const indices = [];
  for (let i = 0; i < n32; i++) indices.push(view.getUint32(at + i * 4, true));
  at += n32 * 4;
  const n16 = view.getUint32(at, true);
  at += 4;
  for (let i = 0; i < n16; i++) indices.push(view.getUint16(at + i * 2, true));
  return { vertices, indices: Uint32Array.from(indices) };
}
function transformMesh(mesh, origin, scale, center) {
  for (let i = 0; i < mesh.vertices.length; i += 24) {
    for (let k = 0; k < 3; k++)
      mesh.vertices[i + k] =
        (mesh.vertices[i + k] - origin[k]) * scale[k] + center[k];
    for (const offset of [6, 12])
      for (let k = 0; k < 3; k++) mesh.vertices[i + offset + k] *= scale[k];
    for (const offset of [3, 9, 15, 21])
      mesh.vertices.set(
        unit([0, 1, 2].map((k) => mesh.vertices[i + offset + k] / scale[k])),
        i + offset,
      );
  }
  return mesh;
}
function centerOf(b) {
  return b.min.map((v, k) => (v + b.max[k]) / 2);
}
async function identity(value) {
  return sha256(encoder.encode(JSON.stringify([VERSION, value])));
}
function record(bytes, part) {
  return {
    bytes: bytes.slice(part.start, part.end),
    name: part.name,
    bounds: part.bounds,
  };
}
function eyeParts(bytes, parts, selectedEye) {
  const decoder = new TextDecoder();
  return parts.filter((p) => {
    const prefix = decoder.decode(
      bytes.subarray(p.start + 24, p.nameOffset - 4),
    );
    const raw = bytes.subarray(p.start + 24, p.nameOffset - 4);
    const label = encoder.encode(selectedEye);
    for (let i = 0; i + 4 + label.length <= raw.length; i++)
      if (
        new DataView(raw.buffer, raw.byteOffset + i, 4).getUint32(0, true) ===
          label.length &&
        label.every((v, k) => raw[i + 4 + k] === v)
      )
        return true;
    return prefix.includes('source_integrated_eye');
  });
}
function eyePrefix(bytes, part, origin, scale, center) {
  const prefix = bytes.slice(part.start, part.nameOffset - 4),
    v = new DataView(prefix.buffer);
  floats(
    prefix,
    40,
    [0, 1, 2].map(
      (k) =>
        (v.getFloat32(40 + k * 4, true) - origin[k]) * scale[k] + center[k],
    ),
  ); // The original eye effect stores its local half-width/half-height after the
  // material name and normal basis. Scaling these with the mesh preserves blink.
  if (v.getUint32(108, true) !== 0) fail('unexpected eye attachment metadata');
  const effectAt = 116 + v.getUint32(112, true) + 36;
  if (prefix[effectAt] !== 5) fail('unknown native eye effect');
  for (let k = 0; k < 2; k++) {
    const at = effectAt + 2 + k * 4;
    v.setFloat32(at, v.getFloat32(at, true) * scale[k], true);
  }
  return prefix;
}
/** Replace selected Clippo geometry while preserving the original scene footer.
 * request.authoredParts.shape / .eyes are independent; other authored pieces
 * can be composed afterwards using these valid native eye anchor records.
 */
export async function composeClippoAssembly(module, bytes, request) {
  const selected = request.authoredParts ?? {},
    shape = selected.shape === 'clippo',
    eyes = selected.eyes === 'clippo';
  if (!shape && !eyes) return bytes;
  const info = authoredAssemblyRecords(bytes),
    records = info.records.map((p) => record(bytes, p));
  const smoothSource = module.orbitPrepareAssembly(
    module.presetAppearance('blue_beret'),
    request.quality,
    `${request.key}:clippo-smooth`,
    false,
  );
  if (!smoothSource.bytes || smoothSource.error)
    fail(smoothSource.error || 'smooth material unavailable');
  const smoothBytes = smoothSource.bytes.slice(),
    smoothPart = authoredAssemblyRecords(smoothBytes).records[3];
  const smoothPrefix = (label, color) => {
    const prefix = smoothBytes.slice(
      smoothPart.start,
      smoothPart.nameOffset - 4,
    );
    const name = encoder.encode('beret');
    for (let i = 4; i + 5 <= prefix.length; i++)
      if (
        new DataView(prefix.buffer).getUint32(i - 4, true) === 5 &&
        name.every((v, k) => prefix[i + k] === v)
      )
        prefix.set(encoder.encode(label), i);
    floats(prefix, 40, [0, 0, 0]);
    floats(prefix, 96, [0, 0, 0]);
    if (color) {
      floats(prefix, 28, color);
      floats(prefix, 60, color);
    }
    return prefix;
  };
  if (shape) {
    const mesh = tubeMesh(
      clippoPath(request.quality === 0 ? 8 : 14),
      0.063,
      request.quality === 0 ? 10 : 16,
    );
    const name =
      (await identity(['body', info.body.name, request.quality])) + BODY;
    records[0] = meshRecord(bytes, info.records[0], mesh, name, {
      body: true,
      prefix: smoothPrefix(
        'metal',
        [0, 1, 2].map((k) =>
          new DataView(
            bytes.buffer,
            bytes.byteOffset,
            bytes.byteLength,
          ).getFloat32(info.records[0].start + 28 + k * 4, true),
        ),
      ),
    });
  }
  const appearance = decodeAppearance(request.appearance);
  const originalEyes = eyeParts(bytes, info.records.slice(1), appearance.eyes);
  if (originalEyes.length < 2) fail('missing native eye anchors');
  const anchors = [-1, 1].map((sign) => {
    const parts = originalEyes.filter(
      (p) => Math.sign(centerOf(p.bounds)[0]) === sign,
    );
    if (!parts.length) fail('missing eye side');
    return { parts, bounds: boundsUnion(parts) };
  });
  // The Clippo body places the two eyes at the reference's sloping upper face.
  if (shape && !eyes)
    for (let side = 0; side < 2; side++)
      for (const p of anchors[side].parts) {
        const origin = centerOf(anchors[side].bounds),
          center = CLIPPO_EYES[side].center;
        records[p.part] = await translateAuthoredRecord(
          bytes,
          p,
          center.map((v, k) => v - origin[k]),
        );
      }
  if (shape) {
    const center = centerOf(records[0].bounds),
      oldCenter = centerOf(info.body.bounds);
    const faceCenter = [0, 1, 2].map(
        (k) =>
          (centerOf(anchors[0].bounds)[k] + centerOf(anchors[1].bounds)[k]) / 2,
      ),
      newFace = [0, 1, 2].map(
        (k) => (CLIPPO_EYES[0].center[k] + CLIPPO_EYES[1].center[k]) / 2,
      );
    for (const p of info.records.slice(1)) {
      if (originalEyes.includes(p)) continue;
      const prefix = bytes.subarray(p.start, p.nameOffset - 4);
      const named = (label) => {
        const needle = encoder.encode(label);
        for (let i = 28; i + 4 + needle.length <= prefix.length; i++)
          if (
            new DataView(prefix.buffer, prefix.byteOffset + i, 4).getUint32(
              0,
              true,
            ) === needle.length &&
            needle.every((v, k) => prefix[i + 4 + k] === v)
          )
            return true;
        return false;
      };
      if (appearance.accessories.some(named)) {
        // Scale the whole attachment about the original crown so a narrow metal
        // head does not inherit the much wider circle's hat/headphone footprint.
        const scale = 0.56;
        const origin = [oldCenter[0], info.body.bounds.max[1], oldCenter[2]];
        records[p.part] = await transformAuthoredRecord(bytes, p, {
          scale,
          origin,
          translate: [
            0.02 - origin[0],
            records[0].bounds.max[1] - origin[1],
            -origin[2],
          ],
        });
      } else if (appearance.eyewear !== 'none' && named(appearance.eyewear))
        records[p.part] = await translateAuthoredRecord(bytes, p, [
          newFace[0] - faceCenter[0],
          newFace[1] - faceCenter[1],
          0.31 - Math.max(...anchors.map((a) => a.bounds.max[2])),
        ]);
    }
  }
  if (eyes) {
    const prepared = module.orbitPrepareAssembly(
      module.presetAppearance('lime_frog'),
      request.quality,
      `${request.key}:clippo-eyes`,
      false,
    );
    if (!prepared.bytes || prepared.error)
      fail(prepared.error || 'native eye source unavailable');
    const sourceBytes = prepared.bytes.slice(),
      source = authoredAssemblyRecords(sourceBytes);
    const sources = source.records.slice(1, 5);
    if (sources.length !== 4) fail('native eye source changed');
    const replacements = [];
    for (let side = 0; side < 2; side++) {
      const pair = sources.slice(side * 2, side * 2 + 2),
        outer = pair[0],
        origin = centerOf(outer.bounds),
        anchor = anchors[side].bounds;
      const fittedEye = clippoFaceEyeFit(info.body.bounds, anchor);
      const eyeScale = fittedEye.eyeScale;
      const center = shape ? CLIPPO_EYES[side].center : fittedEye.center;
      const radius = shape ? CLIPPO_EYES[side].radius : fittedEye.radius,
        scale = radius.map(
          (r, k) => (r * 2) / (outer.bounds.max[k] - outer.bounds.min[k]),
        );
      for (const p of pair) {
        const mesh = transformMesh(
            nativeMesh(sourceBytes, p),
            origin,
            scale,
            center,
          ),
          prefix = eyePrefix(sourceBytes, p, origin, scale, center);
        if (p === pair[1]) {
          prefix[88] = 0;
          floats(prefix, 28, [0.16, 0.09, 0.09]);
          floats(prefix, 60, [0.16, 0.09, 0.09]);
        }
        const name =
          (await identity([p.name, center, scale, 'clippo-eye'])) +
          p.name.slice(64);
        replacements.push(meshRecord(sourceBytes, p, mesh, name, { prefix }));
      }
      const browPath = shape
        ? (side === 0
            ? [
                [548, 160],
                [568, 151],
                [592, 153],
                [608, 160],
              ]
            : [
                [696, 201],
                [714, 199],
                [734, 212],
                [746, 222],
              ]
          ).map(point)
        : [
            [-0.14, 0.35, 0],
            [-0.08, 0.41, 0],
            [0.08, 0.4, 0],
            [0.14, 0.35, 0],
          ].map((p) => p.map((v, k) => v * eyeScale + center[k]));
      if (shape) browPath.forEach((p) => (p[2] = 0.19));
      const browMesh = tubeMesh(
          Array.from({ length: 17 }, (_, i) => bezier(browPath, i / 16)),
          shape ? 0.065 : 0.045 * eyeScale,
          12,
        ),
        prefix = smoothPrefix('brows', [0.16, 0.09, 0.09]);
      const name =
        (await identity(['brow', info.body.name, side, browPath])) +
        ':surface:shadow';
      replacements.push(
        meshRecord(bytes, info.records[0], browMesh, name, { prefix }),
      );
    }
    const eyeIndices = new Set(originalEyes.map((p) => p.part));
    const retained = records.filter((r, i) => !eyeIndices.has(i));
    retained.splice(1, 0, ...replacements);
    records.splice(0, records.length, ...retained);
  }
  const names = records.slice(1).map((r) => r.name),
    bodyName =
      (await identity([records[0].name, names])) +
      BODY +
      names.map((n) => `${n.length}:${n}`).join(':');
  // Body names index the full attachment set in the native cache.
  const first = records[0].bytes,
    oldName = encoder.encode(records[0].name),
    nameAt = findName(first, oldName),
    newName = encoder.encode(bodyName),
    renamed = new Uint8Array(first.length + newName.length - oldName.length);
  renamed.set(first.subarray(0, nameAt - 4));
  new DataView(renamed.buffer).setUint32(nameAt - 4, newName.length, true);
  renamed.set(newName, nameAt);
  renamed.set(first.subarray(nameAt + oldName.length), nameAt + newName.length);
  records[0].bytes = renamed;
  const result = new Uint8Array(
      4 + records.reduce((n, r) => n + r.bytes.length, 0) + info.footer.length,
    ),
    view = new DataView(result.buffer);
  view.setUint32(0, records.length, true);
  let at = 4;
  for (const r of records) {
    result.set(r.bytes, at);
    at += r.bytes.length;
  }
  result.set(info.footer, at);
  const all = boundsUnion(records);
  for (const offset of [0, 28, 56]) {
    const b = offset === 28 ? records[0].bounds : all;
    floats(result, at + offset, b.min);
    floats(result, at + offset + 12, b.max);
  }
  authoredAssemblyRecords(result);
  return result;
}
function findName(bytes, name) {
  outer: for (let i = 4; i + name.length <= bytes.length; i++) {
    for (let k = 0; k < name.length; k++)
      if (bytes[i + k] !== name[k]) continue outer;
    return i;
  }
  fail('missing generated mesh name');
}
