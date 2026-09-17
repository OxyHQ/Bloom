export interface Oklch { l: number; c: number; h: number } // l 0..1, c 0..~0.4, h deg
export interface Rgb { r: number; g: number; b: number }   // 0..255 integers

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const srgbGamma = (x: number) =>
  x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;

/** OKLCH → linear OKLab → linear sRGB → gamma sRGB → 0..255. Pure. */
export function oklchToSrgb({ l, c, h }: Oklch): Rgb {
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr);
  const b2 = c * Math.sin(hr);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b2;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b2;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b2;
  const lc = l_ ** 3, mc = m_ ** 3, sc = s_ ** 3;
  const lr = +4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc;
  const lg = -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc;
  const lb = -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc;
  return {
    r: Math.round(clamp(srgbGamma(lr), 0, 1) * 255),
    g: Math.round(clamp(srgbGamma(lg), 0, 1) * 255),
    b: Math.round(clamp(srgbGamma(lb), 0, 1) * 255),
  };
}

const srgbLinear = (x: number) =>
  x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);

/** 0..255 sRGB → OKLCH. The inverse of {@link oklchToSrgb}. Pure. */
export function srgbToOklch({ r, g, b }: Rgb): Oklch {
  const lr = srgbLinear(r / 255);
  const lg = srgbLinear(g / 255);
  const lb = srgbLinear(b / 255);
  const l_ = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m_ = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s_ = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const l = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  const c = Math.sqrt(a * a + bb * bb);
  const h = (Math.atan2(bb, a) * 180) / Math.PI;
  return { l, c, h: h < 0 ? h + 360 : h };
}

export function srgbToRgbString({ r, g, b }: Rgb, alpha?: number): string {
  return alpha === undefined || alpha >= 1
    ? `rgb(${r} ${g} ${b})`
    : `rgb(${r} ${g} ${b} / ${alpha})`;
}

/**
 * Parse an `rgb(...)` / `rgba(...)` string into an {@link Rgb}.
 *
 * Contract: input MUST be an `rgb(...)` / `rgba(...)` string (e.g. a resolved
 * token from `getResolvedTokens`). Both modern (`rgb(r g b)`) and legacy
 * (`rgb(r, g, b)`) syntaxes are accepted. Anything else throws — this is a
 * canonical-pipeline primitive and a non-rgb input signals a real bug at the
 * call site, never a value to silently coerce to black.
 *
 * @throws {Error} if `s` is not an `rgb()` / `rgba()` string.
 */
export function parseRgbString(s: string): Rgb {
  const inner = s.match(/rgba?\(([^)]+)\)/i)?.[1];
  if (inner === undefined) {
    throw new Error(`parseRgbString: expected an rgb() string, got: ${s}`);
  }
  const [r, g, b] = inner.split(/[ ,/]+/).map((n) => parseInt(n, 10));
  return { r: r ?? 0, g: g ?? 0, b: b ?? 0 };
}

/** Cheap perceptual-ish distance in sRGB (sufficient for a ≤1 rounding gate). */
export function deltaE(a: Rgb, b: Rgb): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2) / Math.sqrt(3);
}
