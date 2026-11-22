import { VendorCard as BloomVendorCard, type VendorCardProps } from '@oxy.so/bloom/vendor-card';

import { Node, type ViewModifiers } from '../node';
import type { ControlDensity } from '../tokens';
import type { ControlRenderer } from './draw';
import { product, rowDensity } from './product';

/** A restaurant or a shop in a list. */
export type VendorCardKind = 'vendorCard';

/**
 * Bloom `VendorCard`'s data (its photo, cuisines, rating, delivery readings,
 * promo, availability, favourite and link).
 */
export type VendorCardOptions = Omit<
  VendorCardProps,
  'style' | 'testID' | 'accessibilityLabel' | 'name' | 'density' | 'loading' | 'onPress'
>;

/** Bloom `VendorCard`; `.onPress()` is its own. */
export interface VendorCardView extends ViewModifiers<VendorCardView> {
  /** `default` (comfortable) or `compact`. */
  density(value: ControlDensity): VendorCardView;
  /** Its placeholder, while the vendor loads. */
  loading(value?: boolean): VendorCardView;
}

export function VendorCard(name: string, options: VendorCardOptions = {}): VendorCardView {
  return new Node('vendorCard', { name, options }, []);
}

export const VENDOR_CARDS: Record<VendorCardKind, ControlRenderer> = {
  vendorCard: product(BloomVendorCard, {
    press: true,
    own: (d) => ({ density: rowDensity(d), loading: d.own('loading')?.value }),
  }),
};
