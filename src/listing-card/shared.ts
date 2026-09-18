import { Platform } from 'react-native';

import { colorRamp, DANGER_TABLE, mixColor, resolveButtonRamps } from '../button/shared';
import { resolveMenuPalette } from '../floating/menu-palette';
import type { ImageResolver } from '../image-resolver/context';
import { isImageUrl } from '../image-resolver/is-image-url';
import type { Theme } from '../theme/types';
import type { ListingCardProps, ListingFact, ListingPriceLine, ListingStatus, Offering } from './types';

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
/**
 * How far `hoverZoom` scales the photo under a pointer. 1.06 — enough to read
 * as the photo coming forward, small enough that the crop barely moves and a
 * face near an edge is not pushed out of frame. The tile clips, so nothing
 * overflows the card.
 */
export const PHOTO_ZOOM_SCALE = 1.06;

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
  /** The status pill: the page's reading pair inverted, legible by construction in both modes. */
  statusFill: string;
  statusText: string;
  /** Laid over the photo of a listing that is not available, at {@link STATUS_WASH_OPACITY}. */
  statusWash: string;
}

/** A listing that is not available has its photo washed this far toward the page. */
export const STATUS_WASH_OPACITY = 0.5;

/** The compact density's thumbnail: square, this wide, radius {@link COMPACT_PHOTO_RADIUS}. */
export const COMPACT_PHOTO_SIZE = 112;
export const COMPACT_PHOTO_RADIUS = 12;

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
 *   status pill         text fill, background label (the page pair inverted)
 *   status wash         background at 50% over the photo
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
    statusFill: theme.colors.text,
    statusText: theme.colors.background,
    statusWash: theme.colors.background,
  };
}

// ---------------------------------------------------------------------------
//  Housing data — pure, shared by the card and the map preview
// ---------------------------------------------------------------------------

/** The English default status labels. `available` draws nothing. */
export const STATUS_LABELS: Readonly<Record<Exclude<ListingStatus, 'available'>, string>> = {
  reserved: 'Reserved',
  sold: 'Sold',
  rented: 'Rented',
  unavailable: 'Unavailable',
};

/** The status pill's label, or `null` for an available listing. */
export function statusLabelFor(status: ListingStatus | undefined, override?: string): string | null {
  if (!status || status === 'available') return null;
  return override ?? STATUS_LABELS[status];
}

/**
 * The price lines to draw: `priceLines` when given, otherwise the legacy
 * single line built from `price`, `priceUnit` and `originalPrice`.
 */
export function resolvePriceLines(
  props: Pick<ListingCardProps, 'priceLines' | 'price' | 'priceUnit' | 'originalPrice'>,
): ReadonlyArray<ListingPriceLine> {
  if (props.priceLines) return props.priceLines.filter((line) => line.price !== '');
  if (!props.price) return [];
  return [{ price: props.price, unit: props.priceUnit, originalPrice: props.originalPrice }];
}

/** "€240,000, €3,200/m², originally €250,000" — one line in words. */
export function describePriceLine(line: ListingPriceLine): string {
  const unit = line.unit ? ` ${line.unit}` : '';
  const secondary = line.secondary ? `, ${line.secondary}` : '';
  const original = line.originalPrice ? `, originally ${line.originalPrice}` : '';
  return `${line.price}${unit}${secondary}${original}`;
}

export function describeFacts(facts: ReadonlyArray<ListingFact> | undefined): string | null {
  if (!facts || facts.length === 0) return null;
  return facts.map((fact) => fact.accessibilityLabel ?? fact.label).join(', ');
}

/** The address line as drawn: the address, "Approximate location", or both. */
export function locationText(
  address: string | undefined,
  approximate: boolean | undefined,
  approximateLabel = 'Approximate location',
): string | null {
  if (address && approximate) return `${address} · ${approximateLabel}`;
  if (address) return address;
  return approximate ? approximateLabel : null;
}

/** De-duplicated, in the order given. */
export function uniqueOfferings(offerings: ReadonlyArray<Offering> | undefined): Offering[] {
  return offerings ? Array.from(new Set(offerings)) : [];
}

/** A URL passes through; an id goes to the app's resolver (`undefined` without one). */
export function resolvePhoto(
  photo: string,
  resolver: ImageResolver | null,
  variant?: string,
): string | undefined {
  if (!photo) return undefined;
  return isImageUrl(photo) ? photo : resolver?.(photo, variant);
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

// ---------------------------------------------------------------------------
//  Web CSS — hover-only arrows, the snapping track and focus rings have no
//  inline-style spelling, so they hang off `dataSet` attributes in an adopted
//  sheet. `adoptStyleSheet` no-ops without a document.
// ---------------------------------------------------------------------------

export const LISTING_CARD_STYLE_ID = 'bloom-listing-card-web-css';

const CARD = '[data-bloom-listing-card]';
const LINK = '[data-bloom-listing-card-link]';
const TRACK = '[data-bloom-listing-card-track]';
const PHOTO = '[data-bloom-listing-card-photo]';
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
${CARD}[data-bloom-listing-card-zoom] ${PHOTO} {
  transition: transform 400ms cubic-bezier(0.2, 0, 0.2, 1);
  transform-origin: center;
}
@media (any-hover: hover) {
  ${CARD}[data-bloom-listing-card-zoom]:hover ${PHOTO} {
    transform: scale(${PHOTO_ZOOM_SCALE});
  }
}
@media (prefers-reduced-motion: reduce) {
  ${ARROW}, ${DOT} {
    transition: none;
  }
  ${CARD}[data-bloom-listing-card-zoom] ${PHOTO},
  ${CARD}[data-bloom-listing-card-zoom]:hover ${PHOTO} {
    transition: none;
    transform: none;
  }
}
`;
