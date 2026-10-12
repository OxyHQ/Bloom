import { bodyFront, type CatalogPiece } from './catalog-fitting';
import type { CatalogDonor } from './catalog-library';

/** Saved radial bodies use the same geometric map for positions, morph targets,
 * inverse-transpose normals and fur tangents. No bitmap or silhouette proxy. */
export function deformCatalogContour(
  source: CatalogDonor,
  points: readonly (readonly number[])[],
): CatalogDonor {
  if (
    points.length < 16 ||
    points.length > 65536 ||
    points.some((p) => p.length !== 2 || !p.every(Number.isFinite))
  )
    throw Error('Invalid avatar contour');
  const map = (p: number[]) => {
    const radius = Math.hypot(p[0]!, p[1]!);
    const slot =
      (((Math.atan2(p[1]!, p[0]!) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2)) * points.length;
    const index = Math.floor(slot),
      t = slot - index,
      next = (index + 1) % points.length;
    return [
      radius * (points[index]![0]! * (1 - t) + points[next]![0]! * t),
      radius * (points[index]![1]! * (1 - t) + points[next]![1]! * t),
      p[2]!,
    ];
  };
  const cross = (a: number[], b: number[]) => [
    a[1]! * b[2]! - a[2]! * b[1]!,
    a[2]! * b[0]! - a[0]! * b[2]!,
    a[0]! * b[1]! - a[1]! * b[0]!,
  ];
  const unit = (v: number[]) => {
    const length = Math.hypot(...v);
    return length > 1e-9 ? v.map((x) => x / length) : v;
  };
  const deform = (part: CatalogPiece): CatalogPiece => {
    const geometry = part.geometry.clone(),
      position = geometry.getAttribute('position');
    const bounds = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
    for (let i = 0; i < position.count; i++) {
      const read = (name: string) => {
        const a = geometry.getAttribute(name);
        return [a.getX(i), a.getY(i), a.getZ(i)];
      };
      const write = (name: string, v: number[]) =>
        geometry.getAttribute(name).setXYZ(i, v[0]!, v[1]!, v[2]!);
      const p = read('position'),
        base = map(p);
      const columns = [0, 1, 2].map((k) => {
        const q = [...p];
        q[k]! += 0.00005;
        return map(q).map((v, j) => (v - base[j]!) / 0.00005);
      });
      const inverse = [
        cross(columns[1]!, columns[2]!),
        cross(columns[2]!, columns[0]!),
        cross(columns[0]!, columns[1]!),
      ];
      const det = columns[0]!.reduce((sum, v, k) => sum + v * inverse[0]![k]!, 0);
      if (Math.abs(det) < 0.000001) throw Error('Singular avatar contour');
      const normal = (v: number[]) =>
        unit([0, 1, 2].map((k) => inverse.reduce((sum, col, j) => sum + col[k]! * v[j]!, 0) / det));
      if (part.fur) {
        write('normal', normal(read('normal')));
        const v = read('normal0');
        write(
          'normal0',
          unit([0, 1, 2].map((k) => columns.reduce((sum, col, j) => sum + col[k]! * v[j]!, 0))),
        );
      } else {
        for (const name of ['delta0', 'delta1']) {
          const v = read(name);
          write(
            name,
            map(p.map((x, k) => x + v[k]!)).map((x, k) => x - base[k]!),
          );
        }
        for (const name of ['normal', 'normal0', 'normal1']) write(name, normal(read(name)));
        // The last three palette components carry the fourth authored normal.
        const palette = geometry.getAttribute('paletteGeometry');
        const n = normal([palette.getY(i), palette.getZ(i), palette.getW(i)]);
        palette.setY(i, n[0]!);
        palette.setZ(i, n[1]!);
        palette.setW(i, n[2]!);
      }
      write('position', base);
      base.forEach((v, k) => {
        bounds.min[k] = Math.min(bounds.min[k]!, Math.fround(v));
        bounds.max[k] = Math.max(bounds.max[k]!, Math.fround(v));
      });
    }
    return { ...part, geometry, bounds };
  };
  const pieces = source.pieces.map((p) => (p.category === 'body' ? deform(p) : p));
  const body = pieces.find((p) => p.category === 'body' && !p.fur)!;
  const result = { ...source, body, pieces };
  const xs = points.map((p) => p[0]!),
    ys = points.map((p) => p[1]!);
  const width = Math.max(...xs) - Math.min(...xs),
    height = Math.max(...ys) - Math.min(...ys);
  const x = (Math.max(...xs) + Math.min(...xs)) / 2,
    y = (Math.max(...ys) + Math.min(...ys)) / 2 + height * 0.05;
  const halfGap = width * 0.13,
    radius = Math.min(width * 0.1, height * 0.12, halfGap * 0.8);
  result.face = {
    radius,
    centers: [-1, 1].map((sign) => {
      const at = x + sign * halfGap,
        front = bodyFront(result, at, y);
      return [at, y, (Number.isFinite(front) ? front : body.bounds.max[2]!) - radius * 0.3];
    }),
  };
  return result;
}
