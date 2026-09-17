import { Platform } from 'react-native';

import { colorRamp, DANGER_TABLE, mixColor, resolveButtonRamps } from '../button/shared';
import { resolveMenuPalette } from '../floating/menu-palette';
import type { ImageResolver } from '../image-resolver/context';
import type { Theme } from '../theme/types';

export const IS_WEB = Platform.OS === 'web';

/** The photo tile's corner radius (a card image). */
export const PHOTO_RADIUS = 16;
/** Width : height of the photo in the vertical layout. */
export const PHOTO_ASPECT_RATIO = 20 / 19;
/** Share of the card the photo takes in the horizontal layout. */
export const HORIZONTAL_PHOTO_WIDTH = '40%';
/** The most dots the pager draws; longer runs slide a window. */
export const MAX_DOTS = 5;
export const DOT_SIZE = 6;
/** A dot at a window edge that has more photos beyond it. */
export const DOT_EDGE_SIZE = 4;

export interface ListingCardPaint {
  /** The placeholder behind a photo that has not loaded, and the mosaic gaps' tiles. */
  photoPlaceholder: string;
  /** The heart's outline, the dots — the white drawn over imagery. */
  onMedia: string;
  /** The heart's translucent body at rest (painted at {@link HEART_SCRIM_OPACITY}). */
  scrim: string;
  /** The heart when saved. */
  favorite: string;
  /** The badge pill and the arrow buttons: the floating surface. */
  surface: string;
  surfaceText: string;
  surfaceShadow: string;
  text: string;
  textSecondary: string;
  ring: string;
}

/** The heart's dark body over imagery is this opaque. */
export const HEART_SCRIM_OPACITY = 0.5;
/** An inactive dot is this opaque; the active one is solid. */
export const DOT_INACTIVE_OPACITY = 0.6;

/**
 * Every colour the listing card family paints. Pure.
 *
 *   photo placeholder   neutral-100            (dark neutral-800 → 700 at 60%)
 *   on media            neutral-50             both modes — drawn over a photo
 *   scrim               neutral-950 at 50%     both modes
 *   favourite           red-500 (`error`)      both modes — over a photo
 *   surface             the menu surface       card / neutral-800
 *   text                text / text-secondary
 */
export function resolveListingCardPaint(theme: Theme): ListingCardPaint {
  const { accent, neutral: n } = resolveButtonRamps(theme);
  // `error`, not `negative`: dark mode's `negative` is a pale tint made for text
  // on a dark page, and reads pink over a photo; `error` stays a saturated red.
  const red = colorRamp(theme.colors.error, DANGER_TABLE);
  const menu = resolveMenuPalette(theme);
  return {
    photoPlaceholder: theme.isDark ? mixColor(n[800], n[700], 0.6) : n[100],
    onMedia: n[50],
    scrim: n[950],
    favorite: red[500],
    surface: menu.surface,
    surfaceText: menu.text,
    surfaceShadow: menu.shadow,
    text: theme.colors.text,
    textSecondary: theme.colors.textSecondary,
    ring: accent[500],
  };
}

export function isUrl(value: string): boolean {
  return (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('data:') ||
    value.startsWith('blob:') ||
    value.startsWith('file:') ||
    value.startsWith('/')
  );
}

/** A URL passes through; an id goes to the app's resolver (`undefined` without one). */
export function resolvePhoto(
  photo: string,
  resolver: ImageResolver | null,
  variant?: string,
): string | undefined {
  if (!photo) return undefined;
  return isUrl(photo) ? photo : resolver?.(photo, variant);
}

/** The responsive column count of a results grid of the given width. */
export function listingGridColumns(width: number): number {
  if (width < 640) return 1;
  if (width < 950) return 2;
  if (width < 1280) return 3;
  return 4;
}

export interface DotSlot {
  /** The photo this dot stands for. */
  index: number;
  size: number;
  active: boolean;
}

/**
 * The dots to draw for `count` photos with `active` in view: all of them up to
 * {@link MAX_DOTS}, otherwise a window of five that follows the active photo,
 * whose edge dots shrink while more photos lie beyond them.
 */
export function dotWindow(count: number, active: number): DotSlot[] {
  if (count <= 1) return [];
  const visible = Math.min(count, MAX_DOTS);
  const start = Math.min(Math.max(0, active - Math.floor(visible / 2)), count - visible);
  const end = start + visible - 1;
  const slots: DotSlot[] = [];
  for (let index = start; index <= end; index++) {
    const moreBefore = index === start && start > 0;
    const moreAfter = index === end && end < count - 1;
    slots.push({
      index,
      size: moreBefore || moreAfter ? DOT_EDGE_SIZE : DOT_SIZE,
      active: index === active,
    });
  }
  return slots;
}

export function webData(data: Record<string, string>): Record<string, unknown> {
  return IS_WEB ? { dataSet: data } : {};
}

// ---------------------------------------------------------------------------
//  Web CSS — hover-only arrows, the snapping track and focus rings have no
//  inline-style spelling, so they hang off `dataSet` attributes in an adopted
//  sheet. `adoptStyleSheet` no-ops without a document.
// ---------------------------------------------------------------------------

export const LISTING_CARD_STYLE_ID = 'bloom-listing-card-web-css';

const CARD = '[data-bloom-listing-card]';
const LINK = '[data-bloom-listing-card-link]';
const TRACK = '[data-bloom-listing-card-track]';
const ARROW = '[data-bloom-listing-card-arrow]';
const DOT = '[data-bloom-listing-card-dot]';
const FAVORITE = '[data-bloom-favorite-button]';
const WISHLIST = '[data-bloom-wishlist-card]';

export const LISTING_CARD_CSS = `
${LINK}, ${WISHLIST} {
  outline: none;
  text-decoration: none;
  color: inherit;
}
${LINK}:focus-visible, ${WISHLIST}:focus-visible {
  outline: 2px solid var(--bloom-listing-card-ring, currentColor);
  outline-offset: 4px;
  border-radius: ${PHOTO_RADIUS + 4}px;
}
${TRACK} {
  scroll-snap-type: x mandatory;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
}
${TRACK}::-webkit-scrollbar {
  display: none;
}
${TRACK} [data-bloom-listing-card-slide] {
  scroll-snap-align: start;
  scroll-snap-stop: always;
}
${ARROW} {
  opacity: 0;
  transition: opacity 150ms ease-out;
}
@media (any-hover: hover) {
  ${CARD}:hover ${ARROW}, ${ARROW}:focus-within {
    opacity: 1;
  }
}
@media (any-hover: none) {
  ${ARROW} {
    display: none;
  }
}
${DOT} {
  transition: width 200ms ease-out, height 200ms ease-out, opacity 200ms ease-out;
}
${FAVORITE} {
  outline: none;
  cursor: pointer;
}
${FAVORITE}:focus-visible {
  outline: 2px solid var(--bloom-listing-card-ring, currentColor);
  outline-offset: 0;
}
@media (prefers-reduced-motion: reduce) {
  ${ARROW}, ${DOT} {
    transition: none;
  }
}
`;
