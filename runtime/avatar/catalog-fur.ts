/** The original fur exclusion ellipse follows the selected eye surface's
 * bounds. Preserve Float32 arithmetic, including the fixed padding. */
export function catalogFurMask(bounds: { min: number[]; max: number[] }): number[] {
  const f = Math.fround;
  return [
    ...[0, 1].map((k) => f(f(bounds.min[k]! + bounds.max[k]!) * 0.5)),
    ...[0, 1].map((k) =>
      f(f(f(f(bounds.max[k]! - bounds.min[k]!) * 0.5) * f(k ? 1.1 : 1.16)) + f(0.008)),
    ),
  ];
}
