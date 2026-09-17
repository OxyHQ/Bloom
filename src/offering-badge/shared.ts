import type { ComponentType } from 'react';

import { resolveButtonRamps } from '../button/shared';
import { RiArrowLeftRightLine } from '../icons/remix/RiArrowLeftRightLine';
import { RiKey2Line } from '../icons/remix/RiKey2Line';
import { RiPriceTag3Line } from '../icons/remix/RiPriceTag3Line';
import { RiSuitcaseLine } from '../icons/remix/RiSuitcaseLine';
import type { Offering } from '../listing-card/types';
import { resolveAccentColors, type AccentTone } from '../theme/accent-colors';
import type { Theme } from '../theme/types';
import type { TypeScaleVariant } from '../typography/scale';
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

export interface OfferingBadgeGeometry {
  height: number;
  paddingHorizontal: number;
  gap: number;
  icon: number;
  type: TypeScaleVariant;
}

/**
 *             height  padding-x  gap  icon  text
 *   small     20      8          4    12    caption-1-semibold
 *   medium    24      10         4    14    body-2-semibold
 */
export const OFFERING_BADGE_GEOMETRY: Readonly<Record<OfferingBadgeSize, OfferingBadgeGeometry>> = {
  small: { height: 20, paddingHorizontal: 8, gap: 4, icon: 12, type: 'caption-1-semibold' },
  medium: { height: 24, paddingHorizontal: 10, gap: 4, icon: 14, type: 'body-2-semibold' },
};

export interface OfferingBadgePaint {
  background: string;
  foreground: string;
  /** The icon: the tone's own accent when tinted; over a photo, the same dark neutral as the label. */
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
 */
export function resolveOfferingBadgePaint(
  theme: Theme,
  offering: Offering,
  variant: OfferingBadgeVariant,
): OfferingBadgePaint {
  if (variant === 'onMedia') {
    const { neutral: n } = resolveButtonRamps(theme);
    return { background: n[50], foreground: n[900], icon: n[900], shadow: 's' };
  }
  const pair = resolveAccentColors(theme.colors, OFFERING_TONES[offering], 'subtle');
  return { background: pair.background, foreground: pair.foreground, icon: pair.foreground, shadow: null };
}
