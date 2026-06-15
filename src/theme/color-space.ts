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

export function srgbToRgbString({ r, g, b }: Rgb, alpha?: number): string {
  return alpha === undefined || alpha >= 1
    ? `rgb(${r} ${g} ${b})`
    : `rgb(${r} ${g} ${b} / ${alpha})`;
}

export function parseRgbString(s: string): Rgb {
  const m = s.match(/rgba?\(([^)]+)\)/i);
  const [r, g, b] = (m?.[1] ?? '0 0 0').split(/[ ,/]+/).map((n) => parseInt(n, 10));
  return { r: r ?? 0, g: g ?? 0, b: b ?? 0 };
}

/** Cheap perceptual-ish distance in sRGB (sufficient for a ≤1 rounding gate). */
export function deltaE(a: Rgb, b: Rgb): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2) / Math.sqrt(3);
}
