/**
 * The surface LADDER: one answer to "what colour is the thing I am sitting on,
 * and what colour is the thing I put on top of it".
 *
 * Thirty families had each resolved that themselves, and the result was four
 * different dark "card on a page" fills in one tree — `#14171c` (chart cards),
 * `#23262b` (menus, fields, tab rails), `#2e353e` (`theme.colors.card`) and a
 * per-family mix — plus two light ones. Two of those collisions are not a
 * cosmetic drift but a disappearing act: a dark text field painted `n[800]`
 * inside a menu painted `n[800]` measured 1.000:1, and a tab rail painted
 * `n[800]` inside a queue panel painted `n[800]` measured ΔE 0. In both cases
 * the control had no shell at all.
 *
 * The fix is not another table of hexes. A control cannot know its own parent,
 * so the only durable form of the answer is RELATIVE: every step is computed
 * from the fill it lands on.
 *
 *   surfaceFillOn(theme, parent)   the next surface up — a field, a track, a tile
 *   hairlineOn(theme, parent)      the line that separates them
 *   surfaceTextOn(theme, parent)   text rungs that clear AA *on that fill*
 *
 * A step moves the parent fill toward the theme's own `text` colour by a fixed
 * alpha. That is deliberately the same move the neutral ramp makes, so nothing
 * new enters the palette — but it is anchored on the ACTUAL parent instead of a
 * ramp stop that happens to match one page colour.
 *
 * **Light and dark are one rule here, not two.** Moving toward `text` darkens a
 * light surface and lightens a dark one, which is what each mode wants; the
 * alphas differ only because a dark page has more headroom above it than a light
 * page has below white.
 *
 * ## The named rungs
 *
 * `resolveSurfaceLevel(theme, level)` names the four rungs a screen actually
 * uses, and the first two land on what Bloom already paints, so adopting the
 * API is not a repaint:
 *
 *   0  page          `theme.colors.background`
 *   1  card on page  light `theme.colors.card` (white), dark one step off the
 *                    page — `#212327` against the `#23262b` that
 *                    `floating/menu-palette` has always used, 1.03:1 apart
 *   2  card on card  one step off level 1 — a popover's inner tile, a field
 *   3  deep          one step off level 2
 *
 * The ladder is NOT monotonic in lightness. In light mode the first step goes
 * UP to white and every step after goes down; in dark every step goes up. What
 * is monotonic — and what the gate pins — is the SEPARATION between neighbours:
 * measured on `blue`, every adjacent pair separates by fill alone (light 1.11 /
 * 1.15 / 1.15, dark 1.23 / 1.30 / 1.30).
 *
 * 1.11:1 is a thin margin, and that is why every rung ALSO carries the `border`
 * that separates it from its parent (light 1.21 / 1.53 / 1.50). A surface either
 * separates by fill or it draws its hairline, and on a light page a card needs
 * the hairline. `surface-levels.test.ts` pins both mechanisms over every preset,
 * so losing either one goes red.
 *
 * ## Ambient level
 *
 * `SurfaceLevelProvider` publishes "the fill my children are sitting on", and
 * `useSurfaceLevel()` reads it. A container that paints a surface raises it;
 * everything inside then steps off the right parent without being told.
 * Defaulting to level 0 keeps every unwrapped consumer on the page rung, which
 * is what it was already assuming.
 */
import { createContext, createElement, useContext, useMemo, type ReactNode } from 'react';

import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { mixColors, quietText } from './color-contrast';
import { RING_OFFSET_VAR } from './interactive-web-css';

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
export function surfaceFillOn(theme: Theme, parent: string): string {
  return mixColors(parent, theme.colors.text, FILL_STEP[theme.isDark ? 'dark' : 'light']);
}

/** The hairline that reads on `parent` — a divider, a card edge, a tab rail. */
export function hairlineOn(theme: Theme, parent: string): string {
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
export function surfaceTextOn(theme: Theme, parent: string): SurfaceTextPaint {
  const text = theme.colors.text;
  return {
    text,
    textSecondary: quietText(parent, text, AA_TEXT_STRONG),
    textTertiary: quietText(parent, text, AA_TEXT),
    textGraphical: quietText(parent, text, AA_GRAPHICAL),
  };
}

/** The four rungs a screen stacks. See the module comment for what each one is. */
export type SurfaceLevel = 0 | 1 | 2 | 3;

export const SURFACE_LEVELS: readonly SurfaceLevel[] = [0, 1, 2, 3];

export interface SurfaceLevelPaint extends SurfaceTextPaint {
  level: SurfaceLevel;
  /** The fill at this rung. */
  background: string;
  /** The hairline that separates this rung from the one below it, and divides it internally. */
  border: string;
  /** The next fill UP — what a control placed on this rung paints itself. */
  raised: string;
}

/** The fill of one rung. Levels 0 and 1 are pinned to what Bloom already paints. */
function levelBackground(theme: Theme, level: SurfaceLevel): string {
  const page = theme.colors.background;
  if (level === 0) return page;
  // Level 1 is `card` in light (white) and a step off the page in dark, which is
  // byte-for-byte the surface `floating/menu-palette` has always used.
  const card = theme.isDark ? surfaceFillOn(theme, page) : theme.colors.card;
  if (level === 1) return card;
  const inner = surfaceFillOn(theme, card);
  return level === 2 ? inner : surfaceFillOn(theme, inner);
}

/** Everything one rung paints. Pure, so it can be walked over every preset × mode. */
export function resolveSurfaceLevel(theme: Theme, level: SurfaceLevel): SurfaceLevelPaint {
  const background = levelBackground(theme, level);
  return {
    level,
    background,
    border: hairlineOn(theme, background),
    raised: surfaceFillOn(theme, background),
    ...surfaceTextOn(theme, background),
  };
}

const SurfaceLevelContext = createContext<SurfaceLevel>(0);

export interface SurfaceLevelProviderProps {
  /** The rung the children are sitting ON. A card on a page publishes `1`. */
  level: SurfaceLevel;
  children?: ReactNode;
}

/**
 * Publish the rung this subtree sits on.
 *
 * A container that paints a surface wraps its content in this; every descendant
 * then steps off the right parent. Without it a control assumes level 0, which
 * is what it assumed before this existed — so adopting it is additive.
 */
export function SurfaceLevelProvider({ level, children }: SurfaceLevelProviderProps) {
  return createElement(SurfaceLevelContext.Provider, { value: level }, children);
}

/** The ambient rung, as a number. `0` when nothing published one. */
export function useSurfaceLevelValue(): SurfaceLevel {
  return useContext(SurfaceLevelContext);
}

/**
 * The ambient rung's paint, optionally `delta` rungs above it.
 *
 * `useSurfaceLevel()` is "the surface I am on"; `useSurfaceLevel(1)` is "the
 * surface one level above the current one" — the question every one of those
 * thirty families was answering by hand.
 */
export function useSurfaceLevel(delta: number = 0): SurfaceLevelPaint {
  const theme = useTheme();
  const level = useSurfaceLevelValue();
  const next = Math.min(3, Math.max(0, level + delta)) as SurfaceLevel;
  return useMemo(() => resolveSurfaceLevel(theme, next), [theme, next]);
}

/** Just the ambient fill — for a control that only needs to know what is behind it. */
export function useSurfaceFill(): string {
  const theme = useTheme();
  const level = useSurfaceLevelValue();
  return useMemo(() => levelBackground(theme, level), [theme, level]);
}

/**
 * The inline style that gives a focus ring's GAP the colour of the surface
 * behind the control.
 *
 * `styles/interactive-web-css.ts` `RING_OFFSET_VAR` explains why the gap is a
 * variable at all: as the literal `#FFFFFF` it drew a 2px white halo around
 * every focused chip, stepper and slider thumb in dark mode. Spread it into the
 * control's own `style` alongside its accent ring variable.
 */
export function useRingOffsetStyle(): Record<string, string> {
  const surface = useSurfaceFill();
  return useMemo(() => ({ [RING_OFFSET_VAR]: surface }), [surface]);
}
