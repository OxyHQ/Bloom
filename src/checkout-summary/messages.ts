import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * Every fixed string the checkout summary draws or announces, in each Bloom
 * language. A caller's `title`, `label`, `placeholder`, `busyLabel`,
 * `accessibilityHint` and `accessibilityLabel` still win.
 */
export interface CheckoutSummaryMessages {
  /** The heading above the rows. */
  title: string;
  /** Names the group when the heading is turned off. */
  orderSummary: string;
  /** The address row's label. */
  deliverTo: string;
  /** Drawn in place of a row's value while nothing is chosen. */
  notChosen: string;
  /** A pressable row's hint: what pressing it opens. */
  opensPicker: string;
  /** The confirm button, and what it announces while busy. */
  placeOrder: string;
  placingOrder: string;
}

export const CHECKOUT_SUMMARY_MESSAGES: MessageCatalog<CheckoutSummaryMessages> = defineMessages<CheckoutSummaryMessages>('CHECKOUT_SUMMARY_MESSAGES', {
  title: 'Review your order',
  orderSummary: 'Order summary',
  deliverTo: 'Deliver to',
  notChosen: 'Not chosen yet',
  opensPicker: 'Opens the picker',
  placeOrder: 'Place order',
  placingOrder: 'Placing your order',
});
