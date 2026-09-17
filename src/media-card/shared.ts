import { Platform } from 'react-native';

import { ACCENT_TABLE, colorRamp, mixColor, resolveButtonRamps, type RampStop } from '../button/shared';
import type { ImageResolver } from '../image-resolver/context';
import { isUrl } from '../listing-card/shared';
import { parseRgba } from '../theme/color-utils';
import type { Theme } from '../theme/types';
import type { MediaCardLayout, MediaCardPlayButton, MediaCardSize } from './types';

export const IS_WEB = Platform.OS === 'web';

// ---------------------------------------------------------------------------
//  Geometry
// ---------------------------------------------------------------------------

/** Cover side of a tile. */
export const TILE_ARTWORK: Record<MediaCardSize, number> = { large: 200, medium: 160, small: 120 };
/** Cover side of a row. */
export const ROW_ARTWORK: Record<MediaCardSize, number> = { large: 56, medium: 56, small: 48 };

/** The hover / selected wash around a tile: padding and radius. */
export const TILE_PADDING = 12;
export const TILE_RADIUS = 16;
export const ROW_PADDING = 8;
export const ROW_RADIUS = 12;
/** Between a tile's cover and its title, and a row's cover and its text. */
export const TEXT_GAP = 12;

/** A square cover's radius: 8 in a tile, 6 at `small` and in a row. */
export function squareRadius(size: MediaCardSize, layout: MediaCardLayout): number {
  return layout === 'row' || size === 'small' ? 6 : 8;
}

/** A show's cover is rounder than an album's. */
export const PODCAST_RADIUS = 12;
export const GENRE_RADIUS = 8;
export const QUICK_TILE_HEIGHT = 56;
export const QUICK_TILE_RADIUS = 6;
/** The rotation of the cover peeking out of a genre tile. */
export const GENRE_ARTWORK_ROTATION = 25;
export const RECAP_RADIUS = 20;

export function artworkSide(size: MediaCardSize, layout: MediaCardLayout): number {
  return layout === 'row' ? ROW_ARTWORK[size] : TILE_ARTWORK[size];
}

// ---------------------------------------------------------------------------
//  Play button visibility
// ---------------------------------------------------------------------------

/**
 * `visible` drawn and shown; `hover` drawn but revealed by the card's hover or
 * focus (web CSS); `none` not drawn.
 */
export type PlayVisibility = 'visible' | 'hover' | 'none';

export function resolvePlayVisibility({
  mode = 'auto',
  hasOnPlay,
  playing = false,
  loading = false,
  current = false,
  web = IS_WEB,
}: {
  mode?: MediaCardPlayButton;
  hasOnPlay: boolean;
  playing?: boolean;
  loading?: boolean;
  current?: boolean;
  web?: boolean;
}): PlayVisibility {
  if (!hasOnPlay || mode === 'never') return 'none';
  if (mode === 'always' || playing || loading || current) return 'visible';
  return web ? 'hover' : 'none';
}

// ---------------------------------------------------------------------------
//  Images
// ---------------------------------------------------------------------------

/** A URL passes through; an id goes to the app's resolver (`undefined` without one). */
export function resolveArtworkUri(
  source: string | undefined,
  resolver: ImageResolver | null,
  variant?: string,
): string | undefined {
  if (!source) return undefined;
  return isUrl(source) ? source : (resolver?.(source, variant) ?? undefined);
}

// ---------------------------------------------------------------------------
//  Names
// ---------------------------------------------------------------------------

/** Joins the non-empty parts with ", " — the card's accessible name. */
export function composeName(parts: ReadonlyArray<string | false | null | undefined>): string {
  return parts.filter((part): part is string => typeof part === 'string' && part.trim() !== '').join(', ');
}

/** Joins the non-empty parts with " · " — a meta line. */
export function joinMeta(parts: ReadonlyArray<string | false | null | undefined>): string {
  return parts.filter((part): part is string => typeof part === 'string' && part.trim() !== '').join(' · ');
}

export function clampFraction(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

// ---------------------------------------------------------------------------
//  Contrast
// ---------------------------------------------------------------------------

function channel(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(color: string): number | null {
  const rgb = parseRgba(color);
  if (!rgb) return null;
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

/** WCAG contrast ratio of two opaque colours; 1 when either does not parse. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  if (la === null || lb === null) return 1;
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Text drawn over a generated cover must clear this. */
export const COVER_TEXT_CONTRAST = 4.5;

export interface CoverTint {
  /** Gradient top (also the solid fill). */
  top: string;
  /** Gradient bottom — darker, so the text keeps its contrast all the way down. */
  bottom: string;
  /** Text and glyphs over it. */
  text: string;
  /** Secondary text over it. */
  textMuted: string;
}

const TINT_STOPS: ReadonlyArray<RampStop> = [500, 600, 700, 800, 900];

/**
 * The colours of a cover generated from an artwork colour.
 *
 * The fill is the colour's own ramp, stepped darker (500 → 900) until light
 * text on it clears {@link COVER_TEXT_CONTRAST}; the gradient's bottom is two
 * stops further down. Without a colour — or with one that does not parse — the
 * cover is the theme's neutral 700 → 900, which clears it in both modes.
 */
export function resolveCoverTint(theme: Theme, color?: string): CoverTint {
  const { neutral: n } = resolveButtonRamps(theme);
  const text = n[50];
  const textMuted = mixColor(n[50], n[300], 0.35);
  if (color && parseRgba(color)) {
    const ramp = colorRamp(color, ACCENT_TABLE);
    const index = TINT_STOPS.findIndex((stop) => contrastRatio(ramp[stop], text) >= COVER_TEXT_CONTRAST);
    const at = index === -1 ? TINT_STOPS.length - 1 : index;
    const stop = TINT_STOPS[at] as RampStop;
    const bottom = TINT_STOPS[Math.min(at + 2, TINT_STOPS.length - 1)] as RampStop;
    // The ramp's 900 can still be light for a very pale input; fall back.
    if (contrastRatio(ramp[stop], text) >= COVER_TEXT_CONTRAST) {
      return { top: ramp[stop], bottom: ramp[bottom] === ramp[stop] ? ramp[950] : ramp[bottom], text, textMuted };
    }
  }
  return { top: n[700], bottom: n[900], text, textMuted };
}

// ---------------------------------------------------------------------------
//  Paint
// ---------------------------------------------------------------------------

export interface MediaCardPaint {
  text: string;
  textSecondary: string;
  /** Behind a card under the pointer. */
  hover: string;
  /** Behind a selected card. */
  selected: string;
  /** Behind a selected card under the pointer. */
  selectedHover: string;
  /** A cover that has not loaded, and a missing mosaic tile. */
  placeholder: string;
  /** The glyph on a neutral placeholder. */
  placeholderGlyph: string;
  /** The quick-access tile at rest and under the pointer. */
  tile: string;
  tileHover: string;
  /** The progress rail and its fill. */
  rail: string;
  fill: string;
  accent: string;
  /** The date block of an event and the dot ring of an avatar: the page colour. */
  surface: string;
  ring: string;
}

/**
 * Every colour the family paints outside generated covers.
 *
 *   hover        text over background at 6%    selected  at 10% (hovered 14%)
 *   placeholder  text at 8% (dark 10%)          glyph     text at 40%
 *   tile         text at 7% (dark 10%)          hover     at 12% (dark 16%)
 *   rail         neutral-200 (dark neutral-700) fill      the accent
 */
export function resolveMediaCardPaint(theme: Theme): MediaCardPaint {
  const { accent, neutral: n } = resolveButtonRamps(theme);
  const { colors, isDark } = theme;
  return {
    text: colors.text,
    textSecondary: colors.textSecondary,
    hover: mixColor(colors.background, colors.text, 0.06),
    selected: mixColor(colors.background, colors.text, 0.1),
    selectedHover: mixColor(colors.background, colors.text, 0.14),
    placeholder: mixColor(colors.background, colors.text, isDark ? 0.1 : 0.08),
    placeholderGlyph: mixColor(colors.background, colors.text, 0.4),
    tile: mixColor(colors.background, colors.text, isDark ? 0.1 : 0.07),
    tileHover: mixColor(colors.background, colors.text, isDark ? 0.16 : 0.12),
    rail: isDark ? n[700] : n[200],
    fill: accent[500],
    accent: accent[500],
    surface: colors.background,
    ring: accent[500],
  };
}

export function webData(data: Record<string, string>): Record<string, unknown> {
  return IS_WEB ? { dataSet: data } : {};
}

// ---------------------------------------------------------------------------
//  Web CSS — hover washes, the hover reveal and focus rings have no inline
//  spelling, so they hang off `dataSet` attributes in one adopted sheet.
// ---------------------------------------------------------------------------

export const MEDIA_CARD_STYLE_ID = 'bloom-media-card-web-css';

const CARD = '[data-bloom-media-card]';
const LINK = '[data-bloom-media-card-link]';
const REVEAL = '[data-bloom-media-card-reveal="hover"]';

export const MEDIA_CARD_CSS = `
${CARD} {
  transition: background-color 150ms ease-out;
}
${LINK} {
  outline: none;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}
${LINK}:focus-visible {
  outline: 2px solid var(--bloom-media-card-ring, currentColor);
  outline-offset: 2px;
}
${CARD}[data-bloom-media-card-hover]:hover {
  background-color: var(--bloom-media-card-hover) !important;
}
${REVEAL} {
  opacity: 0;
  transform: translateY(8px);
  pointer-events: none;
  transition: opacity 180ms ease-out, transform 180ms ease-out;
}
${CARD}:hover ${REVEAL},
${CARD}:focus-within ${REVEAL},
${CARD}[data-bloom-media-card-menu-open] ${REVEAL} {
  opacity: 1;
  transform: none;
  pointer-events: auto;
}
[data-bloom-media-card-conceal] {
  transition: opacity 180ms ease-out;
}
${CARD}:hover [data-bloom-media-card-conceal],
${CARD}:focus-within [data-bloom-media-card-conceal] {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  ${CARD}, ${REVEAL} {
    transition: none;
  }
  ${REVEAL} {
    transform: none;
  }
}
`;
