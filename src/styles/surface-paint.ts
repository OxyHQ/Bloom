/**
 * The PURE half of the surface ladder: the relative primitives, and the bundle
 * of CSS variables a surface publishes so className code can follow it.
 *
 * No React, no provider — so `theme/BloomThemeProvider` can publish the page's
 * bundle at the root without an import cycle through `surface-levels.ts`, which
 * re-exports everything here. The module comment in `surface-levels.ts` is the
 * model; this file is only where the maths lives.
 */
import type { Theme } from '../theme/types';
import { mixColors, quietText } from './color-contrast';
import { SURFACE_VAR } from './surface-var-names';

export { SURFACE_VAR };

/**
 * The slice of a theme the primitives read. Every `Theme` is one; the root
 * provider builds its page bundle from resolved tokens before a `Theme`
 * context exists.
 */
export interface SurfaceTheme {
  isDark: Theme['isDark'];
  colors: Pick<Theme['colors'], 'text'>;
}

/** WCAG AA for body-size text. */
export const AA_TEXT = 4.5;
/** WCAG AAA-ish: the rung a SECONDARY label sits at, clearly quieter than the primary one. */
export const AA_TEXT_STRONG = 7;
/** WCAG AA for large text, icons and graphical objects (gridlines, tracks, rules). */
export const AA_GRAPHICAL = 3;

/**
 * How far one surface step moves its parent toward `theme.colors.text`.
 *
 * Tuned so that the step off the PAGE reproduces what Bloom already painted
 * there: light `#f3f3f7` → `#e6e6ea` (today's `n[200]`, 1.12:1) and dark
 * `#0c0e11` → `#21232a` (today's `n[800]`, 1.86:1). Dark takes the larger alpha
 * because a near-black page has the whole range above it while a light page has
 * only the sliver below white.
 */
const FILL_STEP = { light: 0.07, dark: 0.1 } as const;

/** The same move, further: a hairline has to read AS a line, not as another fill. */
const HAIRLINE_STEP = { light: 0.14, dark: 0.2 } as const;

/**
 * The next surface up from `parent` — a text field's fill, a progress track, a
 * stat tile, a hovered row. Always a visible step off whatever it is given.
 */
export function surfaceFillOn(theme: SurfaceTheme, parent: string): string {
  return mixColors(parent, theme.colors.text, FILL_STEP[theme.isDark ? 'dark' : 'light']);
}

/** The hairline that reads on `parent` — a divider, a card edge, a tab rail. */
export function hairlineOn(theme: SurfaceTheme, parent: string): string {
  return mixColors(parent, theme.colors.text, HAIRLINE_STEP[theme.isDark ? 'dark' : 'light']);
}

/** The text rungs legible on one fill. Every member is floored against that fill. */
export interface SurfaceTextPaint {
  /** The primary label — the theme's own text colour. */
  text: string;
  /** A secondary label: clearly quieter, still {@link AA_TEXT_STRONG}. */
  textSecondary: string;
  /** The quietest TEXT rung — captions, axis ticks, placeholders, counters. {@link AA_TEXT}. */
  textTertiary: string;
  /** Not text: gridlines, rules, a disabled glyph, a chart's own furniture. {@link AA_GRAPHICAL}. */
  textGraphical: string;
}

/**
 * The three text rungs plus the graphical one, resolved against `parent`.
 *
 * A ramp stop cannot do this job: `n[400]` clears AA on the page and measures
 * 2.42:1 on a chart card, because the card is not the page. Reading the rungs
 * off the fill they land on is the whole difference.
 */
export function surfaceTextOn(theme: SurfaceTheme, parent: string): SurfaceTextPaint {
  const text = theme.colors.text;
  return {
    text,
    textSecondary: quietText(parent, text, AA_TEXT_STRONG),
    textTertiary: quietText(parent, text, AA_TEXT),
    textGraphical: quietText(parent, text, AA_GRAPHICAL),
  };
}

/**
 * The CSS custom properties a surface publishes to its subtree — on BOTH
 * platforms, through react-native-css's `VariableContextProvider`
 * (`SurfaceLevelProvider`), and at the document/app root for the page
 * (`BloomThemeProvider`). Every value is the JS primitive's own answer, so a
 * className that reads one is byte-identical to the hook path
 * (`surface-vars.test.ts` pins the equality).
 *
 *   --bloom-surface          the fill itself            bg-ambient
 *   --bloom-surface-raised   surfaceFillOn(fill)        bg-ambient-raised
 *   --bloom-hairline         hairlineOn(fill)           border-ambient-hairline
 *   --bloom-text-secondary   AA_TEXT_STRONG on fill     text-on-ambient-secondary
 *   --bloom-text-tertiary    AA_TEXT on fill            text-on-ambient-tertiary
 *   --bloom-text-graphical   AA_GRAPHICAL on fill       text-on-ambient-graphical
 *   --bloom-ring-offset      the fill (focus-ring gap)
 */
export type SurfaceVars = Record<`--${string}`, string>;

/**
 * Bounded memo: the text rungs are a bisection each, and every surface in a tree
 * asks for the same handful of (mode, text, fill) triples on every render.
 */
const SURFACE_VARS_CACHE = new Map<string, SurfaceVars>();
const SURFACE_VARS_CACHE_LIMIT = 256;

/** Everything a subtree needs to paint relative to `fill`, as CSS variables. */
export function surfaceVars(theme: SurfaceTheme, fill: string): SurfaceVars {
  const key = `${theme.isDark ? 'd' : 'l'}|${theme.colors.text}|${fill}`;
  const cached = SURFACE_VARS_CACHE.get(key);
  if (cached) return cached;

  const text = surfaceTextOn(theme, fill);
  const vars: SurfaceVars = {
    [SURFACE_VAR.fill]: fill,
    [SURFACE_VAR.raised]: surfaceFillOn(theme, fill),
    [SURFACE_VAR.hairline]: hairlineOn(theme, fill),
    [SURFACE_VAR.textSecondary]: text.textSecondary,
    [SURFACE_VAR.textTertiary]: text.textTertiary,
    [SURFACE_VAR.textGraphical]: text.textGraphical,
    [SURFACE_VAR.ringOffset]: fill,
  };

  if (SURFACE_VARS_CACHE.size >= SURFACE_VARS_CACHE_LIMIT) SURFACE_VARS_CACHE.clear();
  SURFACE_VARS_CACHE.set(key, vars);
  return vars;
}
