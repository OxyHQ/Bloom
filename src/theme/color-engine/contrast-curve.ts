/**
 * Bloom colour engine — contrast curve.
 *
 * Faithful port of Material Color Utilities' `ContrastCurve` (Apache-2.0). Maps
 * a scheme's contrast level (−1 low … 0 normal … 1 high) to the target WCAG
 * ratio a role should hit, interpolating between four control points.
 */
import { lerp } from './math-utils';

export class ContrastCurve {
  constructor(
    readonly low: number,
    readonly normal: number,
    readonly medium: number,
    readonly high: number,
  ) {}

  get(contrastLevel: number): number {
    if (contrastLevel <= -1.0) return this.low;
    if (contrastLevel < 0.0) return lerp(this.low, this.normal, (contrastLevel - -1) / 1);
    if (contrastLevel < 0.5) return lerp(this.normal, this.medium, (contrastLevel - 0) / 0.5);
    if (contrastLevel < 1.0) return lerp(this.medium, this.high, (contrastLevel - 0.5) / 0.5);
    return this.high;
  }
}
