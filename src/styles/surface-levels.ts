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
 *
 * ## The rung is a derivation; `fill` is the fact
 *
 * A rung ANSWERS the question from the page down, and for a control that only
 * needs a legible step off its parent that is enough. It is not enough for the
 * other question a surface gets asked — "paint yourself the same colour as me"
 * — because a container may paint something the ladder would not have chosen.
 * `ContentPanel` is exactly that case: it paints `bg-card`, and in DARK mode
 * `theme.colors.card` is not rung 1 (which is a computed step off the page,
 * pinned within 1.03:1 of the menu surface). A sticky header that took the rung
 * would sit a visible shade off the column it is supposed to disappear into.
 *
 * So a container that knows exactly what it painted publishes it —
 * `<SurfaceLevelProvider level={1} fill={colors.card}>` — and `useSurfaceFill()`
 * returns that colour verbatim. Everything derived (the hairline, the raised
 * fill, the text rungs) is then computed off the REAL parent, which is what the
 * relative primitives always wanted and could not have while the parent was
 * inferred. A provider with no `fill` behaves exactly as it did.
 *
 * ## The same answer on web, for CSS that cannot call a hook
 *
 * {@link SURFACE_FILL_VAR} (`--bloom-surface`) carries the published fill down
 * the DOM, so a stylesheet, a `::after` seam or an arbitrary Tailwind value can
 * follow the surface without the consumer threading a colour through props.
 * It is set by the same containers, on the element they paint, with
 * {@link surfaceFillVars} — never at `:root`, which would resolve once for the
 * whole document and defeat both this and `BloomColorScope` (a subtree scoped
 * to another preset paints its own `--background`; a root-computed alias keeps
 * the app-wide one — `theme/color-scope/seed-scope.ts` has the mechanism).
 *
 * It is WEB-ONLY, and deliberately: propagating a custom property to a native
 * subtree means react-native-css's `VariableContextProvider`, i.e. the
 * `nativewind` OPTIONAL peer, and a panel's own surface must not depend on
 * whether a consumer installed it. Native's answer is the hook, which is also
 * the only form that is correct on both platforms — so cross-platform code
 * reads `useSurfaceFill()` and a web-only fork may read the variable.
 */
import { createContext, createElement, useContext, useMemo, type ReactNode } from 'react';
import { Platform, type ViewStyle } from 'react-native';

import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { mixColors, quietText } from './color-contrast';
import { RING_OFFSET_VAR } from './interactive-web-css';
import type { WebCssStyle } from './web-view-style';

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

/** Everything a surface paints, given the fill it actually has. */
function paintOn(theme: Theme, level: SurfaceLevel, background: string): SurfaceLevelPaint {
  return {
    level,
    background,
    border: hairlineOn(theme, background),
    raised: surfaceFillOn(theme, background),
    ...surfaceTextOn(theme, background),
  };
}

/** Everything one rung paints. Pure, so it can be walked over every preset × mode. */
export function resolveSurfaceLevel(theme: Theme, level: SurfaceLevel): SurfaceLevelPaint {
  return paintOn(theme, level, levelBackground(theme, level));
}

/**
 * The CSS custom property carrying the published surface fill to a web subtree.
 *
 * Named like `--bloom-ring-offset` (its opposite number: a CONTAINER publishes
 * this one, a CONTROL consumes that one, and they are the same colour) rather
 * than like a palette token — it is not one. `--surface` is already a token, and
 * this deliberately does not shadow it.
 */
export const SURFACE_FILL_VAR = '--bloom-surface';

/**
 * How to REFERENCE the published fill from CSS or an arbitrary Tailwind value:
 *
 * ```
 * background-color: var(--bloom-surface, var(--background));
 * className="bg-[var(--bloom-surface,var(--background))]"   // web-only
 * ```
 *
 * The fallback is what makes it safe: the variable exists only where a container
 * published one, so outside every surface — and in a `BloomColorScope` subtree
 * that owns no surface of its own — this resolves to the page. Both halves
 * substitute at the USING element, so a scoped subtree gets the scope's
 * `--background`, not the document root's.
 */
export const SURFACE_FILL_CSS = `var(${SURFACE_FILL_VAR}, var(--background))`;

/**
 * The style a surface OWNER puts on the element it paints, so web CSS below it
 * can read {@link SURFACE_FILL_CSS}. `undefined` on native, where the variable
 * has no propagation mechanism that does not go through an optional peer (see
 * the module comment) — the hook is native's answer, and the owner passes this
 * unconditionally either way.
 *
 * It belongs on the SAME element that carries the fill, so the two can never
 * disagree, and a container that publishes the context publishes this with it.
 *
 * `undefined` in, `undefined` out: a container that cannot name its own colour
 * (see `content-panel/shared.ts`) publishes no variable rather than a wrong one,
 * and the call site stays one unconditional expression.
 */
export function surfaceFillVars(fill: string | undefined): ViewStyle | undefined {
  if (fill === undefined || Platform.OS !== 'web') return undefined;
  // A custom property has no key on RN's `ViewStyle`, and on web it does not
  // need one: react-native-web compiles every own key of a style object into an
  // atomic rule, so `--bloom-surface` lands on the element and inherits from
  // there. `WebCssStyle` is the annotation for exactly that crossing (it is what
  // keeps this from being an `as ViewStyle`, which silences typos instead of
  // widening — `styles/web-view-style.ts`).
  const vars: WebCssStyle = { [SURFACE_FILL_VAR]: fill };
  return vars;
}

/** What a container publishes: the rung, and the fill if it knows it exactly. */
interface AmbientSurface {
  level: SurfaceLevel;
  /** The colour the container actually painted, or `null` to use the rung's. */
  fill: string | null;
}

const NO_AMBIENT_SURFACE: AmbientSurface = { level: 0, fill: null };

const SurfaceLevelContext = createContext<AmbientSurface>(NO_AMBIENT_SURFACE);

export interface SurfaceLevelProviderProps {
  /** The rung the children are sitting ON. A card on a page publishes `1`. */
  level: SurfaceLevel;
  /**
   * The colour this container actually painted, when it is not the rung's own
   * fill. `ContentPanel` paints `theme.colors.card`, which in dark mode is NOT
   * rung 1 — chrome that must vanish into the panel needs the fact, not the
   * derivation (module comment). Everything derived below is then computed off
   * this colour, so a hairline or a field inside still steps off the real
   * parent. Omit it and the rung answers, exactly as before.
   */
  fill?: string;
  children?: ReactNode;
}

/**
 * Publish the rung this subtree sits on.
 *
 * A container that paints a surface wraps its content in this; every descendant
 * then steps off the right parent. Without it a control assumes level 0, which
 * is what it assumed before this existed — so adopting it is additive.
 *
 * On web, publish {@link surfaceFillVars} on the painted element in the same
 * breath: the DOM inherits the variable independently of React context, so a
 * container that sets one and not the other leaves CSS below it reading the
 * ENCLOSING surface's colour — which is the wrong colour, silently.
 */
export function SurfaceLevelProvider({ level, fill, children }: SurfaceLevelProviderProps) {
  const value = useMemo<AmbientSurface>(() => ({ level, fill: fill ?? null }), [level, fill]);
  return createElement(SurfaceLevelContext.Provider, { value }, children);
}

/** The ambient rung, as a number. `0` when nothing published one. */
export function useSurfaceLevelValue(): SurfaceLevel {
  return useContext(SurfaceLevelContext).level;
}

/**
 * The ambient rung's paint, optionally `delta` rungs above it.
 *
 * `useSurfaceLevel()` is "the surface I am on"; `useSurfaceLevel(1)` is "the
 * surface one level above the current one" — the question every one of those
 * thirty families was answering by hand.
 *
 * When the container published an exact `fill`, every rung above it is STEPPED
 * off that colour instead of read from the ladder: one step above a real panel
 * is a step above what the panel actually painted, not a rung that assumed a
 * different parent.
 *
 * Two edges, both resolved by counting the steps the CLAMPED rung actually
 * costs rather than the delta that was asked for:
 *
 *  - a delta that runs off the top asks for the rung it landed on, not for more
 *    steps than the ladder has (`level 1 + 3` is rung 3, i.e. two steps);
 *  - a NEGATIVE delta is a question about what is BELOW the published surface,
 *    and an exact fill says nothing about that — the ladder is the only thing
 *    that can answer, so it does, instead of clamping to the fill and labelling
 *    it with a rung it is not.
 */
export function useSurfaceLevel(delta: number = 0): SurfaceLevelPaint {
  const theme = useTheme();
  const { level, fill } = useContext(SurfaceLevelContext);
  const next = Math.min(3, Math.max(0, level + delta)) as SurfaceLevel;
  const steps = next - level;
  return useMemo(() => {
    if (fill === null || steps < 0) return resolveSurfaceLevel(theme, next);
    let background = fill;
    for (let i = 0; i < steps; i += 1) background = surfaceFillOn(theme, background);
    return paintOn(theme, next, background);
  }, [theme, next, fill, steps]);
}

/**
 * Just the ambient fill — for a control that only needs to know what is behind
 * it, and for chrome that has to BE that colour (an opaque sticky header over a
 * scrolling column, a tab bar, a search field's backing).
 *
 * This is the one to reach for over `theme.colors.card`: `card` is a palette
 * token — the colour a CARD paints — and it is right only for as long as the
 * surface you happen to be inside is a card. This answers what the surface
 * around you actually painted, whatever that surface turns out to be, so the
 * app does not repeat a guess at every call site and does not have to be swept
 * when a container changes what it paints.
 */
export function useSurfaceFill(): string {
  const theme = useTheme();
  const { level, fill } = useContext(SurfaceLevelContext);
  return useMemo(() => fill ?? levelBackground(theme, level), [theme, level, fill]);
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
