import { Vector3 } from 'three';
import { tuftSurface } from './tuft-surface';
import type { CatalogPiece } from './catalog-fitting';

/** Grow a C2 shoulder from the coat into the tuft and bury its roots in it.
 * This runs once on owned recipe geometry, never in the animation frame. */
export function integrateCatalogTuft(
  body: CatalogPiece[],
  tuft: CatalogPiece[],
) {
  const surface = tuft.find((p) => !p.fur);
  const coat = body.find((p) => !p.fur);
  if (!surface?.attachmentPivot || !coat) return;
  const root = new Vector3().fromArray(surface.attachmentPivot);
  const normal = new Vector3().fromArray(
    tuftSurface(coat.geometry, root.toArray()).normal,
  );
  const height = surface.bounds.max[1]! - surface.bounds.min[1]!;
  const width = surface.bounds.max[0]! - surface.bounds.min[0]!;
  if (
    !(height > 0 && width > 0) ||
    !Number.isFinite(height + width) ||
    normal.lengthSq() === 0
  )
    throw Error('Invalid tuft attachment dimensions');
  const radius = width * 0.48,
    lift = height * 0.08,
    burial = height * 0.1,
    band = height * 0.28;
  const r2 = radius * radius;
  const bump = (p: Vector3) => {
    const q = p.clone().sub(root),
      t = Math.max(0, 1 - q.lengthSq() / r2);
    return {
      value: lift * t * t * t,
      gradient: q.multiplyScalar((-6 * lift * t * t) / r2),
    };
  };
  const deformation = (p: Vector3, grow: boolean) => {
    if (grow) return bump(p);
    const s = p.clone().sub(root).dot(normal),
      u = Math.max(0, Math.min(1, s / band));
    const smooth = u * u * u * (10 + u * (-15 + 6 * u));
    const derivative =
      s > 0 && s < band ? (30 * u * u * (1 - u) * (1 - u)) / band : 0;
    return {
      value: -burial * (1 - smooth),
      gradient: normal.clone().multiplyScalar(burial * derivative),
    };
  };
  const map = (p: Vector3, grow: boolean) =>
    p.clone().addScaledVector(normal, deformation(p, grow).value);
  const deformNormal = (v: Vector3, at: Vector3, grow: boolean) => {
    const { gradient } = deformation(at, grow);
    if (gradient.lengthSq() === 0) return v;
    // Both maps have J = I + normal ⊗ gradient. Evaluate at each morph endpoint.
    const determinant = 1 + gradient.dot(normal);
    if (!(determinant > 1e-8)) throw Error('Folded tuft attachment');
    return v
      .clone()
      .addScaledVector(gradient, -normal.dot(v) / determinant)
      .normalize();
  };
  for (const part of [...body, ...tuft]) {
    const grow = part.category === 'body';
    const geometry = part.geometry,
      positions = geometry.getAttribute('position');
    const read = (name: string, i: number) =>
      new Vector3().fromBufferAttribute(geometry.getAttribute(name), i);
    const write = (name: string, i: number, v: Vector3) =>
      geometry.getAttribute(name).setXYZ(i, v.x, v.y, v.z);
    for (let i = 0; i < positions.count; i++) {
      const p = read('position', i);
      const target0 =
        !part.fur && geometry.hasAttribute('delta0')
          ? p.clone().add(read('delta0', i))
          : p;
      const target1 =
        !part.fur && geometry.hasAttribute('delta1')
          ? p.clone().add(read('delta1', i))
          : p;
      if (
        deformation(p, grow).value === 0 &&
        deformation(target0, grow).value === 0 &&
        deformation(target1, grow).value === 0
      )
        continue;
      const mapped = map(p, grow);
      if (part.fur) {
        const gradient = deformation(p, grow).gradient;
        const n = deformNormal(read('normal', i), p, grow);
        const tangent = read('normal0', i);
        tangent.addScaledVector(normal, gradient.dot(tangent));
        tangent.addScaledVector(n, -n.dot(tangent)).normalize();
        write('normal', i, n);
        write('normal0', i, tangent);
        if (geometry.hasAttribute('delta1')) {
          const bend = read('delta1', i);
          // Curvature is a vector in the deformed surface frame, not a normal.
          bend.addScaledVector(normal, gradient.dot(bend));
          write('delta1', i, bend);
        }
      } else {
        if (geometry.hasAttribute('delta0'))
          write('delta0', i, map(target0, grow).sub(mapped));
        if (geometry.hasAttribute('delta1'))
          write('delta1', i, map(target1, grow).sub(mapped));
        for (const [name, point] of [
          ['normal', p],
          ['normal0', target0],
          ['normal1', target1],
        ] as const)
          if (geometry.hasAttribute(name))
            write(name, i, deformNormal(read(name, i), point, grow));
        const palette = geometry.getAttribute('paletteGeometry');
        if (palette) {
          const point =
            (part.fields.paletteReference?.[0] ?? 0) > 0.5 ? target1 : p;
          const n = deformNormal(
            new Vector3(palette.getY(i), palette.getZ(i), palette.getW(i)),
            point,
            grow,
          );
          palette.setY(i, n.x);
          palette.setZ(i, n.y);
          palette.setW(i, n.z);
        }
      }
      write('position', i, mapped);
    }
    for (const attribute of Object.values(geometry.attributes))
      attribute.needsUpdate = true;
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    part.bounds = {
      min: geometry.boundingBox!.min.toArray(),
      max: geometry.boundingBox!.max.toArray(),
    };
  }
}
