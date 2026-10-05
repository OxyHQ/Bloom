import { avatarHex } from './avatar-color';
import { legacyContours } from './legacy-contours';
import type { AvatarConfig } from './model';
import type { AvatarCharacterConfig } from './config-character';

type Point = [number, number];
export type LegacyRecipe = {
  /** Absent when the original catalog already provides this shape. */
  points?: Point[];
  shape?: string;
  eyes: string;
  selections?: Pick<
    NonNullable<AvatarCharacterConfig['selections']>,
    'eyewear' | 'accessory'
  >;
  patch: { bodyColor: string };
};

/** Saved unsupported artwork stays readable without pretending it was migrated. */
export function legacyRecipeUnsupported(config: AvatarConfig): boolean {
  return (
    config.family === 'alien' || config.family === 'mascot' || !config.face
  );
}

/** Reuse actual beta geometry for equivalent shapes, per the unified catalog. */
export function legacyNativeShape(config: AvatarConfig): string | undefined {
  const shared: Partial<
    Record<AvatarConfig['shape'] | AvatarConfig['foldShape'], string>
  > = {
    circle: 'circle',
    triangle: 'rounded_triangle',
    flower: 'six_lobed_flower',
    diamond: 'rounded_diamond',
    heart: 'heart',
  };
  return config.family === 'fold'
    ? shared[config.foldShape]
    : config.family === 'blob'
      ? shared[config.shape]
      : undefined;
}

/** Radial union of the existing paper front/back or blob contour, starting +X.
 * The fur/body deformation needs a counter-clockwise ring, not winding-dependent
 * path vertices. Every ray takes the outermost segment intersection.
 */
export function radialContour(polygons: Point[][], samples = 256): Point[] {
  if (!Number.isInteger(samples) || samples < 16 || samples > 2048)
    throw new Error('Invalid contour sample count');
  return Array.from({ length: samples }, (_, i) => {
    const angle = (i * Math.PI * 2) / samples;
    const dx = Math.cos(angle),
      dy = Math.sin(angle);
    let radius = 0;
    for (const polygon of polygons)
      for (let j = 0; j < polygon.length; j++) {
        const [ax, ay] = polygon[j]!;
        const [bx, by] = polygon[(j + 1) % polygon.length]!;
        const ex = bx - ax,
          ey = by - ay,
          denominator = dx * ey - dy * ex;
        if (Math.abs(denominator) < 1e-10) continue;
        const distance = (ax * ey - ay * ex) / denominator;
        const segment = (ax * dy - ay * dx) / denominator;
        if (distance > radius && segment >= -1e-8 && segment <= 1 + 1e-8)
          radius = distance;
      }
    if (!Number.isFinite(radius) || radius <= 0)
      throw new Error('Legacy contour does not enclose its origin');
    return [radius * dx, radius * dy];
  });
}

/** Shared capability identity for the editor and the legacy engine adapter. */
export function legacyCharacterRecipe(config: AvatarConfig) {
  const customization =
    config.character?.preset === 'bloom' ? config.character : undefined;
  return {
    preset: 'legacy',
    selections: {
      shape: legacyNativeShape(config) ?? 'circle',
      eyes: customization?.selections?.eyes ?? 'oval',
      ...(customization?.selections?.eyewear
        ? { eyewear: customization.selections.eyewear }
        : {}),
      ...(customization?.selections?.accessory
        ? { accessory: customization.selections.accessory }
        : {}),
    },
    bodyColor: customization?.bodyColor ?? avatarHex(config),
  };
}

/** Legacy recipes contribute their body only; eyes are the original 3D catalog.
 * Historical expression, spacing and tilt fields remain readable but no longer
 * alter the migrated face. The engine owns eye geometry and animation.
 */
export function legacyRecipe(
  config: AvatarConfig,
  samples = 256,
): LegacyRecipe {
  if (legacyRecipeUnsupported(config))
    throw new Error('Unsupported legacy 3D recipe');
  const shape = legacyNativeShape(config);
  const recipe = legacyCharacterRecipe(config);
  const { eyewear, accessory } = recipe.selections;
  return {
    ...(shape
      ? { shape }
      : { points: radialContour(legacyContours(config), samples) }),
    eyes: recipe.selections.eyes,
    ...(eyewear || accessory
      ? {
          selections: {
            ...(eyewear ? { eyewear } : {}),
            ...(accessory ? { accessory } : {}),
          },
        }
      : {}),
    patch: { bodyColor: recipe.bodyColor },
  };
}
