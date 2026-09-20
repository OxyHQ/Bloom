import { Platform } from 'react-native';

import { mixColor, resolveButtonRamps } from '../button/shared';
import type { ImageResolver } from '../image-resolver/context';
import { isImageUrl } from '../image-resolver/is-image-url';
import { parseRgba } from '../theme/color-utils';
import type { Theme } from '../theme/types';
import type { MediaCardLayout, MediaCardPlayButton, MediaCardSize } from './types';
import {
  AA_TEXT_CONTRAST,
  contrastRatio,
  darken,
  darkenUntilContrast,
  relativeLuminance,
} from '../styles/color-contrast';

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
  return isImageUrl(source) ? source : (resolver?.(source, variant) ?? undefined);
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

// ---------------------------------------------------------------------------
//  Contrast
// ---------------------------------------------------------------------------

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

/** How much darker the gradient's bottom is than its top. */
const COVER_GRADIENT_FALLOFF = 0.25;

/**
 * The colours of a cover generated from an artwork colour.
 *
 * The fill is the artwork colour itself, pulled toward black only as far as it
 * takes for BOTH foregrounds — the title and the muted line under it — to clear
 * AA on it; the gradient's bottom is a further 25% darker, so the text keeps its
 * contrast all the way down. Without a colour — or with one that does not parse
 * — the cover darkens the theme's background until both artwork inks clear AA.
 *
 * Checking `textMuted` too is what the previous implementation did not do, and
 * it painted a muted line at 4.18:1 over the palest artwork colours.
 *
 * It DARKENS the colour rather than walking its generated ramp. A ramp
 * re-derives each stop's lightness and chroma from the hue, so a near-black
 * artwork colour used to come back as a mid-slate and a vivid one lost a
 * channel; scaling keeps the channels' ratio, so a darkened teal is still teal.
 */
export function resolveCoverTint(theme: Theme, color?: string): CoverTint {
  const text = '#ffffff';
  const textMuted = '#e5e5e5';
  const shade = color ? darkenUntilContrast(color, [text, textMuted], AA_TEXT_CONTRAST) : null;
  if (shade) {
    return {
      top: shade.color,
      bottom: darken(shade.color, COVER_GRADIENT_FALLOFF) as string,
      text,
      textMuted,
    };
  }
  const top = darkenUntilContrast(theme.colors.background, [text, textMuted], AA_TEXT_CONTRAST)!.color;
  return { top, bottom: darken(top, COVER_GRADIENT_FALLOFF) as string, text, textMuted };
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
  const { accent } = resolveButtonRamps(theme);
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
    rail: colors.contrast50,
    fill: accent[500],
    accent: accent[500],
    surface: colors.background,
    ring: accent[500],
  };
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

export { contrastRatio, relativeLuminance };
