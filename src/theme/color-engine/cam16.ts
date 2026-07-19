/**
 * Bloom colour engine — CAM16 colour appearance model.
 *
 * Faithful port of Material Color Utilities' `Cam16` (Apache-2.0) into Bloom's
 * own code. A colour is defined by its ARGB AND the viewing conditions; CAM16
 * also exposes CAM16-UCS coordinates (jstar/astar/bstar) for perceptual
 * distance. Underpins the HCT colour space.
 */
import { argbFromXyz, linearized } from './color-utils';
import { signum } from './math-utils';
import { ViewingConditions } from './viewing-conditions';

export class Cam16 {
  constructor(
    readonly hue: number,
    readonly chroma: number,
    readonly j: number,
    readonly q: number,
    readonly m: number,
    readonly s: number,
    readonly jstar: number,
    readonly astar: number,
    readonly bstar: number,
  ) {}

  /** CAM16-UCS perceptual distance to another colour. */
  distance(other: Cam16): number {
    const dJ = this.jstar - other.jstar;
    const dA = this.astar - other.astar;
    const dB = this.bstar - other.bstar;
    const dEPrime = Math.sqrt(dJ * dJ + dA * dA + dB * dB);
    return 1.41 * Math.pow(dEPrime, 0.63);
  }

  static fromInt(argb: number): Cam16 {
    return Cam16.fromIntInViewingConditions(argb, ViewingConditions.DEFAULT);
  }

  static fromIntInViewingConditions(argb: number, vc: ViewingConditions): Cam16 {
    const red = (argb & 0x00ff0000) >> 16;
    const green = (argb & 0x0000ff00) >> 8;
    const blue = argb & 0x000000ff;
    const redL = linearized(red);
    const greenL = linearized(green);
    const blueL = linearized(blue);
    const x = 0.41233895 * redL + 0.35762064 * greenL + 0.18051042 * blueL;
    const y = 0.2126 * redL + 0.7152 * greenL + 0.0722 * blueL;
    const z = 0.01932141 * redL + 0.11916382 * greenL + 0.95034478 * blueL;
    return Cam16.fromXyzInViewingConditions(x, y, z, vc);
  }

  static fromXyzInViewingConditions(
    x: number,
    y: number,
    z: number,
    vc: ViewingConditions,
  ): Cam16 {
    const rC = 0.401288 * x + 0.650173 * y - 0.051461 * z;
    const gC = -0.250268 * x + 1.204414 * y + 0.045854 * z;
    const bC = -0.002079 * x + 0.048952 * y + 0.953127 * z;
    const rD = vc.rgbD[0] * rC;
    const gD = vc.rgbD[1] * gC;
    const bD = vc.rgbD[2] * bC;
    const rAF = Math.pow((vc.fl * Math.abs(rD)) / 100.0, 0.42);
    const gAF = Math.pow((vc.fl * Math.abs(gD)) / 100.0, 0.42);
    const bAF = Math.pow((vc.fl * Math.abs(bD)) / 100.0, 0.42);
    const rA = (signum(rD) * 400.0 * rAF) / (rAF + 27.13);
    const gA = (signum(gD) * 400.0 * gAF) / (gAF + 27.13);
    const bA = (signum(bD) * 400.0 * bAF) / (bAF + 27.13);
    const a = (11.0 * rA + -12.0 * gA + bA) / 11.0;
    const b = (rA + gA - 2.0 * bA) / 9.0;
    const u = (20.0 * rA + 20.0 * gA + 21.0 * bA) / 20.0;
    const p2 = (40.0 * rA + 20.0 * gA + bA) / 20.0;
    const atan2 = Math.atan2(b, a);
    const atanDegrees = (atan2 * 180.0) / Math.PI;
    const hue =
      atanDegrees < 0 ? atanDegrees + 360.0 : atanDegrees >= 360 ? atanDegrees - 360 : atanDegrees;
    const hueRadians = (hue * Math.PI) / 180.0;
    const ac = p2 * vc.nbb;
    const J = 100.0 * Math.pow(ac / vc.aw, vc.c * vc.z);
    const Q = (4.0 / vc.c) * Math.sqrt(J / 100.0) * (vc.aw + 4.0) * vc.fLRoot;
    const huePrime = hue < 20.14 ? hue + 360 : hue;
    const eHue = (1.0 / 4.0) * (Math.cos((huePrime * Math.PI) / 180.0 + 2.0) + 3.8);
    const p1 = ((50000.0 / 13.0) * eHue * vc.nc * vc.ncb);
    const t = (p1 * Math.sqrt(a * a + b * b)) / (u + 0.305);
    const alpha = Math.pow(t, 0.9) * Math.pow(1.64 - Math.pow(0.29, vc.n), 0.73);
    const C = alpha * Math.sqrt(J / 100.0);
    const M = C * vc.fLRoot;
    const s = 50.0 * Math.sqrt((alpha * vc.c) / (vc.aw + 4.0));
    const jstar = ((1.0 + 100.0 * 0.007) * J) / (1.0 + 0.007 * J);
    const mstar = Math.log(1.0 + 0.0228 * M) / 0.0228;
    const astar = mstar * Math.cos(hueRadians);
    const bstar = mstar * Math.sin(hueRadians);
    return new Cam16(hue, C, J, Q, M, s, jstar, astar, bstar);
  }

  static fromJch(j: number, c: number, h: number): Cam16 {
    return Cam16.fromJchInViewingConditions(j, c, h, ViewingConditions.DEFAULT);
  }

  static fromJchInViewingConditions(
    j: number,
    c: number,
    h: number,
    vc: ViewingConditions,
  ): Cam16 {
    const q = (4.0 / vc.c) * Math.sqrt(j / 100.0) * (vc.aw + 4.0) * vc.fLRoot;
    const m = c * vc.fLRoot;
    const alpha = c / Math.sqrt(j / 100.0);
    const s = 50.0 * Math.sqrt((alpha * vc.c) / (vc.aw + 4.0));
    const hueRadians = (h * Math.PI) / 180.0;
    const jstar = ((1.0 + 100.0 * 0.007) * j) / (1.0 + 0.007 * j);
    const mstar = (1.0 / 0.0228) * Math.log(1.0 + 0.0228 * m);
    const astar = mstar * Math.cos(hueRadians);
    const bstar = mstar * Math.sin(hueRadians);
    return new Cam16(h, c, j, q, m, s, jstar, astar, bstar);
  }

  static fromUcs(jstar: number, astar: number, bstar: number): Cam16 {
    return Cam16.fromUcsInViewingConditions(jstar, astar, bstar, ViewingConditions.DEFAULT);
  }

  static fromUcsInViewingConditions(
    jstar: number,
    astar: number,
    bstar: number,
    vc: ViewingConditions,
  ): Cam16 {
    const a = astar;
    const b = bstar;
    const m = Math.sqrt(a * a + b * b);
    const M = (Math.exp(m * 0.0228) - 1.0) / 0.0228;
    const c = M / vc.fLRoot;
    let h = Math.atan2(b, a) * (180.0 / Math.PI);
    if (h < 0.0) h += 360.0;
    const j = jstar / (1 - (jstar - 100) * 0.007);
    return Cam16.fromJchInViewingConditions(j, c, h, vc);
  }

  toInt(): number {
    return this.viewed(ViewingConditions.DEFAULT);
  }

  viewed(vc: ViewingConditions): number {
    const xyz = this.xyzInViewingConditions(vc);
    return argbFromXyz(xyz[0], xyz[1], xyz[2]);
  }

  xyzInViewingConditions(vc: ViewingConditions): [number, number, number] {
    const alpha = this.chroma === 0.0 || this.j === 0.0 ? 0.0 : this.chroma / Math.sqrt(this.j / 100.0);
    const t = Math.pow(alpha / Math.pow(1.64 - Math.pow(0.29, vc.n), 0.73), 1.0 / 0.9);
    const hRad = (this.hue * Math.PI) / 180.0;
    const eHue = 0.25 * (Math.cos(hRad + 2.0) + 3.8);
    const ac = vc.aw * Math.pow(this.j / 100.0, 1.0 / vc.c / vc.z);
    const p1 = eHue * (50000.0 / 13.0) * vc.nc * vc.ncb;
    const p2 = ac / vc.nbb;
    const hSin = Math.sin(hRad);
    const hCos = Math.cos(hRad);
    const gamma = (23.0 * (p2 + 0.305) * t) / (23.0 * p1 + 11.0 * t * hCos + 108.0 * t * hSin);
    const a = gamma * hCos;
    const b = gamma * hSin;
    const rA = (460.0 * p2 + 451.0 * a + 288.0 * b) / 1403.0;
    const gA = (460.0 * p2 - 891.0 * a - 261.0 * b) / 1403.0;
    const bA = (460.0 * p2 - 220.0 * a - 6300.0 * b) / 1403.0;
    const rCBase = Math.max(0, (27.13 * Math.abs(rA)) / (400.0 - Math.abs(rA)));
    const rC = signum(rA) * (100.0 / vc.fl) * Math.pow(rCBase, 1.0 / 0.42);
    const gCBase = Math.max(0, (27.13 * Math.abs(gA)) / (400.0 - Math.abs(gA)));
    const gC = signum(gA) * (100.0 / vc.fl) * Math.pow(gCBase, 1.0 / 0.42);
    const bCBase = Math.max(0, (27.13 * Math.abs(bA)) / (400.0 - Math.abs(bA)));
    const bC = signum(bA) * (100.0 / vc.fl) * Math.pow(bCBase, 1.0 / 0.42);
    const rF = rC / vc.rgbD[0];
    const gF = gC / vc.rgbD[1];
    const bF = bC / vc.rgbD[2];
    const x = 1.86206786 * rF - 1.01125463 * gF + 0.14918677 * bF;
    const y = 0.38752654 * rF + 0.62144744 * gF - 0.00897398 * bF;
    const z = -0.0158415 * rF - 0.03412294 * gF + 1.04996444 * bF;
    return [x, y, z];
  }
}
