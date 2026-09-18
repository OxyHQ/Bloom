import { isValidElement, type ReactNode } from 'react';

import { borderRadius } from '../styles/tokens';
import { parseRgba, withAlpha } from '../theme/color-utils';
import { TYPE_SCALE, type TypeScaleStyle, type TypeScaleVariant } from '../typography/scale';
import { oklchToSrgb, srgbToOklch, srgbToRgbString, type Oklch } from '../theme/color-space';
import type { Theme } from '../theme/types';
import type {
  ButtonIconComponent,
  ButtonLinkTone,
  ButtonSize,
  ButtonUnderline,
  ButtonVariant,
} from './types';

/**
 * The geometry and palette both `Button` forks paint from. One table, read by
 * `Button.tsx` and `Button.web.tsx`, so the two forks cannot drift apart.
 *
 *                 xs                  small          medium         large
 *   height        24                  32             36             44
 *   padding-x     8                   8              8              12
 *   gap           2                   2              2              2
 *   icon          14                  18             20             20
 *   label px      2                   2              4              4
 *   text          caption-1-semibold  body-medium    body-medium    headline-medium
 *   icon-only     24×24               32×32          36 × (36+border) 44×44
 *
 * Medium icon-only is NOT forced square: its width comes from the
 * content (8 + 20 + 8) plus the border, so a bordered (secondary) medium
 * icon-only button is 38 × 36. Small and xs force `size-8` / `size-6`.
 *
 * `large` extends the ramp to the 44pt touch floor so existing
 * `size="large"` call sites keep their height.
 *
 * Every size is a full pill ({@link BUTTON_RADIUS}), so an icon-only button
 * is a circle.
 *
 * Height is FIXED, not a floor: the label's line box is centred inside it, so
 * the 1px border of `secondary` cannot grow the box the way padding did.
 */

/** Every size is a full pill. */
export const BUTTON_RADIUS = borderRadius.full;

export type ButtonResolvedSize = 'xs' | 'small' | 'medium' | 'large';

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
  iconOnlyGrowsWithBorder: boolean;
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

export const BUTTON_GEOMETRY: Record<ButtonResolvedSize, ButtonGeometry> = {
  xs: {
    height: 24,
    paddingHorizontal: 8,
    gap: 2,
    iconSize: 14,
    labelPaddingHorizontal: 2,
    ...typeFields('caption-1-semibold'),
    iconOnlyGrowsWithBorder: false,
  },
  small: {
    height: 32,
    paddingHorizontal: 8,
    gap: 2,
    iconSize: 18,
    labelPaddingHorizontal: 2,
    ...typeFields('body-medium'),
    iconOnlyGrowsWithBorder: false,
  },
  medium: {
    height: 36,
    paddingHorizontal: 8,
    gap: 2,
    iconSize: 20,
    labelPaddingHorizontal: 4,
    ...typeFields('body-medium'),
    iconOnlyGrowsWithBorder: true,
  },
  large: {
    height: 44,
    paddingHorizontal: 12,
    gap: 2,
    iconSize: 20,
    labelPaddingHorizontal: 4,
    ...typeFields('headline-medium'),
    iconOnlyGrowsWithBorder: false,
  },
};

/**
 * The `icon` variant. It keeps a fixed square (`size-9` / `size-8`, border
 * included) and a SMALLER glyph at `small` than `Button` does (16 vs 18).
 */
export const ICON_BUTTON_ICON_SIZE: Record<ButtonResolvedSize, number> = {
  xs: 14,
  small: 16,
  medium: 20,
  large: 20,
};

/**
 * The `link` variant: no container, the label on the ramp step of its size,
 * icons 20 / 18 / 14, a 4px gap, underline (offset 3) on hover.
 */
export const LINK_BUTTON_GAP = 4;
export const LINK_BUTTON_UNDERLINE_OFFSET = 3;

/** Width of an icon-only button at a size, given the variant's border width. */
export function iconOnlyWidth(geometry: ButtonGeometry, borderWidth: number): number {
  return geometry.iconOnlyGrowsWithBorder ? geometry.height + 2 * borderWidth : geometry.height;
}

/**
 * A round background/tertiary disc with a hand-drawn two-stroke X in its own
 * viewBox, so the stroke is a true pixel value at every size.
 */
export type CloseButtonSize = '2xs' | 'xs' | 'sm' | 'md';

export const CLOSE_BUTTON_GEOMETRY: Record<
  CloseButtonSize,
  { box: number; glyph: number; stroke: number; inset: number }
> = {
  '2xs': { box: 16, glyph: 6.8, stroke: 1.6, inset: 0.57 },
  xs: { box: 20, glyph: 10.8, stroke: 2, inset: 2 },
  sm: { box: 24, glyph: 12.6, stroke: 2, inset: 2 },
  md: { box: 32, glyph: 16.2, stroke: 2.5, inset: 2 },
};

export const BUTTON_SIZE_ALIAS: Record<ButtonSize, ButtonResolvedSize> = {
  xs: 'xs',
  small: 'small',
  medium: 'medium',
  large: 'large',
  sm: 'small',
  md: 'medium',
  lg: 'large',
  icon: 'medium',
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

function gradientState(
  top: string,
  bottom: string,
  foreground: string,
): ButtonStatePaint {
  return { background: top, gradient: [top, bottom], border: TRANSPARENT, foreground };
}

function solidState(background: string, border: string, foreground: string): ButtonStatePaint {
  return { background, gradient: null, border, foreground };
}

/** `bg-button-primary` / `bg-button-danger`, with their disabled gradients. */
function filledPalette(
  ramp: Ramp,
  onFill: string,
  disabled: { top: string; bottom: string; foreground: string },
): ButtonPalette {
  return {
    rest: gradientState(ramp[500], ramp[600], onFill),
    hover: gradientState(ramp[400], ramp[500], onFill),
    active: gradientState(ramp[600], ramp[700], onFill),
    disabled: gradientState(disabled.top, disabled.bottom, disabled.foreground),
    borderWidth: 0,
    shadow: true,
    ring: ramp[500],
  };
}

/**
 * Resolve every state's paint for a variant.
 *
 * Pure — takes the theme rather than calling `useTheme()`, so it can be walked
 * over every preset × mode without rendering.
 *
 * Bloom's variants:
 *   primary              → primary (accent gradient)
 *   destructive          → danger (negative gradient)
 *   secondary | outline  → secondary (bordered surface)
 *   icon                 → secondary surface, dimmed when disabled
 *   ghost                → ghost (tinted accent)
 *   inverse              → white surface, black label (over media)
 *   link                 → label only; `linkTone` primary | secondary
 *   text                 → borderless accent label with a hover wash
 */
export function resolveButtonPalette(
  variant: ButtonVariant,
  theme: Theme,
  linkTone: ButtonLinkTone = 'primary',
): ButtonPalette {
  const c = theme.colors;
  const dark = theme.isDark;
  const { accent, neutral: n } = resolveButtonRamps(theme);

  switch (variant) {
    case 'primary':
      return filledPalette(
        accent,
        c.primaryForeground,
        dark
          ? { top: n[700], bottom: n[800], foreground: n[500] }
          : { top: n[200], bottom: n[300], foreground: n[400] },
      );
    case 'destructive': {
      const red = colorRamp(c.negative, DANGER_TABLE);
      return filledPalette(
        red,
        c.negativeForeground,
        dark
          ? { top: red[900], bottom: red[950], foreground: red[400] }
          : { top: red[100], bottom: red[200], foreground: red[300] },
      );
    }
    case 'icon': {
      // The secondary surface, `foreground-icon-primary` glyph, and a
      // disabled state that dims the whole control to 0.6 over
      // `icon-button-disabled-foreground` (neutral-300 / dark neutral-500).
      const secondary = resolveButtonPalette('secondary', theme);
      return {
        ...secondary,
        disabled: { ...secondary.disabled, foreground: dark ? n[500] : n[300] },
        disabledOpacity: 0.6,
      };
    }
    case 'secondary':
    case 'outline':
      return dark
        ? {
            rest: solidState(n[800], n[700], c.text),
            // `color-mix(neutral-700 60%, transparent)` — translucent.
            hover: solidState(withAlpha(n[700], 0.6), n[500], c.text),
            active: solidState(n[800], n[600], c.text),
            disabled: solidState(n[800], n[700], n[600]),
            borderWidth: 1,
            shadow: true,
            ring: accent[500],
          }
        : {
            rest: solidState(c.card, n[200], c.text),
            hover: solidState(n[100], n[300], c.text),
            active: solidState(n[200], n[400], c.text),
            disabled: solidState(n[100], n[200], n[400]),
            borderWidth: 1,
            shadow: true,
            ring: accent[500],
          };
    case 'ghost':
      return dark
        ? {
            rest: solidState(accent[900], TRANSPARENT, accent[300]),
            hover: solidState(accent[800], TRANSPARENT, accent[300]),
            active: solidState(accent[700], TRANSPARENT, accent[300]),
            disabled: solidState(n[800], TRANSPARENT, n[600]),
            borderWidth: 0,
            shadow: false,
            ring: accent[500],
          }
        : {
            rest: solidState(accent[100], TRANSPARENT, accent[700]),
            hover: solidState(accent[200], TRANSPARENT, accent[700]),
            active: solidState(accent[300], TRANSPARENT, accent[700]),
            disabled: solidState(accent[50], TRANSPARENT, accent[300]),
            borderWidth: 0,
            shadow: false,
            ring: accent[500],
          };
    case 'inverse':
      return {
        rest: solidState('#FFFFFF', TRANSPARENT, '#000000'),
        hover: solidState('rgb(247 247 247)', TRANSPARENT, '#000000'),
        active: solidState('rgb(235 235 235)', TRANSPARENT, '#000000'),
        disabled: solidState('rgb(247 247 247)', TRANSPARENT, 'rgb(161 161 161)'),
        borderWidth: 0,
        shadow: true,
        ring: accent[500],
      };
    case 'link':
      // No surface in any state — the underline is the hover cue and only
      // the press darkens the label.
      if (linkTone === 'text') {
        // The READING colour. The one tone whose hover changes the FOREGROUND,
        // which is why both forks paint `palette.hover.foreground` rather than
        // assuming it equals the rest colour.
        return {
          rest: solidState(TRANSPARENT, TRANSPARENT, c.text),
          hover: solidState(TRANSPARENT, TRANSPARENT, c.textSecondary),
          active: solidState(TRANSPARENT, TRANSPARENT, c.textSecondary),
          disabled: solidState(TRANSPARENT, TRANSPARENT, c.textTertiary),
          borderWidth: 0,
          shadow: false,
          ring: accent[500],
        };
      }
      return linkTone === 'secondary'
        ? {
            rest: solidState(TRANSPARENT, TRANSPARENT, n[500]),
            hover: solidState(TRANSPARENT, TRANSPARENT, n[500]),
            active: solidState(TRANSPARENT, TRANSPARENT, c.text),
            disabled: solidState(TRANSPARENT, TRANSPARENT, dark ? n[600] : n[400]),
            borderWidth: 0,
            shadow: false,
            ring: accent[500],
          }
        : {
            rest: solidState(TRANSPARENT, TRANSPARENT, accent[600]),
            hover: solidState(TRANSPARENT, TRANSPARENT, accent[600]),
            active: solidState(TRANSPARENT, TRANSPARENT, accent[800]),
            disabled: solidState(TRANSPARENT, TRANSPARENT, dark ? n[600] : n[400]),
            borderWidth: 0,
            shadow: false,
            ring: accent[500],
          };
    case 'text':
    default:
      return {
        rest: solidState(TRANSPARENT, TRANSPARENT, accent[500]),
        hover: solidState(dark ? n[800] : n[100], TRANSPARENT, accent[500]),
        active: solidState(dark ? n[700] : n[200], TRANSPARENT, accent[500]),
        disabled: solidState(TRANSPARENT, TRANSPARENT, dark ? n[600] : n[400]),
        borderWidth: 0,
        shadow: false,
        ring: accent[500],
      };
  }
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
  const { accent, neutral: n } = resolveButtonRamps(theme);
  return {
    background: theme.isDark ? n[800] : n[200],
    foreground: n[500],
    foregroundHover: theme.colors.text,
    ring: accent[500],
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
  const { accent, neutral: n } = resolveButtonRamps(theme);
  return {
    color: theme.colors.textSecondary,
    hoverColor: theme.colors.text,
    activeColor: accent[500],
    fill: TRANSPARENT,
    hoverFill: theme.isDark ? n[800] : n[100],
    ring: accent[500],
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
