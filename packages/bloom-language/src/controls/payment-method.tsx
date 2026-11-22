import {
  type PaymentMethodEntry,
  PaymentMethodList as BloomPaymentMethodList,
  type PaymentMethodListProps,
  PaymentMethodMark as BloomPaymentMethodMark,
  type PaymentMethodMarkProps,
  PaymentMethodRow as BloomPaymentMethodRow,
  type PaymentMethodRowProps,
} from '@oxy.so/bloom/payment-method';

import { type Child, Node, type ViewModifiers } from '../node';
import type { ChoiceListStyle, ControlDensity } from '../tokens';
import type { ControlRenderer } from './draw';
import { product, rowDensity } from './product';

/** A way to pay: its mark, a row, and a list to read or to choose one from. */
export type PaymentMethodsKind = 'paymentMethodMark' | 'paymentMethodRow' | 'paymentMethodList';

type Drawn = 'style' | 'testID' | 'accessibilityLabel' | 'density';

/** Bloom `PaymentMethodMark`'s data (its scheme, kind, glyph and state); its image is a language child. */
export type PaymentMethodMarkOptions = Omit<PaymentMethodMarkProps, Drawn | 'image'> & {
  readonly image?: Child;
};
type RowSlots = 'image' | 'leading' | 'action';
/**
 * Bloom `PaymentMethodRow`'s data (the scheme, masked number, expiry, default,
 * state, selection and role); its image, leading media and action are language
 * children.
 */
export type PaymentMethodRowOptions = Omit<
  PaymentMethodRowProps,
  Drawn | RowSlots | 'disabled' | 'onPress'
> & { readonly [K in RowSlots]?: Child };
/** Bloom `PaymentMethodList`'s data (its selection, add action and words); its empty block is a language child. */
export type PaymentMethodListOptions = Omit<
  PaymentMethodListProps,
  Drawn | 'methods' | 'variant' | 'disabled' | 'loading' | 'empty'
> & { readonly empty?: Child };

export interface PaymentMethodMarkView extends ViewModifiers<PaymentMethodMarkView> {
  /** `default` (comfortable) or `compact`. */
  density(value: ControlDensity): PaymentMethodMarkView;
}
/** Bloom `PaymentMethodRow`; `.onPress()` is its own. */
export interface PaymentMethodRowView extends ViewModifiers<PaymentMethodRowView> {
  density(value: ControlDensity): PaymentMethodRowView;
  disabled(value?: boolean): PaymentMethodRowView;
}
export interface PaymentMethodListView extends ViewModifiers<PaymentMethodListView> {
  /** `list` (default), read; or `picker`, one chosen. */
  style(value: ChoiceListStyle): PaymentMethodListView;
  density(value: ControlDensity): PaymentMethodListView;
  disabled(value?: boolean): PaymentMethodListView;
  /** Placeholder rows instead of the methods. */
  loading(value?: boolean): PaymentMethodListView;
}

export function PaymentMethodMark(options: PaymentMethodMarkOptions = {}): PaymentMethodMarkView {
  return new Node('paymentMethodMark', { options }, []);
}
export function PaymentMethodRow(options: PaymentMethodRowOptions = {}): PaymentMethodRowView {
  return new Node('paymentMethodRow', { options }, []);
}
export function PaymentMethodList(
  methods: readonly PaymentMethodEntry[],
  options: PaymentMethodListOptions = {},
): PaymentMethodListView {
  return new Node('paymentMethodList', { methods, options }, []);
}

export const PAYMENT_METHODS: Record<PaymentMethodsKind, ControlRenderer> = {
  paymentMethodMark: product(BloomPaymentMethodMark, {
    slots: ['image'],
    own: (d) => ({ density: rowDensity(d) }),
  }),
  paymentMethodRow: product(BloomPaymentMethodRow, {
    press: true,
    slots: ['image', 'leading', 'action'],
    own: (d) => ({ density: rowDensity(d), disabled: d.own('disabled')?.value }),
  }),
  paymentMethodList: product(BloomPaymentMethodList, {
    slots: ['empty'],
    own: (d) => ({
      variant: d.own('style')?.value,
      density: rowDensity(d),
      disabled: d.own('disabled')?.value,
      loading: d.own('loading')?.value,
    }),
  }),
};
