import {
  type Offering,
  OfferingBadge as BloomOfferingBadge,
  type OfferingBadgeProps,
} from '@oxy.so/bloom/offering-badge';

import { Node, type ViewModifiers } from '../node';
import type { OfferingBadgeSize, OfferingBadgeStyle } from '../tokens';
import type { ControlRenderer } from './draw';
import { product } from './product';

/** What a listing is offered as: to rent, to buy, to swap. */
export type OfferingBadgeKind = 'offeringBadge';

/** Bloom `OfferingBadge`'s words and glyph (`icon: false` drops it). */
export type OfferingBadgeOptions = Omit<
  OfferingBadgeProps,
  'style' | 'testID' | 'offering' | 'size' | 'variant'
>;

/** Bloom `OfferingBadge`. */
export interface OfferingBadgeView extends ViewModifiers<OfferingBadgeView> {
  /** `sm` or `md`; by default the nearest appearance scope's. */
  size(value: OfferingBadgeSize): OfferingBadgeView;
  /** `tinted` (default) on a surface, `onMedia` over a photo. */
  style(value: OfferingBadgeStyle): OfferingBadgeView;
}

/** Bloom `OfferingBadge` of `offering`. */
export function OfferingBadge(
  offering: Offering,
  options: OfferingBadgeOptions = {},
): OfferingBadgeView {
  return new Node('offeringBadge', { offering, options }, []);
}

export const OFFERING_BADGES: Record<OfferingBadgeKind, ControlRenderer> = {
  offeringBadge: product(BloomOfferingBadge, {
    own: (d) => ({ size: d.own('size')?.value, variant: d.own('style')?.value }),
  }),
};
