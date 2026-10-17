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

/**
 * Exactly the keys {@link surfaceStyle} writes. A subset of `ViewStyle`, not all
 * of it: spread into a web style object, the whole `ViewStyle` would carry React
 * Native 0.88's array-typed `backgroundImage` into a key the web type spells as a
 * CSS string.
 */
export interface SurfaceStyle
  extends Pick<
    ViewStyle,
    | 'borderRadius'
    | 'borderTopLeftRadius'
    | 'borderTopRightRadius'
    | 'borderBottomLeftRadius'
    | 'borderBottomRightRadius'
    | 'borderCurve'
  > {
  /** CSS geometry; ignored by browsers without corner-shape support. */
  cornerShape?: 'round' | 'squircle';
}
