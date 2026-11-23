import type { CornerCurve } from '../shapes/corner-types';

/** Shared action geometry, independent of the host's layout. */
export const FAB_METRICS = {
  xs: { diameter: 40, iconSize: 20, labelVariant: 'body-medium' },
  sm: { diameter: 48, iconSize: 24, labelVariant: 'headline-medium' },
  md: { diameter: 50, iconSize: 26, labelVariant: 'headline-medium' },
  lg: { diameter: 64, iconSize: 32, labelVariant: 'title-3-medium' },
} as const;

/** A FAB's silhouette: a squircle (the default), a rounded square, or a circle. */
export type FabShape = 'circle' | 'rounded' | 'squircle';

/** The silhouette a FAB takes when its caller names none: Apple's continuous-corner square. */
export const DEFAULT_FAB_SHAPE: FabShape = 'squircle';

/**
 * Each shape's corner, a fraction of the FAB's diameter, and its curve. `rounded` is a square with
 * circular corners at 28% of its side (Material's rounded FAB, 16 on 56, and the owner's reference
 * FAB, measured at 28%); `squircle` is the same square with Apple's continuous corner (`smooth`: iOS
 * `continuous`, CSS `squircle`). The lens draws every corner continuous, so on Android and OxyOS the
 * two read alike.
 */
export const FAB_SHAPES: Record<FabShape, { corner: number; curve: CornerCurve }> = {
  circle: { corner: 0.5, curve: 'round' },
  rounded: { corner: 0.28, curve: 'round' },
  squircle: { corner: 0.28, curve: 'smooth' },
};

/** The corner radius, in points, of a FAB of `diameter` in `shape`. */
export function fabCornerRadius(shape: FabShape, diameter: number): number {
  return shape === 'circle' ? diameter / 2 : Math.round(diameter * FAB_SHAPES[shape].corner);
}
