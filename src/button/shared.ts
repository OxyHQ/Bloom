import { surfaceFillOn } from '../styles/surface-levels';
import { resolveSurfaceFill, resolveSurfaceTint } from '../surface/shared';
import { isValidElement, type ReactNode } from 'react';

import { resolveBloomColors } from '../appearance/colors';
import type { BloomAppearance, BloomTone } from '../appearance/types';

import { borderRadius } from '../styles/tokens';
import { parseRgba, withAlpha } from '../theme/color-utils';
import { TYPE_SCALE, type TypeScaleStyle, type TypeScaleVariant } from '../typography/scale';
import { oklchToSrgb, srgbToOklch, srgbToRgbString, type Oklch } from '../theme/color-space';
import type { Theme } from '../theme/types';
import type { ButtonIconComponent, ButtonLinkTone, ButtonUnderline } from './types';

/** Geometry shared by web and native: xs 24, sm 32, md 36, lg 44.
 * Icon actions are squares; native expands compact touch targets with hitSlop.
 */

/** Every size is a full pill. */
export const BUTTON_RADIUS = borderRadius.full;

export type ButtonResolvedSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonGeometry {
  height: number;
  paddingHorizontal: number;
  gap: number;
  iconSize: number;
  labelPaddingHorizontal: number;
  /** The `text-*` ramp step; the four fields below are read from it. */
  type: TypeScaleVariant;
  fontSize: number;
  lineHeight: number;
  /** Any ramp weight — `textVariant` can name a step outside the sizes' own. */
  fontWeight: TypeScaleStyle['fontWeight'];
  letterSpacing: number;
  /** Icon-only width grows with the border (content-derived), vs forced square. */
}

function typeFields(type: TypeScaleVariant) {
  const t = TYPE_SCALE[type];
  return {
    type,
    fontSize: t.fontSize,
    lineHeight: t.lineHeight,
    fontWeight: t.fontWeight,
    letterSpacing: t.letterSpacing,
  };
}

/**
 * The geometry a button paints from: the size's row, with the four TYPE fields
 * replaced when the caller named a `textVariant`. Height, padding, gap and icon
 * size stay the SIZE's — a ramp step is a label, not a geometry.
 */
export function resolveButtonGeometry(
  size: ButtonResolvedSize,
  textVariant?: TypeScaleVariant,
): ButtonGeometry {
  const base = BUTTON_GEOMETRY[size];
  return textVariant ? { ...base, ...typeFields(textVariant) } : base;
}

const CANONICAL_BUTTON_GEOMETRY: Record<ButtonResolvedSize, ButtonGeometry> = {
  xs: {
    height: 24,
    paddingHorizontal: 8,
    gap: 2,
    iconSize: 14,
    labelPaddingHorizontal: 2,
    ...typeFields('caption-1-semibold'),
  },
  sm: {
    height: 32,
    paddingHorizontal: 8,
    gap: 2,
    iconSize: 18,
    labelPaddingHorizontal: 2,
    ...typeFields('body-medium'),
  },
  md: {
    height: 36,
    paddingHorizontal: 8,
    gap: 2,
    iconSize: 20,
    labelPaddingHorizontal: 4,
    ...typeFields('body-medium'),
  },
  lg: {
    height: 44,
    paddingHorizontal: 12,
    gap: 2,
    iconSize: 20,
    labelPaddingHorizontal: 4,
    ...typeFields('headline-medium'),
  },
};
export const BUTTON_GEOMETRY = {
  ...CANONICAL_BUTTON_GEOMETRY,
  small: CANONICAL_BUTTON_GEOMETRY.sm,
  medium: CANONICAL_BUTTON_GEOMETRY.md,
  large: CANONICAL_BUTTON_GEOMETRY.lg,
};

/**
 * The `icon` variant. It keeps a fixed square (`size-9` / `size-8`, border
 * included) and a SMALLER glyph at `small` than `Button` does (16 vs 18).
 */
export const ICON_BUTTON_ICON_SIZE: Record<ButtonResolvedSize, number> = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 20,
};

/**
 * The `link` variant: no container, the label on the ramp step of its size,
 * icons 20 / 18 / 14, a 4px gap, underline (offset 3) on hover.
 */
export const LINK_BUTTON_GAP = 4;
export const LINK_BUTTON_UNDERLINE_OFFSET = 3;

/**
 * A round background/tertiary disc with a hand-drawn two-stroke X in its own
 * viewBox, so the stroke is a true pixel value at every size.
 */
export type CloseButtonSize = '2xs' | 'xs' | 'sm' | 'md' | 'lg';

export const CLOSE_BUTTON_GEOMETRY: Record<
  CloseButtonSize,
  { box: number; glyph: number; stroke: number; inset: number }
> = {
  '2xs': { box: 18, glyph: 9, stroke: 2, inset: 2 },
  xs: { box: 20, glyph: 10.8, stroke: 2, inset: 2 },
  sm: { box: 24, glyph: 12.6, stroke: 2, inset: 2 },
  md: { box: 32, glyph: 16.2, stroke: 2.5, inset: 2 },
  lg: { box: 44, glyph: 20, stroke: 2.5, inset: 2 },
};

/** The button's transition duration. */
export const BUTTON_TRANSITION_MS = 150;

/**
 * The sliding thumb of a segmented control — the sidebar theme toggle and the
 * sidebar's mode switcher — so the two move at one speed on one curve.
 */
export const SEGMENTED_THUMB_MS = 200;
/** Control points for `Easing.bezier(...)` — the constant itself stays out of
 * this module, which every family imports and which must not pull Reanimated in. */
export const SEGMENTED_THUMB_EASE_BEZIER = [0.25, 0.1, 0.25, 1] as const;

/** Tailwind v4 `shadow-xs`, and its dark-mode override. */
export const BUTTON_SHADOW = {
  light: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  dark: '0 1px 2px 0 rgb(0 0 0 / 0.18)',
} as const;

/** A two-stop, top-to-bottom gradient. */
export type ButtonGradient = readonly [top: string, bottom: string];

/** One interaction state of a button. */
export interface ButtonStatePaint {
  /** Solid fill, or the gradient's top colour when `gradient` is set. */
  background: string;
  surface?: boolean;
  gradient: ButtonGradient | null;
  border: string;
  foreground: string;
}

export interface ButtonPalette {
  rest: ButtonStatePaint;
  hover: ButtonStatePaint;
  active: ButtonStatePaint;
  disabled: ButtonStatePaint;
  /** Border width at every state — 1 for the bordered variants, 0 otherwise. */
  borderWidth: number;
  /** Whether the enabled states carry the xs drop shadow. */
  shadow: boolean;
  /** The keyboard focus ring colour (accent-500). */
  ring: string;
  /** Opacity of the whole control when disabled (`icon`: 0.6). */
  disabledOpacity?: number;
}

const TRANSPARENT = 'rgba(0, 0, 0, 0)';

// ---------------------------------------------------------------------------
//  Tonal ramps — Bloom's colours
//
//  Every state paints from a Tailwind ramp (`accent-50…950`,
//  `red-*`, `neutral-*`). Bloom's theme carries ONE colour per role, so each
//  ramp is rebuilt around it in OKLCH: the theme colour IS the 500 stop, and
//  every other stop takes Tailwind's own lightness and chroma for that step
//  (chroma as a ratio of the 500's, so a muted preset stays muted) at the theme
//  colour's hue. The stops a gradient pairs with 500 (400, 600, 700) keep
//  Tailwind's lightness OFFSET from 500 instead, so the gradient has the same
//  depth whatever lightness the preset's colour sits at.
// ---------------------------------------------------------------------------

export type RampStop = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;
export type Ramp = Record<RampStop, string>;
type Stop = RampStop;
export type RampTable = Record<Stop, readonly [l: number, c: number]>;

/** Tailwind v4 `blue-*` — the default accent. */
export const ACCENT_TABLE: RampTable = {
  50: [0.97, 0.014],
  100: [0.932, 0.032],
  200: [0.882, 0.059],
  300: [0.809, 0.105],
  400: [0.707, 0.165],
  500: [0.623, 0.214],
  600: [0.546, 0.245],
  700: [0.488, 0.243],
  800: [0.424, 0.199],
  900: [0.379, 0.146],
  950: [0.282, 0.091],
};

/** Tailwind v4 `red-*` — the danger colour. */
export const DANGER_TABLE: RampTable = {
  50: [0.971, 0.013],
  100: [0.936, 0.032],
  200: [0.885, 0.062],
  300: [0.808, 0.114],
  400: [0.704, 0.191],
  500: [0.637, 0.237],
  600: [0.577, 0.245],
  700: [0.505, 0.213],
  800: [0.444, 0.177],
  900: [0.396, 0.141],
  950: [0.258, 0.092],
};

/**
 * The `neutral-*` lightness ramp, with two overrides (100 `#f7f7f7`, 200
 * `#ebebeb`). Chroma is not Tailwind's zero: the neutrals take the tint of the
 * theme's own text colour, so they belong to the preset.
 */
const NEUTRAL_LIGHTNESS: Record<Stop, number> = {
  50: 0.985,
  100: 0.975,
  200: 0.943,
  300: 0.87,
  400: 0.708,
  500: 0.556,
  600: 0.439,
  700: 0.371,
  800: 0.269,
  900: 0.205,
  950: 0.145,
};

const RELATIVE_STOPS = new Set<Stop>([400, 600, 700]);
const STOPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

function toOklch(color: string): Oklch | null {
  const rgba = parseRgba(color);
  return rgba ? srgbToOklch(rgba) : null;
}

/** OKLCH → `rgb()`, reducing chroma until the colour fits sRGB (hue-stable). */
function toRgb({ l, c, h }: Oklch): string {
  let chroma = c;
  for (let i = 0; i < 24; i++) {
    const rgb = oklchToSrgb({ l, c: chroma, h });
    const back = srgbToOklch(rgb);
    if (Math.abs(back.l - l) < 0.01 && Math.abs(back.c - chroma) < 0.01) {
      return srgbToRgbString(rgb);
    }
    chroma *= 0.9;
  }
  return srgbToRgbString(oklchToSrgb({ l, c: chroma, h }));
}

/**
 * A Tailwind-shaped ramp around one theme colour (the 500 stop). Pass
 * {@link ACCENT_TABLE} for an accent/status hue, {@link DANGER_TABLE} for red.
 */
export function colorRamp(color: string, table: RampTable): Ramp {
  const base = toOklch(color);
  const ramp = {} as Ramp;
  const [baseL, baseC] = table[500];
  for (const stop of STOPS) {
    if (stop === 500 || !base) {
      ramp[stop] = color;
      continue;
    }
    const [l, c] = table[stop];
    const lightness = RELATIVE_STOPS.has(stop) ? base.l + (l - baseL) : l;
    ramp[stop] = toRgb({
      l: Math.min(0.99, Math.max(0.05, lightness)),
      c: base.c * (c / baseC),
      h: base.h,
    });
  }
  return ramp;
}

/** The `neutral-*` lightness ramp, tinted by a theme colour (normally `text`). */
export function neutralRamp(tintSource: string): Ramp {
  const tint = toOklch(tintSource);
  const c = Math.min(tint?.c ?? 0, 0.01);
  const h = tint?.h ?? 0;
  const ramp = {} as Ramp;
  for (const stop of STOPS) ramp[stop] = toRgb({ l: NEUTRAL_LIGHTNESS[stop], c, h });
  return ramp;
}

/**
 * The two ramps every control here paints from: the accent (around
 * `primary`) and the neutrals (tinted by `text`). Shared with `button-group`.
 */
export function resolveButtonRamps(theme: Theme): { accent: Ramp; neutral: Ramp } {
  return {
    accent: colorRamp(theme.colors.primary, ACCENT_TABLE),
    neutral: neutralRamp(theme.colors.text),
  };
}

/** Composite `top` at `alpha` over opaque `base` — CSS `color-mix(in srgb)`. */
export function mixColor(base: string, top: string, alpha: number): string {
  const b = parseRgba(base);
  const t = parseRgba(top);
  if (!b || !t) return base;
  const ch = (x: number, y: number) => Math.round(y * alpha + x * (1 - alpha));
  return `rgb(${ch(b.r, t.r)} ${ch(b.g, t.g)} ${ch(b.b, t.b)})`;
}

/** Shared semantic recipe. Color and fill are independent axes. */
/** Resolve the shared appearance/tone contract. */
export const resolveButtonPalette = resolveCanonicalButtonPalette;

/** Link actions retain their inline foreground and never add hover fill. */
export function resolveLinkButtonPalette(theme: Theme, tone: ButtonLinkTone): ButtonPalette {
  const palette = resolveCanonicalButtonPalette(
    'plain',
    theme,
    tone === 'primary' ? 'accent' : 'neutral',
  );
  const foreground =
    tone === 'primary'
      ? theme.colors.primary
      : tone === 'text'
        ? theme.colors.text
        : theme.colors.textSecondary;
  return {
    ...palette,
    rest: { ...palette.rest, foreground },
    hover: {
      ...palette.hover,
      foreground: tone === 'text' ? theme.colors.textSecondary : foreground,
      background: 'transparent',
    },
    active: {
      ...palette.active,
      foreground: tone === 'text' ? theme.colors.textSecondary : foreground,
      background: 'transparent',
    },
  };
}

/** Semantic pairs remain authoritative; translucent subtle fills are composited once. */
export function resolveCanonicalButtonPalette(
  appearance: BloomAppearance,
  theme: Theme,
  tone: BloomTone = 'accent',
  colors?: { background: string; foreground: string },
  neutralFill?: string,
  material: 'surface' | 'flat' = 'surface',
): ButtonPalette {
  const c = theme.colors;
  const pair = colors ?? resolveBloomColors(c, tone, appearance);
  if (material === 'flat' && appearance !== 'plain') {
    const semantic = resolveBloomColors(c, tone, appearance);
    const alpha = parseRgba(pair.background)?.a ?? 1;
    const state = (amount: number): ButtonStatePaint => ({
      background:
        amount === 0 || pair.background === 'transparent'
          ? pair.background
          : withAlpha(mixColor(pair.background, '#000000', amount), alpha),
      foreground: pair.foreground,
      border: appearance === 'outline' ? semantic.border : TRANSPARENT,
      gradient: null,
      surface: false,
    });
    return {
      rest: state(0),
      hover: state(0.04),
      active: state(0.08),
      disabled: {
        background: appearance === 'outline' ? TRANSPARENT : c.backgroundSecondary,
        foreground: c.textTertiary,
        border: appearance === 'outline' ? c.border : TRANSPARENT,
        gradient: null,
        surface: false,
      },
      disabledOpacity: 1,
      borderWidth: appearance === 'outline' ? 1 : 0,
      shadow: false,
      ring: tone === 'support' ? c.secondary : tone === 'action' ? c.tertiary : c.primary,
    };
  }
  const surface = appearance !== 'plain';
  const neutral = tone === 'neutral' && !colors;
  const tint =
    appearance === 'outline' && !colors
      ? resolveBloomColors(c, tone, 'subtle').background
      : pair.background;
  const fill = resolveSurfaceFill(tint, c.card);
  const neutralBase = neutralFill ?? c.card;
  const neutralHover = neutralFill ? surfaceFillOn(theme, neutralBase) : c.backgroundSecondary;
  const neutralActive = neutralFill ? surfaceFillOn(theme, neutralHover) : c.backgroundTertiary;
  const semanticAlpha = colors ? (parseRgba(tint)?.a ?? 1) : 1;
  const paint = (state: 0 | 1 | 2): ButtonStatePaint => ({
    background: !surface
      ? state
        ? resolveBloomColors(c, tone, 'subtle').background
        : 'transparent'
      : resolveSurfaceTint(
          neutral
            ? [neutralBase, neutralHover, neutralActive][state]!
            : state === 0
              ? colors
                ? tint
                : fill
              : withAlpha(
                  mixColor(fill, state === 1 ? '#ffffff' : '#000000', state === 1 ? 0.06 : 0.08),
                  semanticAlpha,
                ),
        ),
    foreground: neutral
      ? appearance === 'plain' && state === 0
        ? c.textSecondary
        : c.text
      : pair.foreground,
    border: TRANSPARENT,
    gradient: null,
    surface,
  });
  return {
    rest: paint(0),
    hover: paint(1),
    active: paint(2),
    disabled: {
      background: surface ? resolveSurfaceTint(neutralHover) : TRANSPARENT,
      foreground: c.textTertiary,
      border: TRANSPARENT,
      gradient: null,
      surface,
    },
    disabledOpacity: 1,
    borderWidth: appearance === 'outline' ? 1 : 0,
    shadow: surface,
    ring: tone === 'support' ? c.secondary : tone === 'action' ? c.tertiary : c.primary,
  };
}

/** `linear-gradient(180deg, top, bottom)`, or a flat one for a solid state. */
export function paintToCssImage(paint: ButtonStatePaint): string {
  const [top, bottom] = paint.gradient ?? [paint.background, paint.background];
  return `linear-gradient(180deg, ${top} 0%, ${bottom} 100%)`;
}

export interface CloseButtonPaint {
  background: string;
  foreground: string;
  foregroundHover: string;
  ring: string;
}

/** `background-tertiary` disc, `foreground-icon-secondary` X, `text-primary` on hover. */
export function resolveCloseButtonPaint(theme: Theme): CloseButtonPaint {
  return {
    background: theme.colors.backgroundTertiary,
    foreground: theme.colors.textSecondary,
    foregroundHover: theme.colors.text,
    ring: theme.colors.primary,
  };
}

/**
 * When a variant underlines its label, given the caller's `underline`.
 *
 * ONE function, read by both forks, because "the underline is the affordance"
 * and "the underline is the hover cue" are different controls and a fork that
 * decided for itself is how they drift. `link` keeps its hover underline,
 * everything else keeps none, unless the caller says otherwise.
 */
export function resolveButtonUnderline(
  isLink: boolean,
  underline: ButtonUnderline | undefined,
): ButtonUnderline {
  if (underline !== undefined) return underline;
  return isLink ? 'hover' : 'none';
}

// ---------------------------------------------------------------------------
//  GlyphButton
// ---------------------------------------------------------------------------

/**
 * The glyph's share of the box. Measured over the five family-local copies this
 * replaces, the ratio ran 0.50 (`queue-panel`, glyph = size / 2) to 0.75
 * (`music-library`'s 40-box compass at 30); 0.6 is the middle and is exactly
 * what `media-header`'s 40-box controls already drew. Every call site can still
 * pass `glyphSize` — this is the DEFAULT, not a rule.
 */
export const GLYPH_BUTTON_GLYPH_RATIO = 0.6;

/** Default diameter — the same 36 `Button size="medium"` stands at. */
export const GLYPH_BUTTON_SIZE = 36;

/** The glyph edge for a box, rounded to a whole pixel. */
export function glyphButtonGlyphSize(size: number): number {
  return Math.round(size * GLYPH_BUTTON_GLYPH_RATIO);
}

export interface GlyphButtonPaint {
  /** Foreground at rest — the muted reading colour. */
  color: string;
  /** Foreground under a pointer or a press. */
  hoverColor: string;
  /** Foreground while the toggle is on. */
  activeColor: string;
  /** Fill at rest: none. A glyph button is transparent by construction. */
  fill: string;
  /** Fill under a pointer or a press — the neutral wash, never an accent one. */
  hoverFill: string;
  ring: string;
}

/**
 * `GlyphButton`'s defaults: a NEUTRAL control. The wash is the neutral ramp's
 * 100 (dark 800), the same step `text`'s hover uses — deliberately not `ghost`'s
 * accent wash, which is what makes a ⋯ or a × land tinted.
 */
export function resolveGlyphButtonPaint(theme: Theme): GlyphButtonPaint {
  return {
    color: theme.colors.textSecondary,
    hoverColor: theme.colors.text,
    activeColor: theme.colors.primary,
    fill: TRANSPARENT,
    hoverFill: theme.colors.backgroundSecondary,
    ring: theme.colors.primary,
  };
}

/**
 * Whether an `icon` prop is a COMPONENT (`RiMore2Line`, a `memo`/`forwardRef`
 * object) rather than an element or text.
 */
export function isIconComponent(
  icon: ReactNode | ButtonIconComponent,
): icon is ButtonIconComponent {
  if (icon == null || isValidElement(icon)) return false;
  if (typeof icon === 'function') return true;
  return typeof icon === 'object' && '$$typeof' in (icon as object) && !Array.isArray(icon);
}
