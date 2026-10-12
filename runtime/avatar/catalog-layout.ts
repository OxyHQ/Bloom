import { bodyFront, type CatalogAssembly, type FaceLayout } from './catalog-fitting';

export type TuftLayout = {
  /** Fraction of body width from its center; placement still lands on its mesh. */
  x: number;
  scale: number;
  rotationZ: number;
};
type ShapeLayout = {
  eyes: { size: number; spread: number; rise: number };
  tuft: TuftLayout;
  singleEyeRise?: number;
};
const layout = (
  size: number,
  spread: number,
  rise: number,
  x: number,
  scale: number,
  degrees: number,
): ShapeLayout => ({
  eyes: { size, spread, rise },
  tuft: { x, scale, rotationZ: (degrees * Math.PI) / 180 },
});

/** Art direction by silhouette. These are proportions, not pixel offsets:
 * actual mesh contact and face depth are resolved after contour construction. */
export const CATALOG_LAYOUTS: Readonly<Record<string, ShapeLayout>> = {
  // Wide bodies need a wider face; tall bodies keep their eyes closer together.
  circle: layout(1.45, 1.55, 0.015, 0.06, 0.95, -15),
  rounded_triangle: layout(1.3, 1.4, -0.025, 0.04, 0.8, -28),
  capsule: layout(1.3, 1.65, 0, -0.3, 1.05, 24),
  slender: layout(1.25, 1.12, 0.065, -0.06, 0.9, 10),
  pocket: layout(1.1, 1.4, 0.03, 0.24, 0.85, -30),
  petal: layout(1.05, 1.15, 0.015, -0.2, 0.88, 22),
  squircle: layout(1.15, 1.4, 0.035, -0.28, 1.05, 22),
  // Keep Todd's face on its eye stalks and place a smaller tuft on the other crest.
  rounded_head_two_ears: {
    ...layout(1.28, 1, 0, 0.28, 0.75, -30),
    // A single eye belongs on the forehead, below the gap between the stalks.
    singleEyeRise: -0.14,
  },
  circle_two_ears: layout(1.65, 1.7, 0.025, 0.22, 0.65, -38),
  // Lobed silhouettes need different crests, rather than identical left forelocks.
  six_lobed_flower: layout(1.05, 1.18, 0, -0.09, 0.88, 10),
  heart: layout(1.4, 1.6, 0.005, 0.27, 0.85, -32),
  four_lobed_butterfly: layout(1.4, 1.45, 0.015, -0.28, 0.85, 24),
  twelve_scalloped_rosette: layout(1.25, 1.4, 0.005, 0.12, 0.85, -20),
  rounded_cube: layout(1.5, 1.65, 0.015, -0.24, 0.92, 20),
  rounded_diamond: layout(1.35, 1.55, -0.025, 0.08, 0.78, -28),
  star: layout(1.15, 1.2, 0.045, 0.015, 0.7, -15),
  cloud: layout(1.1, 1.55, -0.01, 0.25, 0.82, -32),
  shield: layout(1.15, 1.2, 0.035, -0.18, 0.78, 25),
  pebble: layout(1.1, 1.25, 0.02, 0.15, 0.9, -35),
  // Clippo's asymmetric face is authored on its wire; keep those landmarks.
  clippo: layout(1, 1, 0, 0.015, 1.05, -18),
};

export function catalogLayout(shape: string): ShapeLayout {
  const result = CATALOG_LAYOUTS[shape === 'todd' ? 'rounded_head_two_ears' : shape];
  if (!result) throw Error(`Missing avatar layout: ${shape}`);
  return result;
}

export function fitCatalogFace(
  body: CatalogAssembly,
  shape: string,
  singleEye = false,
): FaceLayout {
  if (shape === 'clippo') return body.face;
  const profile = catalogLayout(shape);
  const { size, spread } = profile.eyes;
  const rise = profile.eyes.rise + (singleEye ? (profile.singleEyeRise ?? 0) : 0);
  const radius = body.face.radius * size;
  const middle = (body.face.centers[0]![0]! + body.face.centers[1]![0]!) / 2;
  const height = body.body.bounds.max[1]! - body.body.bounds.min[1]!;
  return {
    radius,
    centers: body.face.centers.map(([x, y]) => {
      const atX = middle + (x! - middle) * spread,
        atY = y! + height * rise;
      const front = bodyFront(body, atX, atY);
      if (!Number.isFinite(front)) throw Error(`Eye layout misses body surface: ${shape}`);
      return [atX, atY, front - radius * 0.3];
    }),
  };
}
