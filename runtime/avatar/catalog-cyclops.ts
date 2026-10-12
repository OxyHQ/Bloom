import { transformCatalogPiece, type CatalogPiece, type FaceLayout } from './catalog-fitting';
import type { CatalogDonor } from './catalog-library';

/** Reconstruct the five layers from the original eye meshes. Recomputing the
 * iris grooves after Float32 placement preserves its exact authored normals. */
export function constructCyclops(source: CatalogDonor, face: FaceLayout): CatalogPiece[] {
  const [outer, pupil] = source.pieces.filter((p) => !p.fur && p.category === 'eyes');
  if (!outer || !pupil) throw Error('Missing Cyclops source eye');
  const center = (p: CatalogPiece) => p.bounds.min.map((v, k) => (v + p.bounds.max[k]!) / 2);
  const radius = face.radius * 2;
  const destination = [0, 1]
    .map((k) => (face.centers[0]![k]! + face.centers[1]![k]!) / 2)
    .concat(Math.max(...face.centers.map((c) => c[2]!)) + face.radius * 0.5);
  const build = (part: CatalogPiece, scale: number, to: number[]) => {
    const origin = center(part);
    return transformCatalogPiece(part, {
      origin,
      scale,
      translate: to.map((v, k) => v - origin[k]!),
    });
  };
  const parts = [
    build(outer, (radius * 2) / (outer.bounds.max[0]! - outer.bounds.min[0]!), destination),
  ];
  const origin = center(pupil);
  let front = parts[0]!.bounds.max[2]!;
  for (const [index, [factor, x, y]] of [
    [0.57, 0, 0],
    [0.53, 0, 0],
    [0.275, 0, 0],
    [0.065, -0.19, 0.23],
  ].entries()) {
    const scale = (radius * factor! * 2) / (pupil.bounds.max[0]! - pupil.bounds.min[0]!);
    const to = [
      destination[0]! + x! * radius,
      destination[1]! + y! * radius,
      front + 0.006 - (pupil.bounds.max[2]! - origin[2]!) * scale,
    ];
    const part = build(pupil, scale, to);
    if (index === 1) {
      const p = part.geometry.getAttribute('position');
      for (let i = 0; i < p.count; i++) {
        const angle = Math.atan2(p.getY(i) - to[1]!, p.getX(i) - to[0]!);
        const groove = 0.2 * Math.sin(angle * 53) + 0.09 * Math.sin(angle * 91);
        for (const name of ['normal', 'normal0', 'normal1', 'paletteGeometry']) {
          const a = part.geometry.getAttribute(name),
            offset = name === 'paletteGeometry' ? 1 : 0;
          const n = [
            a.getComponent(i, offset) + Math.cos(angle) * groove,
            a.getComponent(i, offset + 1) + Math.sin(angle) * groove,
            a.getComponent(i, offset + 2),
          ];
          const length = Math.hypot(...n);
          if (length > 1e-8) n.forEach((v, k) => a.setComponent(i, offset + k, v / length));
        }
      }
    }
    parts.push(part);
    front = part.bounds.max[2]!;
  }
  return parts;
}
