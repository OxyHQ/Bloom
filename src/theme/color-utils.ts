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

/** RGB channels plus the alpha they were written with, 0..1. */
export interface RgbaChannels extends RgbChannels {
  a: number;
}

/**
 * Parse a color string into its RGB channels AND its alpha, or `null` if it
 * can't be parsed.
 *
 * Accepts Bloom's canonical space-separated `rgb(r g b)` output, legacy
 * comma-separated `rgb(r, g, b)` / `rgba(r, g, b, a)`, the slash form
 * `rgb(r g b / a)` with a decimal or percentage alpha, and `#rgb` / `#rrggbb`
 * hex. Anything else yields `null` so callers can fall back to the original
 * value. A color with no alpha component reads back as `a: 1`.
 *
 * The alpha matters because half the palette carries one: the `*Subtle` tints
 * resolve to `rgba(r, g, b, 0.13)` in light and `0.24` in dark, so anything
 * compositing onto a tint has to know it is compositing onto something
 * translucent — dropping the alpha silently turns a tint into an opaque fill.
 */
export function parseRgba(color: string): RgbaChannels | null {
  const trimmed = color.trim();
  if (trimmed.startsWith('#')) {
    let hex = trimmed.slice(1);
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    if (hex.length !== 6) return null;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    if ([r, g, b].some((v) => Number.isNaN(v))) return null;
    return { r, g, b, a: 1 };
  }
  const match = /rgba?\(([^)]+)\)/i.exec(trimmed);
  if (!match || match[1] === undefined) return null;
  const raw = match[1].split(/[\s,/]+/).filter(Boolean);
  if (raw.length < 3) return null;
  const [r, g, b] = raw.map(Number);
  if (r === undefined || g === undefined || b === undefined) return null;
  if ([r, g, b].some((v) => Number.isNaN(v))) return null;
  const alphaText = raw[3];
  if (alphaText === undefined) return { r, g, b, a: 1 };
  const a = alphaText.endsWith('%')
    ? Number(alphaText.slice(0, -1)) / 100
    : Number(alphaText);
  if (Number.isNaN(a)) return null;
  return { r, g, b, a };
}

/**
 * Parse a color string into its RGB channels, or `null` if it can't be parsed.
 *
 * Discards any alpha the string carried — use {@link parseRgba} when the alpha
 * is part of what you are computing.
 */
export function parseRgb(color: string): RgbChannels | null {
  const parsed = parseRgba(color);
  if (!parsed) return null;
  return { r: parsed.r, g: parsed.g, b: parsed.b };
}

/** Compose `color` at `alpha`; returns the input unchanged if it can't parse. */
export function withAlpha(color: string, alpha: number): string {
  const rgb = parseRgb(color);
  if (!rgb) return color;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}
