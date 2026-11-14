import { resolveVectorEyeInk, vectorEyeBaseOutline } from './vector-eye-ink';
import {
  projectReferenceFacePoint,
  prepareReferenceFaceProjection,
  referenceFaceDepth,
} from './vector-face';
import type { ResolvedAvatarCharacter } from './character';
import { CHARACTER_COLORS } from './character-colors';
import type { VectorData, VectorPart, VectorAction, VectorAssetLoader } from './vector-types';
import { VECTOR_ACTIONS } from './vector-pack';

/** What a character at rest draws: its idle clip. A gesture loads the rest when it first plays. */
export const VECTOR_REST_CLIPS: readonly VectorAction[] = ['idle'];
type Matrix = number[];
type Track = NonNullable<VectorData['clips']['idle']['parts'][number]>;
const identity = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const multiply = (a: Matrix, b: Matrix) =>
  Array.from({ length: 16 }, (_, i) => {
    const row = i % 4,
      col = Math.floor(i / 4);
    return (
      a[row]! * b[col * 4]! +
      a[4 + row]! * b[col * 4 + 1]! +
      a[8 + row]! * b[col * 4 + 2]! +
      a[12 + row]! * b[col * 4 + 3]!
    );
  });
function inverse(a: Matrix): Matrix {
  const m = Array.from({ length: 4 }, (_, r) =>
    Array.from({ length: 8 }, (_, c) => (c < 4 ? a[c * 4 + r]! : +(c - 4 === r))),
  );
  for (let c = 0; c < 4; c++) {
    let pivot = c;
    for (let r = c + 1; r < 4; r++) if (Math.abs(m[r]![c]!) > Math.abs(m[pivot]![c]!)) pivot = r;
    [m[c]!, m[pivot]!] = [m[pivot]!, m[c]!];
    const d = m[c]![c]!;
    if (Math.abs(d) < 1e-10) return identity();
    for (let k = 0; k < 8; k++) m[c]![k]! /= d;
    for (let r = 0; r < 4; r++)
      if (r !== c) {
        const f = m[r]![c]!;
        for (let k = 0; k < 8; k++) m[r]![k]! -= m[c]![k]! * f;
      }
  }
  return Array.from({ length: 16 }, (_, i) => m[i % 4]![4 + Math.floor(i / 4)]!);
}
const point = (m: Matrix, p: number[]) =>
  [0, 1, 2].map((k) => m[k]! * p[0]! + m[4 + k]! * p[1]! + m[8 + k]! * p[2]! + m[12 + k]!);
const vector = (m: Matrix, p: number[]) =>
  [0, 1, 2].map((k) => m[k]! * p[0]! + m[4 + k]! * p[1]! + m[8 + k]! * p[2]!);
function values(
  c: { value?: number[]; samples?: number[] } | undefined,
  width: number,
  frame: number,
  fallback: number[],
) {
  if (!c) return fallback;
  if (c.value) return c.value;
  const a = c.samples!,
    i = Math.min(Math.floor(frame), a.length / width - 1),
    j = Math.min(i + 1, a.length / width - 1),
    f = frame - i;
  return Array.from(
    { length: width },
    (_, k) => a[i * width + k]! * (1 - f) + a[j * width + k]! * f,
  );
}
function world(t: Track, frame: number): Matrix {
  if (t.matrix) return values(t.matrix, 16, frame, identity());
  const p = values(t.translation, 3, frame, [0, 0, 0]),
    q = values(t.rotation, 4, frame, [0, 0, 0, 1]),
    s = values(t.scale, 3, frame, [1, 1, 1]);
  const length = Math.hypot(...q) || 1,
    [x = 0, y = 0, z = 0, w = 1] = q.map((v) => v / length),
    x2 = x + x,
    y2 = y + y,
    z2 = z + z,
    xx = x * x2,
    xy = x * y2,
    xz = x * z2,
    yy = y * y2,
    yz = y * z2,
    zz = z * z2,
    wx = w * x2,
    wy = w * y2,
    wz = w * z2;
  return [
    (1 - yy - zz) * s[0]!,
    (xy + wz) * s[0]!,
    (xz - wy) * s[0]!,
    0,
    (xy - wz) * s[1]!,
    (1 - xx - zz) * s[1]!,
    (yz + wx) * s[1]!,
    0,
    (xz + wy) * s[2]!,
    (yz - wx) * s[2]!,
    (1 - xx - yy) * s[2]!,
    0,
    ...p,
    1,
  ];
}
const shift = (p: number[], s = 1) => [s, 0, 0, 0, 0, s, 0, 0, 0, 0, s, 0, ...p, 1];
type Bounds = {
  min: number[];
  max: number[];
  center: number[];
  size: number[];
};
// Donors are immutable; weak part/track ownership avoids retaining evicted assets.
const restPartBounds = new WeakMap<VectorPart, WeakMap<Track, Pick<Bounds, 'min' | 'max'>>>();
function bounds(data: VectorData, indices: number[]): Bounds {
  const min = [Infinity, Infinity, Infinity],
    max = [-Infinity, -Infinity, -Infinity];
  for (const i of indices) {
    const track = data.clips.idle.parts[i]!;
    if (!track) continue;
    const part = data.parts[i]!;
    let tracks = restPartBounds.get(part);
    if (!tracks) {
      tracks = new WeakMap();
      restPartBounds.set(part, tracks);
    }
    let measured = tracks.get(track);
    if (!measured) {
      measured = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
      const m = world(track, 0);
      for (const p of part.points) {
        const v = point(m, p);
        v.forEach((n, k) => {
          measured!.min[k] = Math.min(measured!.min[k]!, n);
          measured!.max[k] = Math.max(measured!.max[k]!, n);
        });
      }
      tracks.set(track, measured);
    }
    for (let k = 0; k < 3; k++) {
      min[k] = Math.min(min[k]!, measured.min[k]!);
      max[k] = Math.max(max[k]!, measured.max[k]!);
    }
  }
  if (!Number.isFinite(min[0]!))
    return {
      min: [-1, -1, 0],
      max: [1, 1, 1],
      center: [0, 0, 0.5],
      size: [2, 2, 1],
    };
  return {
    min,
    max,
    center: min.map((v, k) => (v + max[k]!) / 2),
    size: min.map((v, k) => max[k]! - v),
  };
}
const indices = (d: VectorData, role: string) =>
  d.parts.flatMap((p, i) => (p.role === role ? [i] : []));
function frontSurface(data: VectorData, bodyIndices: number[]) {
  const triangles: number[][][] = [],
    cells = new Map<string, number[]>();
  const cell = 0.12;
  for (const index of bodyIndices) {
    const track = data.clips.idle.parts[index]!;
    if (!track) continue;
    const m = world(track, 0),
      points = data.parts[index]!.points.map((p) => point(m, p));
    for (const face of data.parts[index]!.faces) {
      const t = face.map((i) => points[i]!),
        id = triangles.length;
      triangles.push(t);
      const x0 = Math.floor(Math.min(...t.map((p) => p[0]!)) / cell),
        x1 = Math.floor(Math.max(...t.map((p) => p[0]!)) / cell),
        y0 = Math.floor(Math.min(...t.map((p) => p[1]!)) / cell),
        y1 = Math.floor(Math.max(...t.map((p) => p[1]!)) / cell);
      for (let x = x0; x <= x1; x++)
        for (let y = y0; y <= y1; y++) {
          const key = x + ':' + y;
          const bucket = cells.get(key) || [];
          bucket.push(id);
          cells.set(key, bucket);
        }
    }
  }
  const cache = new Map<string, number>();
  return (x: number, y: number) => {
    const key = x.toFixed(5) + ':' + y.toFixed(5);
    if (cache.has(key)) return cache.get(key)!;
    let z = -Infinity;
    for (const i of cells.get(Math.floor(x / cell) + ':' + Math.floor(y / cell)) || []) {
      const [a, b, c] = triangles[i]! as [number[], number[], number[]],
        den = (b[1]! - c[1]!) * (a[0]! - c[0]!) + (c[0]! - b[0]!) * (a[1]! - c[1]!);
      if (Math.abs(den) < 1e-10) continue;
      const u = ((b[1]! - c[1]!) * (x - c[0]!) + (c[0]! - b[0]!) * (y - c[1]!)) / den,
        v = ((c[1]! - a[1]!) * (x - c[0]!) + (a[0]! - c[0]!) * (y - c[1]!)) / den;
      if (u >= -1e-6 && v >= -1e-6 && u + v <= 1 + 1e-6)
        z = Math.max(z, u * a[2]! + v * b[2]! + (1 - u - v) * c[2]!);
    }
    cache.set(key, z);
    return z;
  };
}

const actions: VectorAction[] = ['idle', 'reaction', 'work'];
const restTrack: Track = {
  translation: { value: [0, 0, 0] },
  rotation: { value: [0, 0, 0, 1] },
  scale: { value: [1, 1, 1] },
};
type FitMesh = { points: number[][]; faces: number[][] };
function meshes(data: VectorData, selected: number[]): FitMesh[] {
  return selected.map((i) => ({
    points: data.parts[i]!.points.map((p) =>
      point(world(data.clips.idle.parts[i] ?? restTrack, 0), p),
    ),
    faces: data.parts[i]!.faces,
  }));
}
function vertical(meshes: FitMesh[], x: number, z: number, top: boolean, flat = false): number {
  let result = top ? -Infinity : Infinity;
  for (const mesh of meshes)
    for (const face of mesh.faces) {
      const a = mesh.points[face[0]!]!,
        b = mesh.points[face[1]!]!,
        c = mesh.points[face[2]!]!;
      if (flat) {
        for (const [p, q] of [
          [a, b],
          [b, c],
          [c, a],
        ]) {
          const dx = q![0]! - p![0]!;
          if (Math.abs(dx) < 1e-9) continue;
          const t = (x - p![0]!) / dx;
          if (t < 0 || t > 1) continue;
          const y = p![1]! + (q![1]! - p![1]!) * t;
          result = top ? Math.max(result, y) : Math.min(result, y);
        }
        continue;
      }
      const det = (b[2]! - c[2]!) * (a[0]! - c[0]!) + (c[0]! - b[0]!) * (a[2]! - c[2]!);
      if (Math.abs(det) < 1e-10) continue;
      const u = ((b[2]! - c[2]!) * (x - c[0]!) + (c[0]! - b[0]!) * (z - c[2]!)) / det;
      const v = ((c[2]! - a[2]!) * (x - c[0]!) + (a[0]! - c[0]!) * (z - c[2]!)) / det;
      if (Math.min(u, v, 1 - u - v) < -1e-7) continue;
      const y = u * a[1]! + v * b[1]! + (1 - u - v) * c[1]!;
      result = top ? Math.max(result, y) : Math.min(result, y);
    }
  return result;
}
function meshContact(body: FitMesh[], attached: FitMesh[], flat = false): number {
  const points = attached.flatMap((m) => m.points),
    xs = points.map((p) => p[0]!),
    zs = points.map((p) => p[2]!);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minZ = Math.min(...zs),
    maxZ = Math.max(...zs);
  let shift = -Infinity;
  const sample = (x: number, z: number) => {
    const top = vertical(body, x, z, true, flat),
      bottom = vertical(attached, x, z, false, flat);
    if (Number.isFinite(top) && Number.isFinite(bottom)) shift = Math.max(shift, top - bottom);
  };
  for (let x = 0; x <= 12; x++)
    for (let z = 0; z <= 12; z++)
      sample(minX + ((maxX - minX) * x) / 12, minZ + ((maxZ - minZ) * z) / 12);
  for (const mesh of body)
    for (
      let i = 0;
      i < mesh.points.length;
      i += Math.max(1, Math.floor(mesh.points.length / 128))
    ) {
      const p = mesh.points[i]!;
      sample(p[0]!, flat ? (minZ + maxZ) / 2 : p[2]!);
    }
  return Number.isFinite(shift) ? shift : 0;
}
function containsXY(body: FitMesh[], x: number, y: number): boolean {
  for (const mesh of body)
    for (const f of mesh.faces) {
      const a = mesh.points[f[0]!]!,
        b = mesh.points[f[1]!]!,
        c = mesh.points[f[2]!]!;
      const den = (b[1]! - c[1]!) * (a[0]! - c[0]!) + (c[0]! - b[0]!) * (a[1]! - c[1]!);
      if (Math.abs(den) < 1e-10) continue;
      const u = ((b[1]! - c[1]!) * (x - c[0]!) + (c[0]! - b[0]!) * (y - c[1]!)) / den,
        v = ((c[1]! - a[1]!) * (x - c[0]!) + (a[0]! - c[0]!) * (y - c[1]!)) / den;
      if (Math.min(u, v, 1 - u - v) >= -1e-6) return true;
    }
  return false;
}
/** One translation for the complete face. Never clamp or resize individual eyes. */
function fitFaceTranslation(body: FitMesh[], points: number[][], width: number): number[] {
  const sample = points.filter((_, i) => i % Math.max(1, Math.floor(points.length / 128)) === 0);
  const inside = (dx: number, dy: number) =>
    sample.every((p) => containsXY(body, p[0]! + dx, p[1]! + dy));
  if (inside(0, 0)) return [0, 0, 0];
  const candidates: number[][] = [];
  for (let x = -16; x <= 16; x++)
    for (let y = -16; y <= 16; y++) candidates.push([x * width * 0.015, y * width * 0.015, 0]);
  candidates.sort((a, b) => Math.hypot(a[0]!, a[1]!) - Math.hypot(b[0]!, b[1]!));
  return candidates.find((p) => inside(p[0]!, p[1]!)) ?? [0, 0, 0];
}

/** Fit complete assemblies once, preserving their proportions throughout the gaze range. */
function fitGazePlacement(
  reference: NonNullable<VectorData['referenceFace']>,
  body: FitMesh[],
  points: number[][],
  width: number,
): { offset: number[]; scale: number } {
  if (!reference.restBasis) return { offset: [0, 0, 0], scale: 1 };
  const sample = points.filter((_, i) => i % Math.max(1, Math.floor(points.length / 160)) === 0);
  const looks = [-0.6, 0, 0.6].flatMap((yaw) =>
    [-0.45, 0, 0.45].map((pitch) => ({ yaw, pitch, mix: 1 })),
  );
  const fits = (offset: number[], scale: number, vertices = sample) =>
    looks.every((look) =>
      vertices.every((p) => {
        const q = projectReferenceFacePoint(
          reference,
          [
            reference.center[0] + (p[0]! - reference.center[0]) * scale + offset[0]!,
            reference.center[1] + (p[1]! - reference.center[1]) * scale + offset[1]!,
            p[2]! * scale,
          ],
          look,
        );
        return containsXY(body, q[0]!, q[1]!);
      }),
    );
  if (fits([0, 0, 0], 1) && fits([0, 0, 0], 1, points)) return { offset: [0, 0, 0], scale: 1 };
  const candidates: number[][] = [];
  for (let x = -8; x <= 8; x++)
    for (let y = -8; y <= 8; y++) candidates.push([x * width * 0.025, y * width * 0.025, 0]);
  candidates.sort((a, b) => Math.hypot(a[0]!, a[1]!) - Math.hypot(b[0]!, b[1]!));
  // Translation alone cannot fit an oversized expression inside a concave silhouette.
  // Keep the whole face proportional; never crop or distort one eye to make it fit.
  for (let step = 0; step <= 14; step++) {
    const scale = 1 - step * 0.05;
    const offset = candidates.find((value) => fits(value, scale) && fits(value, scale, points));
    if (offset) return { offset, scale };
  }
  return { offset: [0, 0, 0], scale: 1 };
}
function eyePair(data: VectorData, selected: number[]): [Bounds, Bounds] {
  const all = bounds(data, selected),
    left = selected.filter((i) => bounds(data, [i]).center[0]! < all.center[0]!),
    right = selected.filter((i) => !left.includes(i));
  // Outer iris/lid geometry defines the anchor. Brows and glints retain their
  // local offsets, but must not shift the fitted eyeball or its eyewear.
  const anchor = (parts: number[]) =>
    parts
      .map((i) => bounds(data, [i]))
      .reduce((largest, candidate) =>
        candidate.size[0]! * candidate.size[1]! > largest.size[0]! * largest.size[1]!
          ? candidate
          : largest,
      );
  return left.length && right.length ? [anchor(left), anchor(right)] : [all, all];
}
export function paintVectorCharacter(
  data: VectorData,
  character: ResolvedAvatarCharacter,
): VectorData {
  const color =
    'bodyColor' in character.paint
      ? character.paint.bodyColor
      : CHARACTER_COLORS[character.paint.color];
  const readableEyeInk = resolveVectorEyeInk(
    data.parts.filter((p) => p.role === 'eye').map((p) => p.color),
    color,
  );
  return {
    ...data,
    parts: data.parts.map((p) => {
      if (p.role === 'body' || p.role === 'hand' || p.bodyPaint) return { ...p, color };
      if (p.role !== 'eye') return p;
      if (
        ['classic_sunglasses', 'round_sunglasses', 'separate_trapezoid_lenses'].includes(
          character.eyewear,
        )
      )
        return { ...p, opacity: 0, stroke: undefined, strokeWidth: undefined };
      const stroke = vectorEyeBaseOutline(character.eyes, p.color, color);
      return readableEyeInk || stroke
        ? {
            ...p,
            ...(readableEyeInk ? { color: readableEyeInk } : {}),
            ...(stroke ? { stroke, strokeWidth: 2 } : {}),
          }
        : p;
    }),
  };
}
/** Clip-shaped bodies use a larger paired eye target across templates and donor styles. */
function sizedShapeFace(base: VectorData, shape: string): VectorData {
  if (shape !== 'clippo') return base;
  const selected = indices(base, 'eye');
  if (!selected.length) return base;
  const pair = eyePair(base, selected),
    middle = (pair[0].center[0]! + pair[1].center[0]!) / 2;
  const factor = 1.2;
  return {
    ...base,
    parts: base.parts.map((part, i) => {
      if (!selected.includes(i)) return part;
      const rest = world(base.clips.idle.parts[i] ?? restTrack, 0),
        back = inverse(rest);
      const side = bounds(base, [i]).center[0]! < middle ? 0 : 1,
        center = pair[side].center;
      const scalePoint = (p: number[]) => {
        const q = point(rest, p);
        q[0] = center[0]! + (q[0]! - center[0]!) * factor;
        q[1] = center[1]! + (q[1]! - center[1]!) * factor;
        return point(back, q);
      };
      const scaleDelta = (p: number[]) => {
        const q = vector(rest, p);
        q[0] = q[0]! * factor;
        q[1] = q[1]! * factor;
        return vector(back, q);
      };
      return {
        ...part,
        points: part.points.map(scalePoint),
        delta0: part.delta0?.map(scaleDelta),
        delta1: part.delta1?.map(scaleDelta),
      };
    }),
  };
}

/** Keep the face in the upper central region of these broad, concave silhouettes. */
function centeredShapeFace(base: VectorData, shape: string): VectorData {
  if (!['star', 'cloud', 'bot_star', 'bot_cloud'].includes(shape)) return base;
  const eyeIds = indices(base, 'eye');
  if (!eyeIds.length) return base;
  const body = bounds(base, indices(base, 'body')),
    eyes = bounds(base, eyeIds);
  const offset = [
    body.center[0]! - eyes.center[0]!,
    body.center[1]! + body.size[1]! * 0.07 - eyes.center[1]!,
    0,
  ];
  const localOffset = vector(
    inverse(world(base.clips.idle.parts[eyeIds[0]!] ?? restTrack, 0)),
    offset,
  );
  const reference = base.referenceFace;
  return {
    ...base,
    ...(reference
      ? {
          referenceFace: {
            ...reference,
            center: [
              reference.center[0] + localOffset[0]!,
              reference.center[1] + localOffset[1]!,
            ] as [number, number],
            eyePlanes: reference.eyePlanes?.map((plane) => ({
              ...plane,
              center: plane.center.map((v, i) => v + localOffset[i]!),
            })),
          },
        }
      : {}),
    parts: base.parts.map((part, i) => {
      if (!eyeIds.includes(i)) return part;
      const rest = world(base.clips.idle.parts[i] ?? restTrack, 0);
      const delta = vector(inverse(rest), offset);
      return {
        ...part,
        points: part.points.map((p) => p.map((v, k) => v + delta[k]!)),
      };
    }),
  };
}
/** Bring the virtual facial carrier closer without changing eye width, tilt or neutral XY. */
function seatReferenceCarrier(data: VectorData): VectorData {
  const face = data.referenceFace;
  if (!face?.sphereRadius || !face.eyePlanes?.length) return data;
  const eyes = indices(data, 'eye');
  if (!eyes.length) return data;
  let pull = face.sphereRadius * 0.18;
  // Bound the shift against the entire supported oblique-look envelope.
  for (const yaw of [-0.6, 0, 0.6])
    for (const pitch of [-0.45, 0, 0.45]) {
      const coefficient = Math.cos(yaw) * Math.cos(pitch);
      const project = prepareReferenceFaceProjection(face, { yaw, pitch, mix: 1 });
      for (const i of eyes)
        for (const point of data.parts[i]!.points) {
          const projected = project(point);
          pull = Math.min(pull, (projected[2]! - 0.012) / coefficient);
        }
    }
  if (pull <= 0.001) return data;
  return {
    ...data,
    referenceFace: {
      ...face,
      sphereRadius: face.sphereRadius - pull,
      eyePlanes: face.eyePlanes.map((plane) => ({
        ...plane,
        center: plane.center.map((n, k) => (k === 2 ? n - pull : n)),
      })),
    },
    parts: data.parts.map((part) =>
      part.role === 'eye' || part.role === 'eyewear'
        ? {
            ...part,
            points: part.points.map((p) => [p[0]!, p[1]!, p[2]! - pull]),
          }
        : part,
    ),
  };
}

/** Reduce excess front relief while preserving each assembly and its authored tracks. */
function seatLegacyAssemblies(data: VectorData, accessory: string): VectorData {
  if (data.referenceFace) return data;
  let result = data;
  const bodyIds = indices(data, 'body');
  const maximumPull = bounds(data, bodyIds).size[0]! * 0.08;
  for (const role of ['eye', 'eyewear', 'accessory']) {
    if (role === 'accessory' && accessory !== 'bow') continue;
    const selected = indices(result, role);
    if (!selected.length) continue;
    const contact = frontSurface(
      result,
      role === 'eyewear' ? [...bodyIds, ...indices(result, 'eye')] : bodyIds,
    );
    const assemblies = selected.map((i) => ({
      i,
      matrix: world(result.clips.idle.parts[i] ?? restTrack, 0),
      part: result.parts[i]!,
    }));
    const samples = assemblies.flatMap(({ part, matrix }) =>
      part.points.map((local) => {
        const p = point(matrix, local),
          skin = contact(p[0]!, p[1]!);
        return { p, skin, gap: p[2]! - skin };
      }),
    );
    const finite = samples.filter((p) => Number.isFinite(p.skin));
    if (!finite.length) continue;
    const gaps = finite.map((p) => p.gap).sort((a, b) => a - b);
    // Already shallow eyes retain their exact geometry, including embedded rims.
    const compress = gaps[Math.floor((gaps.length - 1) * 0.9)]! > 0.14;
    const factor = compress ? (role === 'accessory' ? 0.72 : 0.65) : 1;
    const anchor = Math.min(...samples.map(({ p }) => p[2]!));
    let correction = -Infinity;
    for (const { p, skin, gap } of finite) {
      // Previously embedded vertices stay embedded by the same amount, never more.
      correction = Math.max(
        correction,
        skin + Math.min(0.012, gap) - (anchor + (p[2]! - anchor) * factor),
      );
    }
    correction = Math.max(0, correction);
    const minimum = Math.min(
      ...finite.map(({ p, skin }) => anchor + (p[2]! - anchor) * factor + correction - skin),
    );
    const pull = minimum > 0.025 ? Math.min(maximumPull, minimum - 0.012) : 0;
    const offset = anchor * (1 - factor) + correction - pull;
    if (factor === 1 && !offset) continue;
    result = {
      ...result,
      parts: result.parts.map((part, i) => {
        const assembly = assemblies.find((p) => p.i === i);
        if (!assembly) return part;
        const back = inverse(assembly.matrix);
        const deform = (p: number[]) => {
          const q = point(assembly.matrix, p);
          q[2] = q[2]! * factor + offset;
          return point(back, q);
        };
        const delta = (p: number[]) => {
          const q = vector(assembly.matrix, p);
          q[2] = q[2]! * factor;
          return vector(back, q);
        };
        return {
          ...part,
          points: part.points.map(deform),
          delta0: part.delta0?.map(delta),
          delta1: part.delta1?.map(delta),
        };
      }),
    };
  }
  return result;
}

/** Compose cached, immutable vector donors using the canonical character contract. */
async function composeVectorGeometry(
  character: ResolvedAvatarCharacter,
  loader: VectorAssetLoader,
  clips: readonly VectorAction[],
): Promise<VectorData> {
  const template = await loader.template(character, clips);
  if (template)
    return seatLegacyAssemblies(sizedShapeFace(template, character.shape), character.accessory);
  // Every asset the character names starts loading now, side by side. On the web each one is its
  // own chunk, and awaiting them in turn made a first avatar wait one round trip per asset: the
  // shape, then its eyes, eyewear and accessory, then the circle the eyes are fitted against.
  // Bot eyes wait for the shape, which decides whether they are drawn at all (`preserveEyes`).
  const eyesKnown = character.eyes !== 'none' && character.eyes !== 'bot';
  const shapeAsset = loader.shape(character.shape, clips);
  const eyesAsset = eyesKnown ? loader.eyes(character.eyes, clips) : undefined;
  const circleAsset = eyesKnown ? loader.shape('circle', clips) : undefined;
  const eyewearAsset =
    character.eyewear !== 'none' ? loader.eyewear(character.eyewear, clips) : undefined;
  const accessoryAsset =
    character.accessory !== 'none' ? loader.accessory(character.accessory, clips) : undefined;
  // Each is awaited below, or dropped when the shape fails first; never an unhandled rejection.
  for (const pending of [eyesAsset, circleAsset, eyewearAsset, accessoryAsset])
    void pending?.catch(() => {});
  const base = centeredShapeFace(await shapeAsset, character.shape);
  const preserveEyes = !!base.referenceFace && character.eyes === 'bot';
  const kept = base.parts.flatMap((p, i) =>
    ['eyewear', 'accessory'].includes(p.role ?? '') || (p.role === 'eye' && !preserveEyes)
      ? []
      : [i],
  );
  let result: VectorData = {
    ...base,
    parts: kept.map((i) => base.parts[i]!),
    clips: {
      idle: {
        ...base.clips.idle,
        parts: kept.map((i) => base.clips.idle.parts[i] ?? null),
      },
      reaction: {
        ...base.clips.reaction,
        parts: kept.map((i) => base.clips.reaction.parts[i] ?? null),
      },
      work: {
        ...base.clips.work,
        parts: kept.map((i) => base.clips.work.parts[i] ?? null),
      },
    },
  };
  const bodyIndices = indices(base, 'body'),
    body = bounds(base, bodyIndices),
    eyeIndices = indices(base, 'eye'),
    face = eyeIndices.length ? bounds(base, eyeIndices) : body;
  const bodyIndex = bodyIndices[0] ?? 0,
    eyeIndex = eyeIndices[0] ?? bodyIndex;
  // Eye carriers own head rotation. Body roll can be independent of the face.
  const head = (data: VectorData, action: VectorAction, frame: number): Matrix => {
    const b = indices(data, 'body')[0] ?? 0,
      e = indices(data, 'eye')[0] ?? b;
    const bt = data.clips[action].parts[b] ?? restTrack,
      et = data.clips[action].parts[e] ?? bt;
    return world(
      data.referenceFace ? bt : { ...bt, rotation: et.rotation, matrix: undefined },
      frame,
    );
  };
  const targetRestInverse = inverse(head(base, 'idle', 0));
  const carriers = new Map<VectorAction, Matrix[]>();
  const carrierAt = (action: VectorAction, frame: number) => {
    let frames = carriers.get(action);
    if (!frames) {
      frames = [];
      carriers.set(action, frames);
    }
    return (
      frames[frame] ?? (frames[frame] = multiply(head(base, action, frame), targetRestInverse))
    );
  };
  const carrierChannels = new Map<VectorAction, { samples: number[] }>();
  const carrierChannel = (action: VectorAction) => {
    let channel = carrierChannels.get(action);
    if (!channel) {
      const clip = base.clips[action],
        samples: number[] = [],
        neutral = identity();
      for (let frame = 0; frame <= Math.ceil(clip.duration * clip.fps); frame++)
        samples.push(...multiply(carrierAt(action, frame), neutral));
      channel = { samples };
      carrierChannels.set(action, channel);
    }
    return channel;
  };
  const selections: Array<{
    role: 'eye' | 'eyewear' | 'accessory';
    id: string;
    data: Promise<VectorData>;
  }> = [];
  if (character.eyes !== 'none' && !preserveEyes)
    selections.push({
      role: 'eye',
      id: character.eyes,
      data: eyesAsset ?? loader.eyes(character.eyes, clips),
    });
  if (eyewearAsset)
    selections.push({
      role: 'eyewear',
      id: character.eyewear,
      data: eyewearAsset,
    });
  if (accessoryAsset)
    selections.push({
      role: 'accessory',
      id: character.accessory,
      data: accessoryAsset,
    });
  if (preserveEyes && character.eyeSpacing !== undefined && character.eyeSpacing !== 1) {
    const selected = indices(result, 'eye'),
      pair = eyePair(result, selected),
      middle = (pair[0].center[0]! + pair[1].center[0]!) / 2;
    for (const i of selected) {
      const m = world(result.clips.idle.parts[i] ?? restTrack, 0),
        center = bounds(result, [i]).center[0]!,
        side = center < middle ? 0 : 1;
      const dx = (pair[side].center[0]! - middle) * (character.eyeSpacing - 1),
        delta = vector(inverse(m), [dx, 0, 0]);
      result.parts[i] = {
        ...result.parts[i]!,
        points: result.parts[i]!.points.map((p) => p.map((n, k) => n + delta[k]!)),
      };
    }
  }
  const donors = await Promise.all(
    selections.map(async (selection) => ({
      ...selection,
      data: await selection.data,
    })),
  );
  for (const { role, id, data: donor } of donors) {
    const selected = indices(donor, role);
    if (!selected.length) throw new Error(`Vector donor has no ${role}: ${id}`);
    const donorBody = bounds(donor, indices(donor, 'body')),
      group = bounds(donor, selected),
      donorFace = bounds(donor, indices(donor, 'eye'));
    const facial = role === 'eye' || role === 'eyewear';
    const circle = await (circleAsset ?? loader.shape('circle', clips));
    const finalEyes = indices(result, 'eye');
    const fittedFace = role === 'eyewear' && finalEyes.length ? bounds(result, finalEyes) : face;
    const targetPair = eyePair(
        role === 'eyewear' ? result : base,
        role === 'eyewear' ? finalEyes : eyeIndices,
      ),
      sourcePair = eyePair(donor, indices(donor, 'eye'));
    const meanHeight = (pair: [Bounds, Bounds]) => (pair[0].size[1]! + pair[1].size[1]!) / 2;
    let scale =
      role === 'eye'
        ? Math.min(
            meanHeight(targetPair) /
              Math.max(0.01, meanHeight(eyePair(circle, indices(circle, 'eye')))),
            (body.size[0]! * 0.8) / Math.max(0.01, group.size[0]!),
          )
        : role === 'eyewear'
          ? Math.min(
              meanHeight(targetPair) / Math.max(0.01, meanHeight(sourcePair)),
              (body.size[0]! * 0.96) / Math.max(0.01, group.size[0]!),
            )
          : Math.min(body.size[0]! / donorBody.size[0]!, body.size[1]! / donorBody.size[1]!);
    if (role === 'eye' && id !== 'cyclops' && sourcePair[0] !== sourcePair[1]) {
      const left = selected.filter((i) => bounds(donor, [i]).center[0]! < donorFace.center[0]!);
      const right = selected.filter((i) => !left.includes(i));
      const facingWidth =
        bounds(donor, left).max[0]! -
        sourcePair[0].center[0]! +
        sourcePair[1].center[0]! -
        bounds(donor, right).min[0]!;
      const separation = targetPair[1].center[0]! - targetPair[0].center[0]!;
      if (facingWidth > 0 && separation > 0)
        scale = Math.min(scale, (separation * 0.88) / facingWidth);
    }
    const from = [
      ...(role === 'eye' ? group.center : facial ? donorFace.center : donorBody.center),
    ];
    const to = [...(facial ? fittedFace.center : body.center)];
    if (id === 'cyclops' && character.shape === 'rounded_head_two_ears')
      to[1] = body.center[1]! - 0.14 * body.size[1]!;
    const headwear =
      role === 'accessory' && ['felipe_beret', 'beret', 'beanie', 'hat', 'crown'].includes(id);
    let sizing = shift([0, 0, 0], headwear ? body.size[0]! / donorBody.size[0]! : scale);
    if (role === 'accessory') {
      if (id === 'headphones') {
        from[1] = donorBody.center[1]!;
        to[1] = body.center[1]!;
        sizing = [
          body.size[0]! / donorBody.size[0]!,
          0,
          0,
          0,
          0,
          body.size[1]! / donorBody.size[1]!,
          0,
          0,
          0,
          0,
          Math.max(0.5, body.size[2]! / Math.max(0.1, donorBody.size[2]!)),
          0,
          0,
          0,
          0,
          1,
        ];
      } else if (id === 'bow') {
        from[1] = donorBody.min[1]!;
        to[1] = body.min[1]!;
      } else {
        from[1] = donorBody.max[1]!;
        to[1] = body.max[1]!;
      }
    }
    const fit = multiply(shift(to), multiply(sizing, shift(from.map((n) => -n))));
    const baked = selected.map((i) => {
      const part = donor.parts[i]!,
        rest = world(donor.clips.idle.parts[i] ?? restTrack, 0),
        matrix = multiply(fit, rest);
      return {
        i,
        part,
        rest,
        matrix,
        points: part.points.map((p) => point(matrix, p)),
      };
    });
    if (role === 'eye' && id !== 'cyclops' && sourcePair[0] !== sourcePair[1]) {
      // An expression owns its local shape, not the distance between the selected body's eyes.
      // Translate each complete eye/eyelid/brow assembly onto that body's paired anchors.
      for (const v of baked) {
        const side = bounds(donor, [v.i]).center[0]! < donorFace.center[0]! ? 0 : 1;
        const sourceCenter = point(fit, sourcePair[side].center);
        const delta = [
          targetPair[side].center[0]! - sourceCenter[0]!,
          targetPair[side].center[1]! - sourceCenter[1]!,
          0,
        ];
        v.points = v.points.map((p) => p.map((n, k) => n + delta[k]!));
        v.matrix = multiply(shift(delta), v.matrix);
      }
    }
    if (role === 'eyewear') {
      // Fit the complete authored frame with ONE similarity transform. Independent
      // lens scales or blended bridge transforms change the actual eyewear design.
      const sourceCenter = sourcePair[0].center.map((v, k) => (v + sourcePair[1].center[k]!) / 2);
      const targetCenter = targetPair[0].center.map((v, k) => (v + targetPair[1].center[k]!) / 2);
      const sourceGap = Math.hypot(
        sourcePair[1].center[0]! - sourcePair[0].center[0]!,
        sourcePair[1].center[1]! - sourcePair[0].center[1]!,
      );
      const targetGap = Math.hypot(
        targetPair[1].center[0]! - targetPair[0].center[0]!,
        targetPair[1].center[1]! - targetPair[0].center[1]!,
      );
      const uniform = Math.max(scale, targetGap / Math.max(0.001, sourceGap));
      const angle =
        Math.atan2(
          targetPair[1].center[1]! - targetPair[0].center[1]!,
          targetPair[1].center[0]! - targetPair[0].center[0]!,
        ) -
        Math.atan2(
          sourcePair[1].center[1]! - sourcePair[0].center[1]!,
          sourcePair[1].center[0]! - sourcePair[0].center[0]!,
        );
      if (id === 'monocle') {
        const side = group.center[0]! < donorFace.center[0]! ? 0 : 1;
        sourceCenter.splice(0, 3, ...sourcePair[side].center);
        targetCenter.splice(0, 3, ...targetPair[side].center);
      }
      const rotation = [
        Math.cos(angle),
        Math.sin(angle),
        0,
        0,
        -Math.sin(angle),
        Math.cos(angle),
        0,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        1,
      ];
      const rigid = multiply(
        shift(targetCenter),
        multiply(rotation, multiply(shift([0, 0, 0], uniform), shift(sourceCenter.map((v) => -v)))),
      );
      for (const value of baked) {
        value.matrix = multiply(rigid, value.rest);
        value.points = value.part.points.map((p) => point(value.matrix, p));
      }
    }
    // Move complete eye assemblies, keeping pupils and eyelids together.
    if (role === 'eye' && id !== 'cyclops' && character.eyeSpacing !== undefined) {
      for (const value of baked) {
        const center = bounds(donor, [value.i]).center[0]!,
          side = center < group.center[0]! ? 0 : 1,
          middle = (targetPair[0].center[0]! + targetPair[1].center[0]!) / 2;
        const dx = (targetPair[side].center[0]! - middle) * (character.eyeSpacing - 1);
        value.points = value.points.map((p) => [p[0]! + dx, p[1]!, p[2]!]);
      }
    }
    const reference = base.referenceFace;
    if (role === 'accessory' && ['felipe_beret', 'beret', 'beanie', 'hat', 'crown'].includes(id)) {
      const targetMesh = meshes(base, bodyIndices),
        sourceMesh = meshes(circle, indices(circle, 'body'));
      const targetContact = meshContact(
        targetMesh,
        baked.map((v) => ({ points: v.points, faces: v.part.faces })),
        !!reference,
      );
      const authoredContact = meshContact(sourceMesh, meshes(donor, selected), !!reference);
      const appliedScale = body.size[0]! / donorBody.size[0]!;
      const dy =
        targetContact - Math.max(0, authoredContact) * appliedScale - body.size[1]! * 0.004;
      for (const v of baked) v.points = v.points.map((p) => [p[0]!, p[1]! + dy, p[2]!]);
    }
    if (role === 'accessory' && ['orb', 'three_lobe', 'bow'].includes(id)) {
      const top = id !== 'bow',
        targetPoints = baked.flatMap((v) => v.points),
        targetX =
          (Math.min(...targetPoints.map((p) => p[0]!)) +
            Math.max(...targetPoints.map((p) => p[0]!))) /
          2;
      const sourceBody = meshes(circle, indices(circle, 'body')),
        targetBody = meshes(base, bodyIndices);
      const sourceSurface = vertical(sourceBody, group.center[0]!, 0, top, true),
        targetSurface = vertical(targetBody, targetX, 0, top, true);
      const sourceEdge = top ? group.min[1]! : group.max[1]!,
        targetEdge = top
          ? Math.min(...targetPoints.map((p) => p[1]!))
          : Math.max(...targetPoints.map((p) => p[1]!));
      if (Number.isFinite(sourceSurface) && Number.isFinite(targetSurface)) {
        const dy = targetSurface - targetEdge - (sourceSurface - sourceEdge) * scale;
        for (const v of baked) v.points = v.points.map((p) => [p[0]!, p[1]! + dy, p[2]!]);
      }
    }
    if (role === 'accessory' && id === 'bow') {
      // A neck anchor fixes height, but cannot seat a bow against a non-spherical chest.
      // Keep its complete mesh in front of the actual contact surface, then let normal
      // depth visibility handle turns and other props as it does for every accessory.
      const front = frontSurface(base, bodyIndices);
      let lift = 0;
      for (const v of baked)
        for (const p of v.points) {
          const surface = front(p[0]!, p[1]!);
          if (Number.isFinite(surface)) lift = Math.max(lift, surface - p[2]! + 0.012);
        }
      if (lift > 0)
        for (const v of baked) v.points = v.points.map((p) => [p[0]!, p[1]!, p[2]! + lift]);
    }
    if (role === 'eye' && reference) {
      const all = baked.flatMap((v) => v.points);
      const translation = fitFaceTranslation(meshes(base, bodyIndices), all, body.size[0]!);
      const zMin = Math.min(...all.map((p) => p[2]!)),
        zMax = Math.max(...all.map((p) => p[2]!));
      // Curved highlights may have a lower global mean depth than the iris
      // while being in front at their own pixels. Preserve authored layer order.
      const layers = baked;
      for (const v of baked) {
        const center =
          id === 'cyclops'
            ? face.center
            : [0, 1].map(
                (axis) =>
                  (Math.min(...v.points.map((p) => p[axis]!)) +
                    Math.max(...v.points.map((p) => p[axis]!))) /
                  2,
              );
        v.points = v.points.map((p) => {
          const x = p[0]! + translation[0]!,
            y = p[1]! + translation[1]!;
          const depth =
            id === 'cyclops'
              ? (reference.sphereRadius ?? referenceFaceDepth(reference, center[0]!, center[1]!))
              : referenceFaceDepth(reference, x, y, center[0], center[1]);
          return [
            x,
            y,
            depth +
              layers.indexOf(v) * 0.012 +
              ((p[2]! - zMin) / Math.max(0.001, zMax - zMin)) * 0.004,
          ];
        });
      }
      if (role === 'eye') {
        const { offset, scale } = fitGazePlacement(
          reference,
          meshes(base, bodyIndices),
          baked.flatMap((v) => v.points),
          body.size[0]!,
        );
        if (offset[0] || offset[1] || scale !== 1)
          for (const v of baked) {
            v.points = v.points.map((p) => [
              reference.center[0] + (p[0]! - reference.center[0]) * scale + offset[0]!,
              reference.center[1] + (p[1]! - reference.center[1]) * scale + offset[1]!,
              p[2]! * scale,
            ]);
            // Morph vectors must use the same uniform scale as their fitted vertices.
            if (scale !== 1) v.matrix = multiply(shift([0, 0, 0], scale), v.matrix);
          }
      }
    } else if (facial) {
      const front = frontSurface(base, bodyIndices);
      let offset = 0;
      for (const v of baked) {
        if (role === 'eyewear' && /arm/i.test(v.part.label)) continue;
        const zMax = Math.max(...v.points.map((p) => p[2]!)),
          zMin = Math.min(...v.points.map((p) => p[2]!));
        for (const p of v.points) {
          if (role === 'eyewear' && p[2]! < zMin + (zMax - zMin) * 0.6) continue;
          const z = front(p[0]!, p[1]!);
          if (Number.isFinite(z)) offset = Math.max(offset, z - p[2]! + 0.012);
        }
      }
      for (const v of baked) v.points = v.points.map((p) => [p[0]!, p[1]!, p[2]! + offset]);
    }
    let headPivot: number[] | undefined;
    if (
      reference &&
      role === 'accessory' &&
      ['felipe_beret', 'beret', 'beanie', 'hat', 'crown'].includes(id)
    ) {
      const headPoints = baked.flatMap((v) => v.points);
      const targetMesh = meshes(base, bodyIndices);
      // A flat body can hide the rear half of a brim. Seat a front-side vertex,
      // then rotate around that same visible contact, rather than a hidden rear
      // vertex whose projection separates from the body as the head turns.
      let contact = -Infinity;
      for (const p of headPoints) {
        if (p[2]! < 0.012) continue;
        const top = vertical(targetMesh, p[0]!, 0, true, true);
        if (!Number.isFinite(top)) continue;
        const distance = top - p[1]!;
        if (distance > contact) {
          contact = distance;
          headPivot = p.slice();
        }
      }
      if (headPivot) {
        const dy = contact - body.size[1]! * 0.004;
        for (const value of baked)
          value.points = value.points.map((p) => [p[0]!, p[1]! + dy, p[2]!]);
        headPivot[1] = headPivot[1]! + dy;
      }
    }
    const retargetEye = role === 'eye' && !reference;
    const donorRestHead = retargetEye ? head(donor, 'idle', 0) : undefined;
    const relativeHeads = new Map<VectorAction, Matrix[]>();
    for (const { i, part, rest, matrix, points } of baked) {
      const restInverse = retargetEye ? inverse(rest) : undefined;
      const partFit = retargetEye ? multiply(matrix, restInverse!) : undefined;
      const partFitInverse = retargetEye ? inverse(partFit!) : undefined;

      result.parts.push({
        ...part,
        id: `${role}:${id}:${part.id}`,
        points,
        face: facial && !!reference,
        head: role === 'accessory' && !!reference,
        headPivot,
        delta0: part.delta0?.map((p) => vector(matrix, p)),
        delta1: part.delta1?.map((p) => vector(matrix, p)),
      });
      for (const action of actions) {
        const clip = base.clips[action],
          source = donor.clips[action],
          track = source.parts[i] ?? donor.clips.idle.parts[i] ?? restTrack;
        const matrices: number[] = [],
          parameters: number[] = [];
        for (let frame = 0; frame <= Math.ceil(clip.duration * clip.fps); frame++) {
          const seconds = frame / clip.fps,
            sourceFrame =
              (action === 'idle' ? seconds % source.duration : Math.min(seconds, source.duration)) *
              source.fps;
          if (retargetEye) {
            const carrier = carrierAt(action, frame);
            let heads = relativeHeads.get(action);
            if (!heads) {
              heads = [];
              relativeHeads.set(action, heads);
            }
            const relativeHead =
              heads[frame] ??
              (heads[frame] = multiply(donorRestHead!, inverse(head(donor, action, sourceFrame))));
            const relative = multiply(
              relativeHead,
              multiply(world(track, sourceFrame), restInverse!),
            );
            const motion = multiply(multiply(partFit!, relative), partFitInverse!);
            matrices.push(...multiply(carrier, motion));
          }
          parameters.push(...values(track.parameters, 4, sourceFrame, [0, 0, 0, 0]));
        }
        const carrierTrack = clip.parts[facial ? eyeIndex : bodyIndex] ?? restTrack;
        result.clips[action].parts.push({
          ...restTrack,
          matrix: retargetEye ? { samples: matrices } : carrierChannel(action),
          parameters: { samples: parameters },
          camera: carrierTrack.camera,
          coverage: carrierTrack.coverage,
        });
      }
    }
    if (role === 'eye') result = sizedShapeFace(result, character.shape);
  }
  return seatReferenceCarrier(seatLegacyAssemblies(result, character.accessory));
}

/** Paint cannot change attachment fitting, donor transforms or animation clips. */
export function vectorGeometryKey(character: ResolvedAvatarCharacter): string {
  return JSON.stringify([
    character.shape,
    character.eyes,
    character.eyewear,
    character.accessory,
    character.eyeSpacing ?? null,
    character.authored,
  ]);
}
const geometryCaches = new WeakMap<VectorAssetLoader, Map<string, Promise<VectorData>>>();
/**
 * Bounded per-loader cache also coalesces concurrent palette edits while donors load.
 *
 * `clips` is what will be drawn: a character at rest asks for `['idle']` (`VECTOR_REST_CLIPS`) and
 * gets its idle tracks and the geometry they draw, without its gestures' tracks or the computer
 * and hands only `work` shows; the same character asks for every clip when a gesture first plays.
 * Each set is cached apart. Without `clips`, every clip, as before.
 */
export function loadVectorGeometry(
  character: ResolvedAvatarCharacter,
  loader: VectorAssetLoader,
  clips: readonly VectorAction[] = VECTOR_ACTIONS,
): Promise<VectorData> {
  let cache = geometryCaches.get(loader);
  if (!cache) {
    cache = new Map();
    geometryCaches.set(loader, cache);
  }
  const wanted = [...new Set(clips)].sort();
  const key = `${vectorGeometryKey(character)}|${wanted.join(',')}`;
  const known = cache.get(key);
  if (known) {
    cache.delete(key);
    cache.set(key, known);
    return known;
  }
  const pending = composeVectorGeometry(character, loader, wanted);
  cache.set(key, pending);
  if (cache.size > 24) cache.delete(cache.keys().next().value!);
  void pending.catch(() => {
    if (cache.get(key) === pending) cache.delete(key);
  });
  return pending;
}
/** Compose once per geometry; recolor without copying vertices or motion channels. */
export async function composeVectorCharacter(
  character: ResolvedAvatarCharacter,
  loader: VectorAssetLoader,
  clips: readonly VectorAction[] = VECTOR_ACTIONS,
): Promise<VectorData> {
  return paintVectorCharacter(await loadVectorGeometry(character, loader, clips), character);
}
