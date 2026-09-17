import { mixColor, resolveButtonRamps } from '../button/shared';
import { oklchToSrgb, srgbToOklch, srgbToRgbString } from '../theme/color-space';
import { parseRgba } from '../theme/color-utils';
import type { Theme } from '../theme/types';
import type { CalendarViewEventColor, CalendarViewFeedColor } from './types';

/**
 * Semantic calendar tokens, resolved through the ramps `Button` derives from
 * Bloom's theme.
 *
 *                          light          dark                 Token
 *   month card, pills      neutral-100    neutral-900          background-secondary-default
 *   in-month day, panels   card           neutral-800          background-primary-default
 *   out-of-month day       neutral-200    neutral-800          background-tertiary-default
 *   dense grid lines       neutral-200    neutral-800          separator-border(-strong)
 *   panel border           neutral-200    neutral-700          border-button-default
 *   feed row hover         neutral-100    neutral-700 @60%     background-primary-hover
 *   chevron hover          neutral-200    neutral-800          background-secondary-hover
 *   title / day            text           text                 text-primary
 *   secondary text, icons  neutral-500    neutral-500          text-secondary, icon-secondary
 *   focus ring             accent-500     accent-500           border-focus-ring
 *   day shadow             0 1 1 /.05     0 1 1 /.14           shadow-card
 */
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
  const { accent, neutral: n } = resolveButtonRamps(theme);
  const c = theme.colors;
  const shared = {
    text: c.text,
    textSecondary: n[500],
    iconPrimary: c.text,
    iconSecondary: n[500],
    ring: accent[500],
    // A fixed spread, raw in both modes.
    shadowDetails: '0px 1px 2px 0px rgba(0,0,0,0.04), 0px 7px 8px 0px rgba(0,0,0,0.04)',
    isDark: theme.isDark,
  };
  return theme.isDark
    ? {
        ...shared,
        card: n[900],
        pill: n[900],
        dayCurrent: n[800],
        dayOutside: n[800],
        denseDayCurrent: n[900],
        denseDayOutside: n[900],
        gridLine: n[800],
        panel: n[800],
        panelBorder: n[700],
        rowHover: mixColor(n[800], n[700], 0.6),
        secondaryHover: n[800],
        detailRow: n[900],
        infoChip: n[800],
        shadowCard: '0 1px 1px 0 rgb(0 0 0 / 0.14)',
        shadowDropdown: '0 1px 1px 0 rgb(0 0 0 / 0.14), 0 4px 4px 0 rgb(0 0 0 / 0.10)',
      }
    : {
        ...shared,
        card: n[100],
        pill: n[100],
        dayCurrent: c.card,
        dayOutside: n[200],
        denseDayCurrent: c.card,
        denseDayOutside: n[100],
        gridLine: n[200],
        panel: c.card,
        panelBorder: n[200],
        rowHover: n[100],
        secondaryHover: n[200],
        detailRow: n[100],
        infoChip: n[200],
        shadowCard: '0 1px 1px 0 rgb(0 0 0 / 0.05)',
        shadowDropdown: '0 1px 1px 0 rgb(0 0 0 / 0.04), 0 4px 4px 0 rgb(0 0 0 / 0.02)',
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
