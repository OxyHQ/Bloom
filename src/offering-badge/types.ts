import type { ComponentType } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { Offering } from '../listing-card/types';
import type { BloomIconComponent } from '../icons/icon-component';

/** `small` is 20 tall with caption text; `medium` (default) is 24 tall with body-2 text. */
export type OfferingBadgeSize = 'small' | 'medium';

/**
 * `tinted` paints the offering's own tint on the page; `onMedia` is a light
 * pill with a shadow, for over a photo, the same in both modes.
 */
export type OfferingBadgeVariant = 'tinted' | 'onMedia';

/** An icon component the badge draws at its own size and colour (`RiKey2Line`). */
/** @deprecated Use `BloomIconComponent` from `@oxy.so/bloom/icons`; this is an alias of it. */
export type OfferingBadgeIcon = BloomIconComponent;

export interface OfferingBadgeProps {
  /** What the listing is offered as. Picks the default label, icon and tint. */
  offering: Offering;
  /** Replaces the default label ("For rent", "For sale", "Vacation rental", "Swap"). */
  label?: string;
  /**
   * `true` (default) draws the offering's own icon, `false` none, a component
   * replaces it.
   */
  icon?: boolean | OfferingBadgeIcon;
  /** Default `medium`. */
  size?: OfferingBadgeSize;
  /** Default `tinted`. */
  variant?: OfferingBadgeVariant;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
