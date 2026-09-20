import { isValidElement, type ReactNode } from 'react';

import { resolveBloomColors } from '../appearance/colors';
import type { BloomAppearance, BloomTone } from '../appearance/types';

import { borderRadius } from '../styles/tokens';
import { parseRgba, withAlpha } from '../theme/color-utils';
import { TYPE_SCALE, type TypeScaleStyle, type TypeScaleVariant } from '../typography/scale';
import { oklchToSrgb, srgbToOklch, srgbToRgbString, type Oklch } from '../theme/color-space';
import type { Theme } from '../theme/types';
import type { ButtonIconComponent, ButtonSize, ButtonVariant, ButtonLinkTone, ButtonUnderline } from './types';

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
export const BUTTON_GEOMETRY = { ...CANONICAL_BUTTON_GEOMETRY, small: CANONICAL_BUTTON_GEOMETRY.sm, medium: CANONICAL_BUTTON_GEOMETRY.md, large: CANONICAL_BUTTON_GEOMETRY.lg };


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
  50: [0.97, 0.014], 100: [0.932, 0.032], 200: [0.882, 0.059], 300: [0.809, 0.105],
  400: [0.707, 0.165], 500: [0.623, 0.214], 600: [0.546, 0.245], 700: [0.488, 0.243],
  800: [0.424, 0.199], 900: [0.379, 0.146], 950: [0.282, 0.091],
};

/** Tailwind v4 `red-*` — the danger colour. */
export const DANGER_TABLE: RampTable = {
  50: [0.971, 0.013], 100: [0.936, 0.032], 200: [0.885, 0.062], 300: [0.808, 0.114],
  400: [0.704, 0.191], 500: [0.637, 0.237], 600: [0.577, 0.245], 700: [0.505, 0.213],
  800: [0.444, 0.177], 900: [0.396, 0.141], 950: [0.258, 0.092],
};

/**
 * The `neutral-*` lightness ramp, with two overrides (100 `#f7f7f7`, 200
 * `#ebebeb`). Chroma is not Tailwind's zero: the neutrals take the tint of the
 * theme's own text colour, so they belong to the preset.
 */
const NEUTRAL_LIGHTNESS: Record<Stop, number> = {
  50: 0.985, 100: 0.975, 200: 0.943, 300: 0.87, 400: 0.708, 500: 0.556,
  600: 0.439, 700: 0.371, 800: 0.269, 900: 0.205, 950: 0.145,
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

/** Original Bloom filled surface: the gradient is material, independent of the API names. */
function gradientPaint(top: string, bottom: string, foreground: string): ButtonStatePaint {
  return { background: top, gradient: [top, bottom], border: TRANSPARENT, foreground };
}

/** Shared semantic recipe. Color and fill are independent axes. */
export const BUTTON_SIZE_ALIAS: Record<ButtonSize, ButtonResolvedSize> = { xs: 'xs', sm: 'sm', md: 'md', lg: 'lg', small: 'sm', medium: 'md', large: 'lg', icon: 'md' };

export function resolveButtonRecipe(variant: ButtonVariant | undefined): { appearance: BloomAppearance; tone: BloomTone } {
  switch (variant) {
    case 'secondary': case 'outline': case 'icon': return { appearance: 'outline', tone: 'neutral' };
    case 'ghost': return { appearance: 'subtle', tone: 'accent' };
    case 'text': case 'link': return { appearance: 'plain', tone: 'accent' };
    case 'destructive': return { appearance: 'solid', tone: 'danger' };
    case 'inverse': return { appearance: 'solid', tone: 'neutral' };
    default: return { appearance: 'solid', tone: 'accent' };
  }
}

/** Legacy variants remain accepted; new appearance/tone are the shared contract. */
export function resolveButtonPalette(appearance: BloomAppearance | ButtonVariant, theme: Theme, tone: BloomTone | ButtonLinkTone = 'accent'): ButtonPalette {
  const legacy = !['solid', 'subtle', 'outline', 'plain'].includes(appearance);
  const recipe = resolveButtonRecipe(legacy ? appearance as ButtonVariant : undefined);
  const resolvedTone: BloomTone = tone === 'primary' ? 'accent' : tone === 'secondary' || tone === 'text' ? 'neutral' : tone;
  const palette = resolveCanonicalButtonPalette(legacy ? recipe.appearance : appearance as BloomAppearance, theme, legacy && tone === 'accent' ? recipe.tone : resolvedTone);
  if (appearance === 'link' && tone === 'text') return { ...palette,
    rest: { ...palette.rest, foreground: theme.colors.text },
    hover: { ...palette.hover, foreground: theme.colors.textSecondary, background: 'transparent' },
    active: { ...palette.active, foreground: theme.colors.textSecondary, background: 'transparent' },
  };
  if (appearance === 'link') return { ...palette, hover: { ...palette.hover, foreground: palette.rest.foreground, background: 'transparent' }, active: { ...palette.active, foreground: palette.rest.foreground, background: 'transparent' } };
  if (appearance === 'inverse') return { ...palette,
    rest: { ...palette.rest, gradient: null, background: theme.colors.text, foreground: theme.colors.background },
    hover: { ...palette.hover, gradient: null, background: theme.colors.textSecondary, foreground: theme.colors.background },
    active: { ...palette.active, gradient: null, background: theme.colors.text, foreground: theme.colors.background },
  };
  return palette;
}

export function resolveCanonicalButtonPalette(
  appearance: BloomAppearance,
  theme: Theme,
  tone: BloomTone = 'accent',
): ButtonPalette {
  const c = theme.colors;
  const neutralDisabled = appearance === 'solid'
    ? gradientPaint(c.backgroundSecondary, c.backgroundTertiary, c.textTertiary)
    : { background: appearance === 'subtle' ? c.backgroundTertiary : TRANSPARENT,
        gradient: null, border: appearance === 'outline' ? c.border : TRANSPARENT,
        foreground: c.textTertiary };
  if (tone === 'neutral') {
    // Adjacent semantic surfaces retain the gentle material gradient while
    // following the palette's actual neutral hue, rather than a rebuilt ramp.
    const rest = appearance === 'solid'
      ? gradientPaint(c.backgroundSecondary, c.backgroundTertiary, c.text)
      : { background: appearance === 'subtle' ? c.backgroundTertiary : TRANSPARENT,
          gradient: null, border: appearance === 'outline' ? c.border : TRANSPARENT,
          foreground: appearance === 'plain' ? c.textSecondary : c.text };
    const hover = appearance === 'solid'
      ? gradientPaint(c.card, c.backgroundSecondary, c.text)
      : { ...rest, background: c.backgroundSecondary, foreground: c.text };
    const active = appearance === 'solid'
      ? gradientPaint(c.backgroundTertiary, c.backgroundSecondary, c.text)
      : { ...hover, background: c.backgroundTertiary };
    return { rest, hover, active, disabled: neutralDisabled, disabledOpacity: 0.5,
      borderWidth: appearance === 'outline' ? 1 : 0, shadow: appearance === 'solid', ring: c.primary };
  }
  // Support/action are authored semantic pairs. Keep their exact fill rather
  // than rebuilding a primary-style ramp and invalidating the paired on-color.
  // Existing tones retain their established gradient material.
  if (appearance === 'solid' && tone !== 'support' && tone !== 'action') {
    const { accent } = resolveButtonRamps(theme);
    const semantic = resolveBloomColors(theme.colors, tone, 'solid');
    const ramp = tone === 'accent' ? accent : tone === 'danger'
      ? colorRamp(theme.colors.negative, DANGER_TABLE)
      : colorRamp(semantic.background, ACCENT_TABLE);
    const foreground = tone === 'danger' ? theme.colors.negativeForeground : semantic.foreground;
    const disabled = tone === 'danger'
      ? theme.isDark
        ? gradientPaint(ramp[900], ramp[950], ramp[400])
        : gradientPaint(ramp[100], ramp[200], ramp[300])
      : neutralDisabled;
    return {
      rest: gradientPaint(ramp[500], ramp[600], foreground),
      hover: gradientPaint(ramp[400], ramp[500], foreground),
      active: gradientPaint(ramp[600], ramp[700], foreground),
      disabled,
      borderWidth: 0,
      shadow: true,
      ring: ramp[500],
    };
  }
  const rest = { ...resolveBloomColors(theme.colors, tone, appearance), gradient: null };
  const subtle = resolveBloomColors(theme.colors, tone, 'subtle');
  const hover = appearance === 'plain' || appearance === 'outline'
    ? { ...rest, background: subtle.background }
    : rest;
  return {
    rest, hover, active: hover,
    disabled: neutralDisabled,
    disabledOpacity: 0.5,
    borderWidth: appearance === 'outline' ? 1 : 0,
    shadow: appearance === 'solid',
    ring: tone === 'support' ? theme.colors.secondary : tone === 'action' ? theme.colors.tertiary : theme.colors.primary,
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
  variant: ButtonVariant,
  underline: ButtonUnderline | undefined,
): ButtonUnderline {
  if (underline !== undefined) return underline;
  return variant === 'link' ? 'hover' : 'none';
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
