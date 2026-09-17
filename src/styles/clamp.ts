/**
 * The two clamps every family writes for itself. Pure, no dependencies.
 *
 * Five copies of `clamp` and three of `clamp01` existed under four names
 * (`clamp01`, `clampFraction`, and the 0–100 `clampProgress`, which is a
 * different function and stays where it is).
 */

/**
 * `value` held inside `[min, max]`.
 *
 * An INVERTED range (`min > max`) resolves to `min`, and that is load-bearing
 * rather than incidental: `overlay/dropdown-placement.ts` inverts the range
 * exactly when a surface is larger than the viewport minus its gutters, and
 * preferring `min` pins the surface to the top/left gutter so its FIRST rows
 * stay reachable. Preferring `max` would push its start off-screen and strand
 * every row. Three of the five copies agreed with `min`; the ordering here is
 * the one that keeps that true.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

/**
 * `value` held inside `[0, 1]` — a fraction, a progress share, a scroll ratio.
 *
 * `undefined`, `NaN` and the infinities all answer `0`, so an unmeasured or
 * not-yet-loaded value reads as "none of it" rather than propagating a
 * non-finite number into a width or an opacity.
 */
export function clamp01(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
