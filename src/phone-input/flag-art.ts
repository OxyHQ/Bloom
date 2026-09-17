/**
 * The encoding `flags.ts` is generated in (`scripts/generate-country-flags.mjs`).
 *
 * A tuple rather than an object per shape keeps the 252-flag table compact —
 * the path data is most of its bytes, and a key name repeated on every one of
 * ~1,300 shapes would be pure overhead.
 */

/** Stroke and fill-rule attributes, already inherited from any `<g>`. */
export interface FlagPaint {
  stroke?: string;
  strokeWidth?: number;
  strokeMiterlimit?: number;
  strokeLinejoin?: 'round' | 'bevel' | 'miter';
  fillRule?: 'evenodd' | 'nonzero';
  clipRule?: 'evenodd' | 'nonzero';
  opacity?: number;
}

/** `[0, fill, d, paint?]` — a `<path>`. */
export type FlagPath = readonly [kind: 0, fill: string, d: string, paint?: FlagPaint];
/** `[1, fill, [cx, cy, r], paint?]` — a `<circle>`. */
export type FlagCircle = readonly [
  kind: 1,
  fill: string,
  geometry: readonly [number, number, number],
  paint?: FlagPaint,
];
/** `[2, fill, [cx, cy, rx, ry], paint?]` — an `<ellipse>`. */
export type FlagEllipse = readonly [
  kind: 2,
  fill: string,
  geometry: readonly [number, number, number, number],
  paint?: FlagPaint,
];

export type FlagShape = FlagPath | FlagCircle | FlagEllipse;

/**
 * `[viewBox, shapes]`. `viewBox` is `0` for the shared `0 0 513 342`, which
 * 198 of the flags use; every flag is 3:2 whatever its viewBox.
 */
export type FlagArt = readonly [viewBox: 0 | string, shapes: readonly FlagShape[]];

export const DEFAULT_FLAG_VIEWBOX = '0 0 513 342';
