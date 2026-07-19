/**
 * Bloom colour engine — colour-science conversions (non-HCT).
 *
 * ARGB ⇄ XYZ ⇄ L*a*b*, sRGB (de)linearisation, and L*↔Y. Self-contained port of
 * Material Color Utilities' `color_utils` (Apache-2.0) into Bloom's own code —
 * no external colour dependency. Verified byte-for-byte by golden tests.
 */
import { clampInt, matrixMultiply } from './math-utils';

type Matrix3 = [
  [number, number, number],
  [number, number, number],
  [number, number, number],
];

const SRGB_TO_XYZ: Matrix3 = [
  [0.41233895, 0.35762064, 0.18051042],
  [0.2126, 0.7152, 0.0722],
  [0.01932141, 0.11916382, 0.95034478],
];

const XYZ_TO_SRGB: Matrix3 = [
  [3.2413774792388685, -1.5376652402851851, -0.49885366846268053],
  [-0.9691452513005321, 1.8758853451067872, 0.04156585616912061],
  [0.05562093689691305, -0.20395524564742123, 1.0571799111220335],
];

const WHITE_POINT_D65: [number, number, number] = [95.047, 100.0, 108.883];

/** Pack 0–255 R/G/B into an opaque ARGB int. */
export function argbFromRgb(red: number, green: number, blue: number): number {
  return ((255 << 24) | ((red & 255) << 16) | ((green & 255) << 8) | (blue & 255)) >>> 0;
}

/** Pack linear-RGB (0–100 per channel) into an opaque ARGB int. */
export function argbFromLinrgb(linrgb: [number, number, number]): number {
  return argbFromRgb(delinearized(linrgb[0]), delinearized(linrgb[1]), delinearized(linrgb[2]));
}

export function alphaFromArgb(argb: number): number {
  return (argb >> 24) & 255;
}
export function redFromArgb(argb: number): number {
  return (argb >> 16) & 255;
}
export function greenFromArgb(argb: number): number {
  return (argb >> 8) & 255;
}
export function blueFromArgb(argb: number): number {
  return argb & 255;
}
export function isOpaque(argb: number): boolean {
  return alphaFromArgb(argb) >= 255;
}

/** XYZ → ARGB. */
export function argbFromXyz(x: number, y: number, z: number): number {
  const m = XYZ_TO_SRGB;
  const linearR = m[0][0] * x + m[0][1] * y + m[0][2] * z;
  const linearG = m[1][0] * x + m[1][1] * y + m[1][2] * z;
  const linearB = m[2][0] * x + m[2][1] * y + m[2][2] * z;
  return argbFromRgb(delinearized(linearR), delinearized(linearG), delinearized(linearB));
}

/** ARGB → XYZ. */
export function xyzFromArgb(argb: number): [number, number, number] {
  const r = linearized(redFromArgb(argb));
  const g = linearized(greenFromArgb(argb));
  const b = linearized(blueFromArgb(argb));
  return matrixMultiply([r, g, b], SRGB_TO_XYZ);
}

/** L*a*b* → ARGB. */
export function argbFromLab(l: number, a: number, b: number): number {
  const wp = WHITE_POINT_D65;
  const fy = (l + 16.0) / 116.0;
  const fx = a / 500.0 + fy;
  const fz = fy - b / 200.0;
  const x = labInvf(fx) * wp[0];
  const y = labInvf(fy) * wp[1];
  const z = labInvf(fz) * wp[2];
  return argbFromXyz(x, y, z);
}

/** ARGB → L*a*b*. */
export function labFromArgb(argb: number): [number, number, number] {
  const linearR = linearized(redFromArgb(argb));
  const linearG = linearized(greenFromArgb(argb));
  const linearB = linearized(blueFromArgb(argb));
  const m = SRGB_TO_XYZ;
  const x = m[0][0] * linearR + m[0][1] * linearG + m[0][2] * linearB;
  const y = m[1][0] * linearR + m[1][1] * linearG + m[1][2] * linearB;
  const z = m[2][0] * linearR + m[2][1] * linearG + m[2][2] * linearB;
  const wp = WHITE_POINT_D65;
  const fx = labF(x / wp[0]);
  const fy = labF(y / wp[1]);
  const fz = labF(z / wp[2]);
  return [116.0 * fy - 16, 500.0 * (fx - fy), 200.0 * (fy - fz)];
}

/** L* → ARGB (a grayscale color with that lightness). */
export function argbFromLstar(lstar: number): number {
  const component = delinearized(yFromLstar(lstar));
  return argbFromRgb(component, component, component);
}

/** ARGB → L*. */
export function lstarFromArgb(argb: number): number {
  const y = xyzFromArgb(argb)[1];
  return 116.0 * labF(y / 100.0) - 16.0;
}

/** L* → Y (XYZ luminance). */
export function yFromLstar(lstar: number): number {
  return 100.0 * labInvf((lstar + 16.0) / 116.0);
}

/** Y (XYZ luminance) → L*. */
export function lstarFromY(y: number): number {
  return labF(y / 100.0) * 116.0 - 16.0;
}

/** sRGB component (0–255) → linear (0–100). */
export function linearized(rgbComponent: number): number {
  const normalized = rgbComponent / 255.0;
  return normalized <= 0.040449936
    ? (normalized / 12.92) * 100.0
    : Math.pow((normalized + 0.055) / 1.055, 2.4) * 100.0;
}

/** Linear component (0–100) → sRGB (0–255). */
export function delinearized(rgbComponent: number): number {
  const normalized = rgbComponent / 100.0;
  const delin =
    normalized <= 0.0031308
      ? normalized * 12.92
      : 1.055 * Math.pow(normalized, 1.0 / 2.4) - 0.055;
  return clampInt(0, 255, Math.round(delin * 255.0));
}

/** The D65 white point. */
export function whitePointD65(): [number, number, number] {
  return WHITE_POINT_D65;
}

function labF(t: number): number {
  const e = 216.0 / 24389.0;
  const kappa = 24389.0 / 27.0;
  return t > e ? Math.pow(t, 1.0 / 3.0) : (kappa * t + 16) / 116;
}

function labInvf(ft: number): number {
  const e = 216.0 / 24389.0;
  const kappa = 24389.0 / 27.0;
  const ft3 = ft * ft * ft;
  return ft3 > e ? ft3 : (116 * ft - 16) / kappa;
}
