import { Platform } from 'react-native';

import { resolveButtonRamps } from '../button/shared';
import type { ImageResolver } from '../image-resolver/context';
import { isImageUrl } from '../image-resolver/is-image-url';
import type { Theme } from '../theme/types';

export const IS_WEB = Platform.OS === 'web';

/**
 * Every colour the listing parts paint. Pure.
 *
 *   text / textSecondary    theme text, text-secondary
 *   muted                   text-tertiary        (an unavailable amenity's icon)
 *   hairline                neutral-200          dark neutral-800
 *   card                    card surface         dark neutral-900
 *   cardBorder              neutral-200          dark neutral-800
 *   tile                    neutral-100          dark neutral-800 (a photo before it loads)
 *   hover                   neutral-100          dark neutral-800 (text action wash)
 *   scrim                   neutral-950          (the photo hover darkening, drawn at 10% opacity)
 *   starEmpty               neutral-300          dark neutral-700
 *   ring                    accent-500           (keyboard focus)
 */
export interface ListingPalette {
  text: string;
  textSecondary: string;
  muted: string;
  hairline: string;
  card: string;
  cardBorder: string;
  tile: string;
  hover: string;
  scrim: string;
  starEmpty: string;
  ring: string;
  badge: string;
  badgeForeground: string;
  responseSurface: string;
}

export function resolveListingPalette(theme: Theme): ListingPalette {
  const c = theme.colors;
  const { accent, neutral: n } = resolveButtonRamps(theme);
  const dark = theme.isDark;
  return {
    text: c.text,
    textSecondary: c.textSecondary,
    muted: c.textTertiary,
    hairline: dark ? n[800] : n[200],
    card: dark ? n[900] : c.card,
    cardBorder: dark ? n[800] : n[200],
    tile: dark ? n[800] : n[100],
    hover: dark ? n[800] : n[100],
    scrim: n[950],
    starEmpty: dark ? n[700] : n[300],
    ring: accent[500],
    badge: c.primary,
    badgeForeground: c.primaryForeground,
    responseSurface: dark ? n[900] : n[50],
  };
}

/** A URL passes through; an id goes to the resolver; nothing resolves to `undefined`. */
export function resolveImageUri(
  source: string | undefined,
  resolver: ImageResolver | null,
  variant: string,
): string | undefined {
  if (!source) return undefined;
  return isImageUrl(source) ? source : resolver?.(source, variant) ?? undefined;
}

// ---------------------------------------------------------------------------
//  Web CSS
//
//  The photo's hover darkening eases in and the pressable parts draw a keyboard
//  ring; neither has an inline-style spelling, so they live in one adopted sheet
//  hanging off `dataSet` attributes.
// ---------------------------------------------------------------------------

export const LISTING_DETAILS_STYLE_ID = 'bloom-listing-details-web-css';

export const LISTING_DETAILS_CSS = `
[data-bloom-listing-scrim] {
  transition: opacity 150ms ease-out;
}
[data-bloom-listing-press] {
  outline: none;
  cursor: pointer;
}
[data-bloom-listing-press]:focus-visible {
  outline: 2px solid var(--bloom-listing-ring, currentColor);
  outline-offset: 2px;
}
[data-bloom-listing-press="inset"]:focus-visible {
  outline-offset: -2px;
}
[data-bloom-listing-link] {
  text-decoration-line: underline;
  text-underline-offset: 3px;
}
@media (prefers-reduced-motion: reduce) {
  [data-bloom-listing-scrim] {
    transition: none;
  }
}
`;
