/**
 * Bloom colour engine — CAM16 viewing conditions.
 *
 * Faithful port of Material Color Utilities' `ViewingConditions` (Apache-2.0)
 * into Bloom's own code. Caches the CAM16 intermediates that depend only on the
 * environment (white point, adapting luminance, surround) so the appearance
 * model can run fast. Bloom only ever uses the sRGB `DEFAULT`.
 */
import { whitePointD65, yFromLstar } from './color-utils';
import { lerp } from './math-utils';

export class ViewingConditions {
  private static _default: ViewingConditions | undefined;
  /** sRGB-like viewing conditions (the only ones Bloom uses). */
  static get DEFAULT(): ViewingConditions {
    return (ViewingConditions._default ??= ViewingConditions.make());
  }

  private constructor(
    readonly n: number,
    readonly aw: number,
    readonly nbb: number,
    readonly ncb: number,
    readonly c: number,
    readonly nc: number,
    readonly rgbD: [number, number, number],
    readonly fl: number,
    readonly fLRoot: number,
    readonly z: number,
  ) {}

  static make(
    whitePoint: [number, number, number] = whitePointD65(),
    adaptingLuminance: number = ((200.0 / Math.PI) * yFromLstar(50.0)) / 100.0,
    backgroundLstar = 50.0,
    surround = 2.0,
    discountingIlluminant = false,
  ): ViewingConditions {
    const xyz = whitePoint;
    const rW = xyz[0] * 0.401288 + xyz[1] * 0.650173 + xyz[2] * -0.051461;
    const gW = xyz[0] * -0.250268 + xyz[1] * 1.204414 + xyz[2] * 0.045854;
    const bW = xyz[0] * -0.002079 + xyz[1] * 0.048952 + xyz[2] * 0.953127;
    const f = 0.8 + surround / 10.0;
    const c =
      f >= 0.9 ? lerp(0.59, 0.69, (f - 0.9) * 10.0) : lerp(0.525, 0.59, (f - 0.8) * 10.0);
    let d = discountingIlluminant
      ? 1.0
      : f * (1.0 - (1.0 / 3.6) * Math.exp((-adaptingLuminance - 42.0) / 92.0));
    d = d > 1.0 ? 1.0 : d < 0.0 ? 0.0 : d;
    const nc = f;
    const rgbD: [number, number, number] = [
      d * (100.0 / rW) + 1.0 - d,
      d * (100.0 / gW) + 1.0 - d,
      d * (100.0 / bW) + 1.0 - d,
    ];
    const k = 1.0 / (5.0 * adaptingLuminance + 1.0);
    const k4 = k * k * k * k;
    const k4F = 1.0 - k4;
    const fl = k4 * adaptingLuminance + 0.1 * k4F * k4F * Math.cbrt(5.0 * adaptingLuminance);
    const n = yFromLstar(backgroundLstar) / whitePoint[1];
    const z = 1.48 + Math.sqrt(n);
    const nbb = 0.725 / Math.pow(n, 0.2);
    const ncb = nbb;
    const rgbAFactors: [number, number, number] = [
      Math.pow((fl * rgbD[0] * rW) / 100.0, 0.42),
      Math.pow((fl * rgbD[1] * gW) / 100.0, 0.42),
      Math.pow((fl * rgbD[2] * bW) / 100.0, 0.42),
    ];
    const rgbA: [number, number, number] = [
      (400.0 * rgbAFactors[0]) / (rgbAFactors[0] + 27.13),
      (400.0 * rgbAFactors[1]) / (rgbAFactors[1] + 27.13),
      (400.0 * rgbAFactors[2]) / (rgbAFactors[2] + 27.13),
    ];
    const aw = (2.0 * rgbA[0] + rgbA[1] + 0.05 * rgbA[2]) * nbb;
    return new ViewingConditions(n, aw, nbb, ncb, c, nc, rgbD, fl, Math.pow(fl, 0.25), z);
  }
}
