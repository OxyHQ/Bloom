import type { ViewStyle } from 'react-native';

/** Smooth is platform-adaptive: CSS squircle, iOS continuous, Android round. */
export type CornerCurve = 'round' | 'smooth';

/** Logical corners are resolved using surfaceStyle's explicit direction (default ltr). Missing corners are square. */
export interface CornerRadii {
  readonly topStart?: number;
  readonly topEnd?: number;
  readonly bottomStart?: number;
  readonly bottomEnd?: number;
}

export interface SurfaceShape {
  /** Omit to apply only the curve to an existing radius (including animated radii). */
  readonly radius?: number | CornerRadii;
  readonly curve?: CornerCurve;
}

export interface SurfaceStyle extends ViewStyle {
  /** CSS geometry; ignored by browsers without corner-shape support. */
  cornerShape?: 'round' | 'squircle';
}
