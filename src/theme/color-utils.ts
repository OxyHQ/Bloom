/**
 * Graceful color-utility primitives for consumer-facing composition.
 *
 * Unlike `parseRgbString` in `./color-space` (which THROWS on non-rgb input —
 * it is a canonical-pipeline primitive where a bad value signals a real bug),
 * these helpers fall back gracefully: they return `null` / the untouched input
 * when a color string can't be parsed. That makes them safe to point at
 * arbitrary consumer color values (theme tokens, user-supplied colors) — e.g.
 * building `[bg, withAlpha(bg, 0)]` gradient stops for a scroll fade, where the
 * `transparent` keyword would incorrectly fade through black.
 */

/** RGB channels, each 0..255. */
export interface RgbChannels {
  r: number;
  g: number;
  b: number;
}

/**
 * Parse a color string into its RGB channels, or `null` if it can't be parsed.
 *
 * Accepts Bloom's canonical space-separated `rgb(r g b)` output, legacy
 * comma-separated `rgb(r, g, b)` / `rgba(...)`, and `#rgb` / `#rrggbb` hex.
 * Anything else yields `null` so callers can fall back to the original value.
 */
export function parseRgb(color: string): RgbChannels | null {
  const trimmed = color.trim();
  if (trimmed.startsWith('#')) {
    let hex = trimmed.slice(1);
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    if (hex.length !== 6) return null;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    if ([r, g, b].some((v) => Number.isNaN(v))) return null;
    return { r, g, b };
  }
  const match = /rgba?\(([^)]+)\)/i.exec(trimmed);
  if (!match || match[1] === undefined) return null;
  const parts = match[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  if (parts.length < 3) return null;
  const [r, g, b] = parts;
  if (r === undefined || g === undefined || b === undefined) return null;
  if ([r, g, b].some((v) => Number.isNaN(v))) return null;
  return { r, g, b };
}

/** Compose `color` at `alpha`; returns the input unchanged if it can't parse. */
export function withAlpha(color: string, alpha: number): string {
  const rgb = parseRgb(color);
  if (!rgb) return color;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}
