import type { StyleProp, ViewStyle } from 'react-native';

import type { Offering } from '../listing-card/types';
import type { BloomIconComponent } from '../icons/icon-component';

/** `sm` is 20 tall with caption text; `md` (default) is 24 tall with body-2 text. */
export type OfferingBadgeSize = 'sm' | 'md';

/**
 * `tinted` paints the offering's own tint on the page; `onMedia` is a light
 * pill with a shadow, for over a photo, the same in both modes.
 */
export type OfferingBadgeVariant = 'tinted' | 'onMedia';

export interface OfferingBadgeProps {
  /** What the listing is offered as. Picks the default label, icon and tint. */
  offering: Offering;
  /** Replaces the localised label ("For rent", "For sale", "Vacation rental", "Swap" in English). */
  label?: string;
  /**
   * `true` (default) draws the offering's own icon, `false` none, a component
   * replaces it.
   */
  icon?: boolean | BloomIconComponent;
  /** Default `md`. */
  size?: OfferingBadgeSize;
  /** Default `tinted`. */
  variant?: OfferingBadgeVariant;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
