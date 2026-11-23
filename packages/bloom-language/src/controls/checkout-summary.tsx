import {
  CheckoutConfirm as BloomCheckoutConfirm,
  type CheckoutConfirmProps,
  CheckoutSummary as BloomCheckoutSummary,
  type CheckoutSummaryProps,
  CheckoutSummaryRow as BloomCheckoutSummaryRow,
  type CheckoutSummaryRowProps,
} from '@oxy.so/bloom/checkout-summary';

import { type Child, Node, type ViewModifiers } from '../node';
import type { ControlRenderer } from './draw';
import { product } from './product';

/** Review and confirm: the rows a buyer checks, the summary that holds them, and the confirm. */
export type CheckoutSummaryKind = 'checkoutSummaryRow' | 'checkoutSummary' | 'checkoutConfirm';

type RowSlots = 'content' | 'leading' | 'badge';
/**
 * Bloom `CheckoutSummaryRow`'s data (its glyph, value, placeholder, detail
 * and hint); its content, leading media and badge are language children.
 */
export type CheckoutSummaryRowOptions = Omit<
  CheckoutSummaryRowProps,
  'style' | 'testID' | 'accessibilityLabel' | 'label' | 'disabled' | 'onPress' | RowSlots
> & { readonly [K in RowSlots]?: Child };
/**
 * Bloom `CheckoutSummary`'s data (its title, address, delivery, note, extras,
 * price and confirm, as Bloom takes them); its payment is a language child.
 */
export type CheckoutSummaryOptions = Omit<
  CheckoutSummaryProps,
  'style' | 'testID' | 'accessibilityLabel' | 'children' | 'payment'
> & { readonly payment?: Child };
type ConfirmSlots = 'terms' | 'footer';
/** Bloom `CheckoutConfirm`'s data (its words, amounts and handler); its terms and footer are language children. */
export type CheckoutConfirmOptions = Omit<
  CheckoutConfirmProps,
  'style' | 'testID' | 'disabled' | 'busy' | ConfirmSlots
> & { readonly [K in ConfirmSlots]?: Child };

/** Bloom `CheckoutSummaryRow`; `.onPress()` is its own (it opens what changes the row). */
export interface CheckoutSummaryRowView extends ViewModifiers<CheckoutSummaryRowView> {
  disabled(value?: boolean): CheckoutSummaryRowView;
}
/** Bloom `CheckoutSummary`; `.label()` names it. */
export type CheckoutSummaryView = ViewModifiers<CheckoutSummaryView>;
export interface CheckoutConfirmView extends ViewModifiers<CheckoutConfirmView> {
  disabled(value?: boolean): CheckoutConfirmView;
  /** The order is being placed (Bloom's `busy`). */
  loading(value?: boolean): CheckoutConfirmView;
}

export function CheckoutSummaryRow(
  label: string,
  options: CheckoutSummaryRowOptions = {},
): CheckoutSummaryRowView {
  return new Node('checkoutSummaryRow', { label, options }, []);
}
/** Bloom `CheckoutSummary`; `content` is what it holds beyond its rows (Bloom's children). */
export function CheckoutSummary(
  content?: Child,
  options: CheckoutSummaryOptions = {},
): CheckoutSummaryView {
  return new Node('checkoutSummary', { options }, content === undefined ? [] : [content]);
}
export function CheckoutConfirm(options: CheckoutConfirmOptions = {}): CheckoutConfirmView {
  return new Node('checkoutConfirm', { options }, []);
}

export const CHECKOUT_SUMMARIES: Record<CheckoutSummaryKind, ControlRenderer> = {
  checkoutSummaryRow: product(BloomCheckoutSummaryRow, {
    press: true,
    slots: ['content', 'leading', 'badge'],
    own: (d) => ({ disabled: d.own('disabled')?.value }),
  }),
  checkoutSummary: product(BloomCheckoutSummary, { slots: ['payment'] }),
  checkoutConfirm: product(BloomCheckoutConfirm, {
    slots: ['terms', 'footer'],
    own: (d) => ({ disabled: d.own('disabled')?.value, busy: d.own('loading')?.value }),
  }),
};
