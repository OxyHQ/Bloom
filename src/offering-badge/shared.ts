import type { ComponentType } from 'react';

import { BADGE_GEOMETRY, resolveBadgePaint, type BadgeGeometry, type BadgeSize } from '../badge';
import { RiArrowLeftRightLine } from '../icons/remix/RiArrowLeftRightLine';
import { RiKey2Line } from '../icons/remix/RiKey2Line';
import { RiPriceTag3Line } from '../icons/remix/RiPriceTag3Line';
import { RiSuitcaseLine } from '../icons/remix/RiSuitcaseLine';
import type { Offering } from '../listing-card/types';
import type { AccentTone } from '../theme/accent-colors';
import type { Theme } from '../theme/types';
import type { OfferingBadgeSize, OfferingBadgeVariant } from './types';

/** Every offering, in the order a listing lists them. */
export const OFFERINGS: readonly Offering[] = ['long_term_rent', 'sale', 'short_term_rent', 'exchange'];

/** The English default labels. Apps in other languages pass `label`. */
export const OFFERING_LABELS: Readonly<Record<Offering, string>> = {
  long_term_rent: 'For rent',
  sale: 'For sale',
  short_term_rent: 'Vacation rental',
  exchange: 'Swap',
};

export const OFFERING_ICONS: Readonly<
  Record<Offering, ComponentType<{ width?: number; height?: number; fill?: string }>>
> = {
  long_term_rent: RiKey2Line,
  sale: RiPriceTag3Line,
  short_term_rent: RiSuitcaseLine,
  exchange: RiArrowLeftRightLine,
};

/**
 * The tone each offering is tinted in — FIXED, never the preset's brand
 * colour. `info`, `success` and `warning` are the policy's own hues and do not
 * move with the preset, so "blue means rent" holds in every app; a brand tint
 * would collide with one of them in some preset (a blue brand is `info`, a
 * green one `success`). Swap is the one neutral: four hues would leave a
 * fourth colour to the brand, and the neutral is the one member no preset can
 * collide with.
 */
export const OFFERING_TONES: Readonly<Record<Offering, AccentTone>> = {
  long_term_rent: 'info',
  sale: 'success',
  short_term_rent: 'warning',
  exchange: 'default',
};

/**
 * Which `Badge` rung each offering size is. The geometry itself is `Badge`'s —
 * this family owns the housing VOCABULARY (which word, which glyph, which
 * tone) and nothing else. It used to own a second copy of the rung table, which
 * is how the listing card's status pill ended up with a third.
 */
export const OFFERING_BADGE_RUNG: Readonly<Record<OfferingBadgeSize, BadgeSize>> = {
  small: 'label-small',
  medium: 'label-medium',
};

export type OfferingBadgeGeometry = BadgeGeometry;

/**
 *             height  padding-x  gap  icon  text
 *   small     20      8          4    12    caption-1-semibold
 *   medium    24      10         4    14    body-2-semibold
 *
 * Read through from `BADGE_GEOMETRY` so there is one table, not two.
 */
export const OFFERING_BADGE_GEOMETRY: Readonly<Record<OfferingBadgeSize, OfferingBadgeGeometry>> = {
  small: BADGE_GEOMETRY['label-small'],
  medium: BADGE_GEOMETRY['label-medium'],
};

export interface OfferingBadgePaint {
  background: string;
  foreground: string;
  /** The icon: the same colour as the label, on both variants. */
  icon: string;
  /** `bloomShadowStyle` step, or `null` for none. */
  shadow: 's' | null;
}

/**
 * Pure.
 *
 *   tinted    the tone's `subtle` pair from `resolveAccentColors` — the pair the
 *             colour policy gates at AA over the page, so nothing is derived here
 *   onMedia   neutral-50 pill, neutral-900 label and icon, shadow-s; the same in
 *             both modes, because the photo under it does not change with them
 *
 * Both are `Badge`'s own paint (`resolveBadgePaint`); this maps the offering to
 * its tone and the variant to the badge's fill.
 */
export function resolveOfferingBadgePaint(
  theme: Theme,
  offering: Offering,
  variant: OfferingBadgeVariant,
): OfferingBadgePaint {
  const paint = resolveBadgePaint(theme, OFFERING_TONES[offering], variant === 'onMedia' ? 'onMedia' : 'subtle');
  return { background: paint.background, foreground: paint.foreground, icon: paint.foreground, shadow: paint.shadow };
}
