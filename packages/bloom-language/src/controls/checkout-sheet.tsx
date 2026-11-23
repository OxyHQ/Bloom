import {
  CheckoutSheet as BloomCheckoutSheet,
  type CheckoutSheetProps,
} from '@oxy.so/bloom/checkout-sheet';

import { type Child, Node, type ViewModifiers } from '../node';
import type { MethodTitleAlign, TypeRampStep } from '../tokens';
import type { ControlRenderer } from './draw';
import { product } from './product';

/** The checkout sheet: an order reviewed, paid and confirmed, step by step. */
export type CheckoutSheetKind = 'checkoutSheet';

type Slots = 'methodContent' | 'footer' | 'resultIllustration' | 'cardEntry' | 'notice';
/**
 * Bloom `CheckoutSheet`'s data, as the app controls it (its request, draft,
 * step and their handlers, its words and amounts); its slots are language
 * children.
 */
export type CheckoutSheetOptions = Omit<
  CheckoutSheetProps,
  'style' | 'testID' | Slots | 'methodTitleAlign' | 'methodTitleVariant'
> & {
  readonly [K in Slots]?: Child;
};

/** Bloom `CheckoutSheet`. */
export interface CheckoutSheetView extends ViewModifiers<CheckoutSheetView> {
  /** The method step's title: `left` or `center`. */
  methodTitleAlign(value: MethodTitleAlign): CheckoutSheetView;
  /** The method step's title, a step of Bloom's type ramp. */
  methodTitleVariant(value: TypeRampStep): CheckoutSheetView;
}

export function CheckoutSheet(options: CheckoutSheetOptions): CheckoutSheetView {
  return new Node('checkoutSheet', { options }, []);
}

export const CHECKOUT_SHEETS: Record<CheckoutSheetKind, ControlRenderer> = {
  checkoutSheet: product(BloomCheckoutSheet, {
    slots: ['methodContent', 'footer', 'resultIllustration', 'cardEntry', 'notice'],
    own: (d) => ({
      methodTitleAlign: d.own('methodTitleAlign')?.value,
      methodTitleVariant: d.own('methodTitleVariant')?.value,
    }),
  }),
};
