/** Regional SVG visibility: depth is sampled only to locate the intersection
 * curves; the avatar retains its exact vector silhouette. The resulting mask
 * is continuous interpolated vector contours, never bitmap/pixel SVG tiles.
 */
export type OcclusionPart = {
  i: number;
  points: number[][];
  faces: number[][];
  opaque?: boolean;
  group?: string;
};
const SIZE = 322,
  STEP = 1,
  ORIGIN = -1,
  COUNT = SIZE * SIZE;
const EPSILON = 1e-5;
const buffers = new Map<number, Float32Array>();
const subpixelTargets = new Map<number, Float32Array>();
const sampledParts = new Set<number>();
const top = new Float32Array(COUNT),
  second = new Float32Array(COUNT),
  owner = new Int32Array(COUNT);
const scalar = new Float32Array(COUNT);
function raster(part: OcclusionPart, depth: Float32Array, clear = true) {
  if (clear) depth.fill(-Infinity);
  let sampled = false;
  for (const face of part.faces) {
    const a = part.points[face[0]!]!,
      b = part.points[face[1]!]!,
      c = part.points[face[2]!]!;
    const den = (b[1]! - c[1]!) * (a[0]! - c[0]!) + (c[0]! - b[0]!) * (a[1]! - c[1]!);
    if (Math.abs(den) < 1e-10) continue;
    const x0 = Math.max(0, Math.ceil((Math.min(a[0]!, b[0]!, c[0]!) - ORIGIN) / STEP));
    const x1 = Math.min(SIZE - 1, Math.floor((Math.max(a[0]!, b[0]!, c[0]!) - ORIGIN) / STEP));
    const y0 = Math.max(0, Math.ceil((Math.min(a[1]!, b[1]!, c[1]!) - ORIGIN) / STEP));
    const y1 = Math.min(SIZE - 1, Math.floor((Math.max(a[1]!, b[1]!, c[1]!) - ORIGIN) / STEP));
    const ux = (b[1]! - c[1]!) / den,
      uy = (c[0]! - b[0]!) / den;
    const vx = (c[1]! - a[1]!) / den,
      vy = (a[0]! - c[0]!) / den;
    for (let y = y0; y <= y1; y++) {
      const py = ORIGIN + y * STEP;
      let u = ux * (ORIGIN + x0 * STEP - c[0]!) + uy * (py - c[1]!);
      let v = vx * (ORIGIN + x0 * STEP - c[0]!) + vy * (py - c[1]!);
      for (let x = x0; x <= x1; x++, u += ux * STEP, v += vx * STEP) {
        if (u < -1e-8 || v < -1e-8 || u + v > 1 + 1e-8) continue;
        const z = u * a[2]! + v * b[2]! + (1 - u - v) * c[2]!,
          k = y * SIZE + x;
        if (z > depth[k]!) {
          depth[k]! = z;
          sampled = true;
        }
      }
    }
  }
  return sampled;
}
/** A subpixel triangle can miss every sample; extend its target plane only. */
function rasterSubpixelTarget(part: OcclusionPart, depth: Float32Array, clear = true) {
  if (clear) depth.fill(-Infinity);
  for (const face of part.faces) {
    const a = part.points[face[0]!]!,
      b = part.points[face[1]!]!,
      c = part.points[face[2]!]!;
    const den = (b[1]! - c[1]!) * (a[0]! - c[0]!) + (c[0]! - b[0]!) * (a[1]! - c[1]!);
    if (Math.abs(den) < 1e-10) continue;
    const x0 = Math.max(0, Math.floor(Math.min(a[0]!, b[0]!, c[0]!) - ORIGIN - 1)),
      x1 = Math.min(SIZE - 1, Math.ceil(Math.max(a[0]!, b[0]!, c[0]!) - ORIGIN + 1));
    const y0 = Math.max(0, Math.floor(Math.min(a[1]!, b[1]!, c[1]!) - ORIGIN - 1)),
      y1 = Math.min(SIZE - 1, Math.ceil(Math.max(a[1]!, b[1]!, c[1]!) - ORIGIN + 1));
    const hu = Math.abs(den) / Math.hypot(b[0]! - c[0]!, b[1]! - c[1]!),
      hv = Math.abs(den) / Math.hypot(c[0]! - a[0]!, c[1]! - a[1]!),
      hw = Math.abs(den) / Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!);
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const px = x + ORIGIN,
          py = y + ORIGIN,
          u = ((b[1]! - c[1]!) * (px - c[0]!) + (c[0]! - b[0]!) * (py - c[1]!)) / den,
          v = ((c[1]! - a[1]!) * (px - c[0]!) + (a[0]! - c[0]!) * (py - c[1]!)) / den,
          w = 1 - u - v;
        if (u * hu < -1 || v * hv < -1 || w * hw < -1) continue;
        const z = u * a[2]! + v * b[2]! + w * c[2]!,
          k = y * SIZE + x;
        if (z > depth[k]!) depth[k]! = z;
      }
  }
}
const pairs: [number, number][][] = [
  [],
  [[3, 0]],
  [[0, 1]],
  [[3, 1]],
  [[1, 2]],
  [],
  [[0, 2]],
  [[3, 2]],
  [[2, 3]],
  [[2, 0]],
  [],
  [[2, 1]],
  [[1, 3]],
  [[1, 0]],
  [[0, 3]],
  [],
];
function contours(field: Float32Array, bounds: [number, number, number, number]) {
  const next = new Map<number, number>(),
    vertices = new Map<number, [number, number]>();
  const [x0, x1, y0, y1] = bounds;
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++) {
      const k = y * SIZE + x;
      const v0 = field[k]!,
        v1 = field[k + 1]!,
        v2 = field[k + SIZE + 1]!,
        v3 = field[k + SIZE]!;
      const code = (v0 < 0 ? 1 : 0) | (v1 < 0 ? 2 : 0) | (v2 < 0 ? 4 : 0) | (v3 < 0 ? 8 : 0);
      if (code === 0 || code === 15) continue;
      const values = [v0, v1, v2, v3];
      const center = v0 + v1 + v2 + v3;
      const segments: [number, number][] =
        code === 5
          ? center < 0
            ? [
                [0, 1],
                [2, 3],
              ]
            : [
                [3, 0],
                [1, 2],
              ]
          : code === 10
            ? center < 0
              ? [
                  [3, 0],
                  [1, 2],
                ]
              : [
                  [0, 1],
                  [2, 3],
                ]
            : pairs[code]!;
      const corners: [number, number][] = [
        [x, y],
        [x + 1, y],
        [x + 1, y + 1],
        [x, y + 1],
      ];
      const edgeIds = [k * 2, (k + 1) * 2 + 1, (k + SIZE) * 2, k * 2 + 1];
      const vertex = (e: number) => {
        const id = edgeIds[e]!;
        let p = vertices.get(id);
        if (p) return p;
        const a = e,
          b = (e + 1) % 4,
          ratio = values[a]! / (values[a]! - values[b]!);
        p = [
          corners[a]![0]! + (corners[b]![0]! - corners[a]![0]!) * ratio,
          corners[a]![1]! + (corners[b]![1]! - corners[a]![1]!) * ratio,
        ];
        vertices.set(id, p);
        return p;
      };
      for (const [ea, eb] of segments) {
        let a = vertex(ea),
          b = vertex(eb),
          ia = edgeIds[ea]!,
          ib = edgeIds[eb]!;
        const mx = (a[0]! + b[0]!) * 0.5,
          my = (a[1]! + b[1]!) * 0.5;
        let hidden = 0,
          distance = Infinity;
        for (let c = 0; c < 4; c++)
          if (values[c]! < 0) {
            const d = (corners[c]![0]! - mx) ** 2 + (corners[c]![1]! - my) ** 2;
            if (d < distance) {
              distance = d;
              hidden = c;
            }
          }
        const cross =
          (b[0]! - a[0]!) * (corners[hidden]![1]! - a[1]!) -
          (b[1]! - a[1]!) * (corners[hidden]![0]! - a[0]!);
        // Negative winding cuts the hidden region out of the enclosing rectangle.
        if (cross > 0) {
          const swap = ia;
          ia = ib;
          ib = swap;
        }
        next.set(ia, ib);
      }
    }
  let d = 'M-2 -2H322V322H-2Z';
  for (const start of [...next.keys()]) {
    if (!next.has(start)) continue;
    const loop: number[] = [];
    let current = start;
    while (next.has(current)) {
      loop.push(current);
      const target = next.get(current)!;
      next.delete(current);
      current = target;
      if (current === start) break;
    }
    if (current !== start || loop.length < 3) continue;
    d +=
      'M' +
      loop
        .map((id) => {
          const p = vertices.get(id)!;
          return `${(ORIGIN + p[0]! * STEP).toFixed(3)} ${(ORIGIN + p[1]! * STEP).toFixed(3)}`;
        })
        .join('L') +
      'Z';
  }
  return d;
}
export function projectedVisibilityPaths(parts: OcclusionPart[]): Map<number, string | null> {
  // Equal opaque fills are one visual union: cutting one member out behind
  // another introduces needless antialiased seams. Transparent parts remain
  // separate even if callers supply the same group string.
  const groupMap = new Map<
    string,
    {
      i: number;
      parts: OcclusionPart[];
      opaque: boolean;
      bounds: [number, number, number, number];
    }
  >();
  for (const part of parts) {
    const key =
      part.opaque !== false && part.group !== undefined ? `fill:${part.group}` : `part:${part.i}`;
    let group = groupMap.get(key);
    if (!group) {
      group = {
        i: groupMap.size,
        parts: [],
        opaque: part.opaque !== false,
        bounds: [SIZE, 0, SIZE, 0],
      };
      groupMap.set(key, group);
    }
    group.parts.push(part);
    for (const p of part.points) {
      group.bounds[0] = Math.min(group.bounds[0], Math.floor((p[0]! - ORIGIN) / STEP) - 3);
      group.bounds[1] = Math.max(group.bounds[1], Math.ceil((p[0]! - ORIGIN) / STEP) + 3);
      group.bounds[2] = Math.min(group.bounds[2], Math.floor((p[1]! - ORIGIN) / STEP) - 3);
      group.bounds[3] = Math.max(group.bounds[3], Math.ceil((p[1]! - ORIGIN) / STEP) + 3);
    }
  }
  const groups = [...groupMap.values()];
  top.fill(-Infinity);
  second.fill(-Infinity);
  owner.fill(-1);
  sampledParts.clear();
  for (const group of groups) {
    let depth = buffers.get(group.i);
    if (!depth) {
      depth = new Float32Array(COUNT);
      buffers.set(group.i, depth);
    }
    depth.fill(-Infinity);
    for (const part of group.parts) if (raster(part, depth, false)) sampledParts.add(group.i);
    if (!group.opaque) continue;
    // Each update is one distinct colour group, so second is necessarily a
    // different colour instead of another mesh of the same material.
    const x0 = Math.max(0, group.bounds[0]),
      x1 = Math.min(SIZE - 1, group.bounds[1]);
    const y0 = Math.max(0, group.bounds[2]),
      y1 = Math.min(SIZE - 1, group.bounds[3]);
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const k = y * SIZE + x;
        const z = depth[k]!;
        if (z > top[k]!) {
          second[k]! = top[k]!;
          top[k]! = z;
          owner[k]! = group.i;
        } else if (z > second[k]!) second[k]! = z;
      }
  }
  const result = new Map<number, string | null>();
  for (const group of groups) {
    let depth = buffers.get(group.i)!;
    const field = scalar;
    field.fill(1);
    if (!sampledParts.has(group.i)) {
      let fallback = subpixelTargets.get(group.i);
      if (!fallback) {
        fallback = new Float32Array(COUNT);
        subpixelTargets.set(group.i, fallback);
      }
      fallback.fill(-Infinity);
      for (const part of group.parts) rasterSubpixelTarget(part, fallback, false);
      depth = fallback;
    }
    let hidden = 0,
      minX = SIZE,
      maxX = 0,
      minY = SIZE,
      maxY = 0;
    let [bx0, bx1, by0, by1] = group.bounds;
    bx0 = Math.max(1, bx0);
    by0 = Math.max(1, by0);
    bx1 = Math.min(SIZE - 2, bx1);
    by1 = Math.min(SIZE - 2, by1);
    for (let y = by0; y <= by1; y++)
      for (let x = bx0; x <= bx1; x++) {
        const k = y * SIZE + x;
        let z = depth[k]!;
        const other = owner[k]! === group.i ? second[k]! : top[k]!;
        if (!Number.isFinite(other)) continue;
        if (!Number.isFinite(z)) {
          // Extend only the target's depth, never the occluder's silhouette.
          // A mask must continue beyond a hidden part's own outline; treating its
          // missing exterior samples as visible otherwise reopens a ghost rim.
          let distance = Infinity;
          for (let dy = -2; dy <= 2; dy++)
            for (let dx = -2; dx <= 2; dx++) {
              const nx = x + dx,
                ny = y + dy;
              if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE) continue;
              const neighbor = depth[ny * SIZE + nx]!;
              if (!Number.isFinite(neighbor)) continue;
              const d = dx * dx + dy * dy;
              if (d < distance) {
                distance = d;
                z = neighbor;
              } else if (d === distance) z = Math.max(z, neighbor);
            }
          if (!Number.isFinite(z)) continue;
        }
        const difference = z - other + EPSILON;
        field[k]! = difference;
        if (difference < 0) {
          hidden++;
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    const path = hidden
      ? contours(field, [
          Math.max(0, minX - 1),
          Math.min(SIZE - 1, maxX + 1),
          Math.max(0, minY - 1),
          Math.min(SIZE - 1, maxY + 1),
        ])
      : null;
    for (const part of group.parts) result.set(part.i, path);
  }
  return result;
}
