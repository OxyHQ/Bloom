/**
 * Bloom colour engine — scalar/vector maths.
 *
 * Self-contained port of the Material Color Utilities maths helpers (the same
 * primitives MaterialKolor uses), reimplemented in Bloom's own TypeScript so the
 * theme has ZERO external colour dependencies. Algorithm © Google, Apache-2.0;
 * this is a faithful derivative kept byte-compatible via golden tests.
 */

/** 1 if `n > 0`, -1 if `n < 0`, 0 if `n === 0`. */
export function signum(n: number): number {
  return n < 0 ? -1 : n === 0 ? 0 : 1;
}

/** Linear interpolation: `start` at `amount = 0`, `stop` at `amount = 1`. */
export function lerp(start: number, stop: number, amount: number): number {
  return (1.0 - amount) * start + amount * stop;
}

/** Clamp `input` into `[min, max]`. */
export function clampInt(min: number, max: number, input: number): number {
  return input < min ? min : input > max ? max : input;
}

/** Clamp `input` into `[min, max]` (floating point). */
export function clampDouble(min: number, max: number, input: number): number {
  return input < min ? min : input > max ? max : input;
}

/** Wrap a degree measure into `[0, 360)` as an integer. */
export function sanitizeDegreesInt(degrees: number): number {
  degrees = degrees % 360;
  return degrees < 0 ? degrees + 360 : degrees;
}

/** Wrap a degree measure into `[0, 360)` as a float. */
export function sanitizeDegreesDouble(degrees: number): number {
  degrees = degrees % 360.0;
  return degrees < 0 ? degrees + 360.0 : degrees;
}

/**
 * Sign of the shortest rotation from `from` to `to` on a circle.
 * @returns 1 if increasing `from` is shortest, -1 if decreasing is.
 */
export function rotationDirection(from: number, to: number): number {
  const increasingDifference = sanitizeDegreesDouble(to - from);
  return increasingDifference <= 180.0 ? 1.0 : -1.0;
}

/** Shortest angular distance (degrees) between two hues. */
export function differenceDegrees(a: number, b: number): number {
  return 180.0 - Math.abs(Math.abs(a - b) - 180.0);
}

/** Multiply a 1×3 row vector by a 3×3 matrix. */
export function matrixMultiply(
  row: [number, number, number],
  matrix: [
    [number, number, number],
    [number, number, number],
    [number, number, number],
  ],
): [number, number, number] {
  const a = row[0] * matrix[0][0] + row[1] * matrix[0][1] + row[2] * matrix[0][2];
  const b = row[0] * matrix[1][0] + row[1] * matrix[1][1] + row[2] * matrix[1][2];
  const c = row[0] * matrix[2][0] + row[1] * matrix[2][1] + row[2] * matrix[2][2];
  return [a, b, c];
}
