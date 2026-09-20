import { oklchToSrgb, srgbToOklch, srgbToRgbString } from '../theme/color-space';
import { parseRgba } from '../theme/color-utils';
import type { Theme } from '../theme/types';
import type { CalendarViewEventColor, CalendarViewFeedColor } from './types';

/** Surface and text slots read canonical theme roles; fixed shadow geometry is unchanged. */
export interface CalendarViewPalette {
  card: string;
  pill: string;
  dayCurrent: string;
  dayOutside: string;
  /** The dense (phone) grid's day surfaces. */
  denseDayCurrent: string;
  denseDayOutside: string;
  gridLine: string;
  panel: string;
  panelBorder: string;
  rowHover: string;
  secondaryHover: string;
  detailRow: string;
  infoChip: string;
  text: string;
  textSecondary: string;
  iconPrimary: string;
  iconSecondary: string;
  ring: string;
  shadowCard: string;
  shadowDropdown: string;
  shadowDetails: string;
  isDark: boolean;
}

export function resolveCalendarViewPalette(theme: Theme): CalendarViewPalette {
  const c = theme.colors;
  return {
    card: c.backgroundSecondary, pill: c.backgroundSecondary,
    dayCurrent: c.card, dayOutside: c.backgroundTertiary,
    denseDayCurrent: c.card, denseDayOutside: c.backgroundSecondary,
    gridLine: c.borderLight, panel: c.card, panelBorder: c.border,
    rowHover: c.backgroundSecondary, secondaryHover: c.backgroundTertiary,
    detailRow: c.backgroundSecondary, infoChip: c.backgroundTertiary,
    text: c.text, textSecondary: c.textSecondary, iconPrimary: c.text,
    iconSecondary: c.textSecondary, ring: c.primary, isDark: theme.isDark,
    shadowDetails: '0px 1px 2px 0px rgba(0,0,0,0.04), 0px 7px 8px 0px rgba(0,0,0,0.04)',
    shadowCard: theme.isDark ? '0 1px 1px 0 rgb(0 0 0 / 0.14)' : '0 1px 1px 0 rgb(0 0 0 / 0.05)',
    shadowDropdown: theme.isDark ? '0 1px 1px 0 rgb(0 0 0 / 0.14), 0 4px 4px 0 rgb(0 0 0 / 0.10)' : '0 1px 1px 0 rgb(0 0 0 / 0.04), 0 4px 4px 0 rgb(0 0 0 / 0.02)',
  };
}

// ---------------------------------------------------------------------------
//  Data hues
//
//  Events and feed swatches are painted from raw Tailwind
//  hues (blue, pink, purple, lime, emerald, red, teal). Each stop is carried as
//  Tailwind v4's OKLCH and re-anchored on the theme: the hue rotates by the
//  distance between the theme's primary and Tailwind's blue-500, and chroma
//  scales by their ratio — so a blue preset reproduces the palette exactly
//  and every other preset turns the whole set with its
//  primary. Lightness stays Tailwind's, so contrast between title and chip
//  survives any preset. The chroma ratio is floored at 0.5: a near-grey primary
//  must not collapse five categories into one grey.
// ---------------------------------------------------------------------------

type Lch = readonly [l: number, c: number, h: number];
type Hue = 'blue' | 'pink' | 'purple' | 'lime' | 'emerald' | 'red' | 'teal';
type Stop = 100 | 200 | 300 | 500 | 700 | 800 | 900 | 950;

const TAILWIND: Record<Hue, Partial<Record<Stop, Lch>>> = {
  blue: {
    100: [0.932, 0.032, 255.585],
    200: [0.882, 0.059, 254.128],
    300: [0.809, 0.105, 251.813],
    500: [0.623, 0.214, 259.815],
    700: [0.488, 0.243, 264.376],
    900: [0.379, 0.146, 265.522],
    950: [0.282, 0.091, 267.935],
  },
  pink: {
    100: [0.948, 0.028, 342.258],
    200: [0.899, 0.061, 343.231],
    300: [0.823, 0.12, 346.018],
    500: [0.656, 0.241, 354.308],
    700: [0.525, 0.223, 3.958],
    950: [0.284, 0.109, 3.907],
  },
  purple: {
    100: [0.946, 0.033, 307.174],
    200: [0.902, 0.063, 306.703],
    300: [0.827, 0.119, 306.383],
    700: [0.496, 0.265, 301.924],
    950: [0.291, 0.149, 302.717],
  },
  lime: {
    100: [0.967, 0.067, 122.328],
    200: [0.938, 0.127, 124.321],
    300: [0.897, 0.196, 126.665],
    700: [0.532, 0.157, 131.589],
    800: [0.453, 0.124, 130.933],
    950: [0.274, 0.072, 132.109],
  },
  emerald: {
    100: [0.95, 0.052, 163.051],
    300: [0.845, 0.143, 164.978],
    700: [0.508, 0.118, 165.612],
    800: [0.432, 0.095, 166.913],
    950: [0.262, 0.051, 172.552],
  },
  red: { 200: [0.885, 0.062, 18.334], 700: [0.505, 0.213, 27.518] },
  teal: { 200: [0.91, 0.096, 180.426], 700: [0.511, 0.096, 186.391] },
};

const BLUE_500 = TAILWIND.blue[500]!;

function toRgb(l: number, c: number, h: number): string {
  let chroma = c;
  for (let i = 0; i < 24; i++) {
    const rgb = oklchToSrgb({ l, c: chroma, h });
    const back = srgbToOklch(rgb);
    if (Math.abs(back.l - l) < 0.01 && Math.abs(back.c - chroma) < 0.01) return srgbToRgbString(rgb);
    chroma *= 0.9;
  }
  return srgbToRgbString(oklchToSrgb({ l, c: chroma, h }));
}

/** A hue's Tailwind stop, re-anchored on the theme's primary. */
export type HueResolver = (hue: Hue, stop: Stop) => string;

export function createHueResolver(primary: string): HueResolver {
  const rgba = parseRgba(primary);
  const base = rgba ? srgbToOklch(rgba) : null;
  const shift = base ? base.h - BLUE_500[2] : 0;
  const ratio = base ? Math.min(1.25, Math.max(0.5, base.c / BLUE_500[1])) : 1;
  const cache = new Map<string, string>();
  return (hue, stop) => {
    const key = `${hue}-${stop}`;
    const hit = cache.get(key);
    if (hit) return hit;
    const [l, c, h] = TAILWIND[hue][stop]!;
    const value = toRgb(l, c * ratio, (((h + shift) % 360) + 360) % 360);
    cache.set(key, value);
    return value;
  };
}

export interface EventChipColors {
  background: string;
  title: string;
  time: string;
}

/**
 * `--color-calendar-event-*`: light `*-100` surface with a `*-700` title
 * (`*-800` for lime and emerald) and `*-700` time; dark `*-950` with `*-300`.
 */
export function eventChipColors(
  hue: HueResolver,
  color: CalendarViewEventColor,
  isDark: boolean,
): EventChipColors {
  if (isDark) {
    return {
      background: hue(color, 950),
      title: hue(color, 300),
      time: hue(color, 300),
    };
  }
  const deep = color === 'lime' || color === 'emerald';
  return {
    background: hue(color, 100),
    title: hue(color, deep ? 800 : 700),
    time: hue(color, 700),
  };
}

/** The inbox swatch: `bg-*-200 text-*-700`, blue `text-blue-900` (Figma's variables). */
export function feedSwatchColors(
  hue: HueResolver,
  color: CalendarViewFeedColor,
): { background: string; icon: string } {
  return {
    background: hue(color, 200),
    icon: hue(color, color === 'blue' ? 900 : 700),
  };
}
