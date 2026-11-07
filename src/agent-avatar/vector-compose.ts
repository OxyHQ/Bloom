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
  const kept = base.parts.flatMap((p, i) =>
    ['eye', 'eyewear', 'accessory'].includes(p.role ?? '') ? [] : [i],
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
  if (character.eyes !== 'none')
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
    const circle = role === 'eye' ? await loader.shape('circle') : undefined;
    const neutralFace = circle ? bounds(circle, indices(circle, 'eye')) : donorFace;
    const scale =
      role === 'eye'
        ? Math.min(
            face.size[1]! / Math.max(0.01, neutralFace.size[1]!),
            (body.size[0]! * 0.8) / Math.max(0.01, group.size[0]!),
          )
        : Math.min(body.size[0]! / donorBody.size[0]!, body.size[1]! / donorBody.size[1]!);
    const from = [
      ...(role === 'eye' ? group.center : facial ? donorFace.center : donorBody.center),
    ];
    const to = [...(facial ? face.center : body.center)];
    if (role === 'eye' && id === 'cyclops' && character.shape === 'rounded_head_two_ears')
      to[1] = body.center[1]! - 0.14 * body.size[1]!;
    let sizing = shift([0, 0, 0], scale);
    if (role === 'accessory') {
      if (id === 'headphones') {
        from[1] = donorFace.center[1]!;
        to[1] = face.center[1]!;
        sizing = [
          (body.size[0]! / donorBody.size[0]!) * 1.04,
          0,
          0,
          0,
          0,
          (body.size[1]! / donorBody.size[1]!) * 1.04,
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
      return { i, part, rest, matrix, points: part.points.map((p) => point(matrix, p)) };
    });
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
    if (facial && reference) {
      const all = baked.flatMap((v) => v.points),
        cx = reference.center[0],
        cy = reference.center[1];
      const maxRadius = Math.max(...all.map((p) => Math.hypot(p[0]! - to[0]!, p[1]! - to[1]!))),
        shrink = Math.min(1, (reference.radius * 0.85) / Math.max(0.001, maxRadius));
      // Separate authored eye layers after flattening them onto the gaze sphere.
      // Per-vertex depth normalization can make the iris intersect its white backing.
      const layers = [...baked].sort(
        (a, b) =>
          a.points.reduce((sum, p) => sum + p[2]!, 0) / a.points.length -
          b.points.reduce((sum, p) => sum + p[2]!, 0) / b.points.length,
      );
      for (const v of baked)
        v.points = v.points.map((p) => {
          const x = cx + (p[0]! - to[0]!) * shrink,
            y = cy + (p[1]! - to[1]!) * shrink;
          return [
            x,
            y,
            Math.sqrt(Math.max(0.0001, reference.radius ** 2 - (x - cx) ** 2 - (y - cy) ** 2)) +
              0.018 +
              layers.indexOf(v) * 0.012,
          ];
        });
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
