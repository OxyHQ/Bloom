import { referenceFaceDepth } from './vector-face';
import type { ResolvedAvatarCharacter } from './character';
import { CHARACTER_COLORS } from './character-colors';
import type { VectorData, VectorPart, VectorAction, VectorAssetLoader } from './vector-types';
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
type Bounds = { min: number[]; max: number[]; center: number[]; size: number[] };
function bounds(data: VectorData, indices: number[]): Bounds {
  const min = [Infinity, Infinity, Infinity],
    max = [-Infinity, -Infinity, -Infinity];
  for (const i of indices) {
    const track = data.clips.idle.parts[i]!;
    if (!track) continue;
    const m = world(track, 0);
    for (const p of data.parts[i]!.points) {
      const v = point(m, p);
      v.forEach((n, k) => {
        min[k] = Math.min(min[k]!, n);
        max[k] = Math.max(max[k]!, n);
      });
    }
  }
  if (!Number.isFinite(min[0]!))
    return { min: [-1, -1, 0], max: [1, 1, 1], center: [0, 0, 0.5], size: [2, 2, 1] };
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

function eyePair(data: VectorData, selected: number[]): [Bounds, Bounds] {
  const all = bounds(data, selected),
    left = selected.filter((i) => bounds(data, [i]).center[0]! < all.center[0]!),
    right = selected.filter((i) => !left.includes(i));
  return left.length && right.length ? [bounds(data, left), bounds(data, right)] : [all, all];
}
function eyePoints(data: VectorData, selected: number[], side: number): number[][] {
  const middle = bounds(data, selected).center[0]!;
  const half = selected.filter((i) => (bounds(data, [i]).center[0]! < middle ? 0 : 1) === side);
  return meshes(data, half.length ? half : selected).flatMap((m) => m.points);
}
function principal(points: number[][], center: number[]): number {
  let xx = 0,
    xy = 0,
    yy = 0;
  for (const p of points) {
    const x = p[0]! - center[0]!,
      y = p[1]! - center[1]!;
    xx += x * x;
    xy += x * y;
    yy += y * y;
  }
  if (Math.hypot(xx - yy, 2 * xy) < (xx + yy) * 0.12) return Math.PI / 2;
  let angle = Math.atan2(2 * xy, xx - yy) / 2;
  if (angle < 0) angle += Math.PI;
  return angle;
}
function rimDistance(mesh: FitMesh[], center: number[], dx: number, dy: number): number {
  let near = Infinity;
  for (const m of mesh)
    for (const f of m.faces)
      for (let i = 0; i < 3; i++) {
        const a = m.points[f[i]!]!,
          b = m.points[f[(i + 1) % 3]!]!,
          ex = b[0]! - a[0]!,
          ey = b[1]! - a[1]!;
        const det = dx * ey - dy * ex;
        if (Math.abs(det) < 1e-10) continue;
        const ax = a[0]! - center[0]!,
          ay = a[1]! - center[1]!,
          t = (ax * ey - ay * ex) / det,
          u = (ax * dy - ay * dx) / det;
        if (t > 1e-6 && u >= 0 && u <= 1) near = Math.min(near, t);
      }
  return near;
}

function paint(data: VectorData, character: ResolvedAvatarCharacter): VectorData {
  const color =
    'bodyColor' in character.paint
      ? character.paint.bodyColor
      : CHARACTER_COLORS[character.paint.color];
  return {
    ...data,
    parts: data.parts.map((p) =>
      p.role === 'body' || p.role === 'hand' || p.bodyPaint ? { ...p, color } : p,
    ),
  };
}
/** Compose cached, immutable vector donors using the canonical character contract. */
export async function composeVectorCharacter(
  character: ResolvedAvatarCharacter,
  loader: VectorAssetLoader,
): Promise<VectorData> {
  const template = await loader.template(character);
  if (template) return paint(template, character);
  const base = await loader.shape(character.shape);
  const preserveEyes = !!base.referenceFace && character.eyes === 'bot';
  const kept = base.parts.flatMap((p, i) =>
    ['eyewear', 'accessory'].includes(p.role ?? '') || (p.role === 'eye' && !preserveEyes)
      ? []
      : [i],
  );
  const result: VectorData = {
    ...base,
    parts: kept.map((i) => base.parts[i]!),
    clips: {
      idle: { ...base.clips.idle, parts: kept.map((i) => base.clips.idle.parts[i] ?? null) },
      reaction: {
        ...base.clips.reaction,
        parts: kept.map((i) => base.clips.reaction.parts[i] ?? null),
      },
      work: { ...base.clips.work, parts: kept.map((i) => base.clips.work.parts[i] ?? null) },
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
  const selections: Array<{
    role: 'eye' | 'eyewear' | 'accessory';
    id: string;
    data: Promise<VectorData>;
  }> = [];
  if (character.eyes !== 'none' && !preserveEyes)
    selections.push({ role: 'eye', id: character.eyes, data: loader.eyes(character.eyes) });
  if (character.eyewear !== 'none')
    selections.push({
      role: 'eyewear',
      id: character.eyewear,
      data: loader.eyewear(character.eyewear),
    });
  if (character.accessory !== 'none')
    selections.push({
      role: 'accessory',
      id: character.accessory,
      data: loader.accessory(character.accessory),
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
    selections.map(async (selection) => ({ ...selection, data: await selection.data })),
  );
  for (const { role, id, data: donor } of donors) {
    const selected = indices(donor, role);
    if (!selected.length) throw new Error(`Vector donor has no ${role}: ${id}`);
    const donorBody = bounds(donor, indices(donor, 'body')),
      group = bounds(donor, selected),
      donorFace = bounds(donor, indices(donor, 'eye'));
    const facial = role === 'eye' || role === 'eyewear';
    const circle = await loader.shape('circle');
    const finalEyes = indices(result, 'eye');
    const fittedFace = role === 'eyewear' && finalEyes.length ? bounds(result, finalEyes) : face;
    const targetPair = eyePair(
        role === 'eyewear' ? result : base,
        role === 'eyewear' ? finalEyes : eyeIndices,
      ),
      sourcePair = eyePair(donor, indices(donor, 'eye'));
    const meanHeight = (pair: [Bounds, Bounds]) => (pair[0].size[1]! + pair[1].size[1]!) / 2;
    const scale =
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
    const from = [
      ...(role === 'eye' ? group.center : facial ? donorFace.center : donorBody.center),
    ];
    const to = [...(facial ? fittedFace.center : body.center)];
    if (role === 'eye' && id === 'cyclops' && character.shape === 'rounded_head_two_ears')
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
        faceBlend: [] as number[],
      };
    });
    if (facial && !(role === 'eye' && id === 'cyclops')) {
      const sourceCenters = sourcePair.map((p) => p.center),
        targetCenters = targetPair.map((p) => p.center);
      if (role === 'eyewear' && id === 'separate_trapezoid_lenses') {
        const points = meshes(donor, selected).flatMap((m) => m.points),
          middle = donorFace.center[0]!;
        for (let k = 0; k < 2; k++) {
          const half = points.filter((p) => (p[0]! < middle ? 0 : 1) === k);
          if (half.length)
            sourceCenters[k] = [0, 1, 2].map(
              (axis) =>
                (Math.min(...half.map((p) => p[axis]!)) + Math.max(...half.map((p) => p[axis]!))) /
                2,
            );
        }
      }
      const sourceAngles = [0, 1].map((k) =>
        principal(eyePoints(donor, indices(donor, 'eye'), k), sourcePair[k]!.center),
      );
      const targetAngles = [0, 1].map((k) =>
        principal(
          eyePoints(
            role === 'eyewear' ? result : base,
            role === 'eyewear' ? finalEyes : eyeIndices,
            k,
          ),
          targetCenters[k]!,
        ),
      );
      const lensScales = [scale, scale],
        lensWidths = [1, 1];
      if (role === 'eyewear') {
        const geometry = meshes(donor, selected),
          filled = frontSurface(donor, selected),
          open = id === 'monocle' || id === 'tall_oval_frames';
        for (let k = 0; k < 2; k++) {
          const center = sourceCenters[k]!,
            angle = targetAngles[k]!,
            cos = Math.cos(angle),
            sin = Math.sin(angle);
          const points = eyePoints(result, finalEyes, k),
            sample = points.filter((_, i) => i % Math.max(1, Math.floor(points.length / 96)) === 0);
          const local = sample.map((p) => {
            const x = p[0]! - targetCenters[k]![0]!,
              y = p[1]! - targetCenters[k]![1]!;
            return [x * cos + y * sin, -x * sin + y * cos];
          });
          const sourceAngle = sourceAngles[k]!,
            sx = Math.cos(sourceAngle),
            sy = Math.sin(sourceAngle);
          if (open) {
            const a = Math.min(
              rimDistance(geometry, center, sx, sy),
              rimDistance(geometry, center, -sx, -sy),
            );
            const b = Math.min(
              rimDistance(geometry, center, -sy, sx),
              rimDistance(geometry, center, sy, -sx),
            );
            if (Number.isFinite(a) && Number.isFinite(b) && a > 0.01 && b > 0.01)
              lensScales[k] =
                Math.max(...local.map((p) => Math.hypot(p[0]! / a, p[1]! / b))) * 1.08;
          } else {
            let fitted = scale;
            const contained = (factor: number) =>
              local.every((p) =>
                Number.isFinite(
                  filled(
                    center[0]! + (p[0]! * sx - p[1]! * sy) / factor,
                    center[1]! + (p[0]! * sy + p[1]! * sx) / factor,
                  ),
                ),
              );
            for (let attempt = 0; attempt < 28 && !contained(fitted); attempt++) fitted *= 1.07;
            lensScales[k] = fitted * 1.05;
            if (id === 'separate_trapezoid_lenses') {
              const middle = (sourceCenters[0]![0]! + sourceCenters[1]![0]!) / 2;
              const vertices = geometry
                .flatMap((m) => m.points)
                .filter((p) => (p[0]! < middle ? 0 : 1) === k);
              const donorHalfWidth = Math.max(
                ...vertices.map((p) =>
                  Math.abs(-(p[0]! - center[0]!) * sy + (p[1]! - center[1]!) * sx),
                ),
              );
              const spacing = Math.hypot(
                targetCenters[1]![0]! - targetCenters[0]![0]!,
                targetCenters[1]![1]! - targetCenters[0]![1]!,
              );
              const wanted = Math.max(
                Math.max(...local.map((p) => Math.abs(p[1]!))) * 1.18,
                Math.min(body.size[0]! * 0.21, spacing * 0.48),
              );
              let width = Math.min(1, wanted / Math.max(0.001, donorHalfWidth * lensScales[k]!));
              const fits = (factor: number) =>
                local.every((p) =>
                  Number.isFinite(
                    filled(
                      center[0]! +
                        (p[0]! * sx) / lensScales[k]! -
                        (p[1]! * sy) / (lensScales[k]! * factor),
                      center[1]! +
                        (p[0]! * sy) / lensScales[k]! +
                        (p[1]! * sx) / (lensScales[k]! * factor),
                    ),
                  ),
                );
              for (let attempt = 0; attempt < 40 && !fits(width) && width < 1; attempt++)
                width = Math.min(1, width * 1.04);
              const donorHalfHeight = Math.max(
                ...vertices.map((p) =>
                  Math.abs((p[0]! - center[0]!) * sx + (p[1]! - center[1]!) * sy),
                ),
              );
              lensWidths[k] = Math.min(
                1,
                Math.max(width, (1.2 * donorHalfHeight) / Math.max(0.001, donorHalfWidth)),
              );
            }
          }
        }
      }
      const middle = (sourceCenters[0]![0]! + sourceCenters[1]![0]!) / 2,
        bridge = Math.max(0.001, (sourceCenters[1]![0]! - sourceCenters[0]![0]!) * 0.12);
      for (const v of baked) {
        const rigidSide = bounds(donor, [v.i]).center[0]! < middle ? 0 : 1;
        v.points = v.points.map((p, index) => {
          const original = point(v.rest, v.part.points[index]!),
            t =
              id === 'separate_trapezoid_lenses'
                ? rigidSide
                : Math.max(0, Math.min(1, (original[0]! - middle + bridge) / (2 * bridge)));
          v.faceBlend[index] = t;
          const candidates = [0, 1].map((k) => {
            const dx = original[0]! - sourceCenters[k]![0]!,
              dy = original[1]! - sourceCenters[k]![1]!;
            const sourceAngle = sourceAngles[k]!,
              targetAngle = targetAngles[k]!;
            const major =
              (dx * Math.cos(sourceAngle) + dy * Math.sin(sourceAngle)) * lensScales[k]!;
            const minor =
              (-dx * Math.sin(sourceAngle) + dy * Math.cos(sourceAngle)) *
              lensScales[k]! *
              lensWidths[k]!;
            return [
              targetCenters[k]![0]! + major * Math.cos(targetAngle) - minor * Math.sin(targetAngle),
              targetCenters[k]![1]! + major * Math.sin(targetAngle) + minor * Math.cos(targetAngle),
            ];
          });
          return [
            candidates[0]![0]! * (1 - t) + candidates[1]![0]! * t,
            candidates[0]![1]! * (1 - t) + candidates[1]![1]! * t,
            p[2]!,
          ];
        });
      }
    }
    // Move complete eye assemblies, keeping pupils and eyelids together.
    if (role === 'eye' && id !== 'cyclops' && character.eyeSpacing !== undefined) {
      for (const value of baked) {
        const center = bounds(donor, [value.i]).center[0]!,
          direction = center < group.center[0]! ? -1 : 1;
        const dx = direction * group.size[0]! * 0.25 * scale * (character.eyeSpacing - 1);
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
    if (facial && reference) {
      const all = baked.flatMap((v) => v.points);
      const translation =
        role === 'eye'
          ? fitFaceTranslation(meshes(base, bodyIndices), all, body.size[0]!)
          : [0, 0, 0];
      const zMin = Math.min(...all.map((p) => p[2]!)),
        zMax = Math.max(...all.map((p) => p[2]!));
      const lift = role === 'eyewear' ? 0.035 : 0;
      const layers = [...baked].sort(
        (a, b) =>
          a.points.reduce((n, p) => n + p[2]!, 0) / a.points.length -
          b.points.reduce((n, p) => n + p[2]!, 0) / b.points.length,
      );
      for (const v of baked) {
        const center = [0, 1].map(
          (axis) =>
            (Math.min(...v.points.map((p) => p[axis]!)) +
              Math.max(...v.points.map((p) => p[axis]!))) /
            2,
        );
        v.points = v.points.map((p, index) => {
          const x = p[0]! + translation[0]!,
            y = p[1]! + translation[1]!;
          const t = v.faceBlend[index];
          const depth =
            t === undefined
              ? referenceFaceDepth(reference, x, y, center[0], center[1])
              : referenceFaceDepth(
                  reference,
                  x,
                  y,
                  targetPair[0].center[0],
                  targetPair[0].center[1],
                ) *
                  (1 - t) +
                referenceFaceDepth(
                  reference,
                  x,
                  y,
                  targetPair[1].center[0],
                  targetPair[1].center[1],
                ) *
                  t;
          return [
            x,
            y,
            depth +
              lift +
              layers.indexOf(v) * 0.012 +
              ((p[2]! - zMin) / Math.max(0.001, zMax - zMin)) * 0.004,
          ];
        });
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
    for (const { i, part, rest, matrix, points } of baked) {
      result.parts.push({
        ...part,
        id: `${role}:${id}:${part.id}`,
        points,
        face: facial && !!reference,
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
          const carrier = multiply(head(base, action, frame), targetRestInverse);
          // Keep donor eyelid deformation and relative motion, separate from its source head.
          const relative = multiply(
            multiply(head(donor, 'idle', 0), inverse(head(donor, action, sourceFrame))),
            multiply(world(track, sourceFrame), inverse(rest)),
          );
          const motion =
            role === 'eye' && !reference
              ? multiply(multiply(fit, relative), inverse(fit))
              : identity();
          matrices.push(...multiply(carrier, motion));
          parameters.push(...values(track.parameters, 4, sourceFrame, [0, 0, 0, 0]));
        }
        const carrierTrack = clip.parts[facial ? eyeIndex : bodyIndex] ?? restTrack;
        result.clips[action].parts.push({
          ...restTrack,
          matrix: { samples: matrices },
          parameters: { samples: parameters },
          camera: carrierTrack.camera,
          coverage: carrierTrack.coverage,
        });
      }
    }
  }
  return paint(result, character);
}
