import {
  OrderConfirmation as BloomOrderConfirmation,
  type OrderConfirmationProps,
} from '@oxy.so/bloom/order-confirmation';

import { type Child, Node, type ViewModifiers } from '../node';
import type { ControlDensity, SpaceToken } from '../tokens';
import type { ControlRenderer } from './draw';
import { product, rowDensity } from './product';

/** It is placed: the mark, the reference, the status, where it goes and what was charged. */
export type OrderConfirmationKind = 'orderConfirmation';

type Slots = 'mark' | 'items' | 'footer';
/**
 * Bloom `OrderConfirmation`'s data (its words, reference, status, address,
 * facts and actions); its mark, items and footer are language children and
 * its `markSize` a space token.
 */
export type OrderConfirmationOptions = Omit<
  OrderConfirmationProps,
  'style' | 'testID' | 'accessibilityLabel' | 'variant' | 'markSize' | Slots
> & { readonly [K in Slots]?: Child } & { readonly markSize?: SpaceToken };

/** Bloom `OrderConfirmation`; `.label()` names it. */
export interface OrderConfirmationView extends ViewModifiers<OrderConfirmationView> {
  /** `default` (comfortable) or `compact` (Bloom's `variant`). */
  density(value: ControlDensity): OrderConfirmationView;
}

export function OrderConfirmation(options: OrderConfirmationOptions = {}): OrderConfirmationView {
  return new Node('orderConfirmation', { options }, []);
}

export const ORDER_CONFIRMATIONS: Record<OrderConfirmationKind, ControlRenderer> = {
  orderConfirmation: product(BloomOrderConfirmation, {
    slots: ['mark', 'items', 'footer'],
    lengths: ['markSize'],
    own: (d) => ({ variant: rowDensity(d) }),
  }),
};
