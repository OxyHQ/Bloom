import { Platform } from 'react-native';

import { resolveButtonRamps } from '../button/shared';
import { oklchToSrgb, srgbToOklch, srgbToRgbString, type Oklch } from '../theme/color-space';
import { parseRgba } from '../theme/color-utils';
import type { Theme } from '../theme/types';
import type { EnergyClass } from './types';

export const IS_WEB = Platform.OS === 'web';

/** `dataSet` hooks for the adopted sheet; nothing on native. */
export function webData(data: Record<string, string>): Record<string, unknown> {
  return IS_WEB ? { dataSet: data } : {};
}

/**
 * Every neutral and accent colour the insight parts paint. Pure.
 *
 *                     light            dark
 *   text              text             text
 *   textSecondary     text-secondary   text-secondary
 *   muted             text-tertiary    text-tertiary
 *   hairline          neutral-200      neutral-800
 *   track             neutral-100      neutral-800     (bar tracks, empty meter segments)
 *   bar               neutral-300      neutral-700     (a comparison row that is not highlighted)
 *   accent            primary          primary         (score fills, the highlighted row)
 *   band              accent-200       accent-800      (the estimate range)
 *   bandSoft          accent-100       accent-900      (the widened ends at low confidence)
 *   iconSurface       neutral-100      neutral-800     (NearbyPlaces icon disc)
 *   card              card             neutral-900     (the PriceEstimate surface)
 *   ring              accent-500                       (keyboard focus)
 */
export interface InsightPalette {
  text: string;
  textSecondary: string;
  muted: string;
  hairline: string;
  track: string;
  bar: string;
  accent: string;
  band: string;
  bandSoft: string;
  iconSurface: string;
  surface: string;
  card: string;
  ring: string;
}

export function resolveInsightPalette(theme: Theme): InsightPalette {
  const c = theme.colors;
  const { accent, neutral: n } = resolveButtonRamps(theme);
  const dark = theme.isDark;
  return {
    text: c.text,
    textSecondary: c.textSecondary,
    muted: c.textTertiary,
    hairline: dark ? n[800] : n[200],
    track: dark ? n[800] : n[100],
    bar: dark ? n[700] : n[300],
    accent: c.primary,
    band: dark ? accent[800] : accent[200],
    bandSoft: dark ? accent[900] : accent[100],
    iconSurface: dark ? n[800] : n[100],
    surface: c.background,
    card: dark ? n[900] : c.card,
    ring: accent[500],
  };
}

// ---------------------------------------------------------------------------
//  Energy scale
// ---------------------------------------------------------------------------

export const ENERGY_CLASSES: readonly EnergyClass[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

export interface EnergyTone {
  fill: string;
  /** Whichever of white / neutral-950 has the higher contrast on `fill`. */
  foreground: string;
}

function lerpOklch(a: Oklch, b: Oklch, t: number): Oklch {
  // Shortest way round the hue circle, so green → yellow does not pass through blue.
  let dh = b.h - a.h;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  return { l: a.l + (b.l - a.l) * t, c: a.c + (b.c - a.c) * t, h: (((a.h + dh * t) % 360) + 360) % 360 };
}

function toOklch(color: string): Oklch | null {
  const rgba = parseRgba(color);
  return rgba ? srgbToOklch(rgba) : null;
}

/** OKLCH → `rgb()`, reducing chroma until it fits sRGB (hue-stable). */
function fitRgb({ l, c, h }: Oklch): string {
  let chroma = c;
  for (let i = 0; i < 24; i++) {
    const rgb = oklchToSrgb({ l, c: chroma, h });
    const back = srgbToOklch(rgb);
    if (Math.abs(back.l - l) < 0.01 && Math.abs(back.c - chroma) < 0.01) return srgbToRgbString(rgb);
    chroma *= 0.9;
  }
  return srgbToRgbString(oklchToSrgb({ l, c: chroma, h }));
}

/** WCAG relative luminance of an opaque colour. */
export function relativeLuminance(color: string): number {
  const rgba = parseRgba(color);
  if (!rgba) return 0;
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(rgba.r) + 0.7152 * lin(rgba.g) + 0.0722 * lin(rgba.b);
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Lightness and chroma per class, A → G: a dark green, brightening to a light
 * yellow at D, darkening again to a deep red. The standard scale's shape —
 * what makes neighbouring classes distinct — lives here; the HUES come from
 * the theme.
 */
export const ENERGY_LIGHTNESS_CHROMA: readonly (readonly [l: number, c: number])[] = [
  [0.52, 0.13],
  [0.64, 0.17],
  [0.76, 0.18],
  [0.86, 0.17],
  [0.76, 0.16],
  [0.66, 0.19],
  [0.57, 0.21],
];

/**
 * The seven class colours, A → G. Each takes the lightness and chroma above
 * and a hue from the theme's STATUS colours: A at `success`'s hue, E at
 * `warning`'s (an amber — D, the lightest step, lands on yellow between the
 * two), G at `error`'s, the classes between interpolated the short way round
 * the hue circle. So a preset's own green, amber and red set the scale,
 * while the steps stay evenly spaced whatever those colours' own lightness.
 * The same in both modes: the scale is a standard, not a surface.
 */
export function resolveEnergyTones(theme: Theme): EnergyTone[] {
  const { neutral: n } = resolveButtonRamps(theme);
  const hue = (color: string, fallback: number) => toOklch(color)?.h ?? fallback;
  const green = hue(theme.colors.success, 150);
  const amber = hue(theme.colors.warning, 70);
  const red = hue(theme.colors.error, 27);
  const fills = ENERGY_LIGHTNESS_CHROMA.map(([l, c], i) => {
    const from = i < 4 ? green : amber;
    const to = i < 4 ? amber : red;
    const t = i < 4 ? i / 4 : (i - 4) / 2;
    return fitRgb(lerpOklch({ l, c, h: from }, { l, c, h: to }, t));
  });
  const dark = n[950];
  return fills.map((fill) => ({
    fill,
    foreground: contrastRatio(fill, '#ffffff') >= contrastRatio(fill, dark) ? '#fff' : dark,
  }));
}

// ---------------------------------------------------------------------------
//  Formatting
// ---------------------------------------------------------------------------

/** `385000` → `"385,000"`. */
export function groupDigits(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? '-' : '';
  return sign + String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** The default price format: `€385,000`. Apps pass their own `format` for currency and locale. */
export const formatEuros = (value: number) => `€${groupDigits(value)}`;

/** The default axis format: `€385K`, `€1.2M`. */
export function formatEurosCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `€${Number((value / 1_000_000).toFixed(1))}M`;
  if (abs >= 1_000) return `€${Math.round(value / 1_000)}K`;
  return `€${Math.round(value)}`;
}

// ---------------------------------------------------------------------------
//  Web CSS — the keyboard ring on the pressable parts
// ---------------------------------------------------------------------------

export const PROPERTY_INSIGHTS_STYLE_ID = 'bloom-property-insights-web-css';

export const PROPERTY_INSIGHTS_CSS = `
[data-bloom-insight-press] {
  outline: none;
  cursor: pointer;
}
[data-bloom-insight-press]:focus-visible {
  outline: 2px solid var(--bloom-insight-ring, currentColor);
  outline-offset: 2px;
}
`;
