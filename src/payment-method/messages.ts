import { defineMessages, type MessageCatalog } from '../locale/messages';
import type { PaymentMethodState } from './types';

/**
 * Every fixed string the payment-method family draws or announces, in each
 * Bloom language. Card scheme names are the app's. A caller's `defaultLabel`,
 * `stateMessage`, `addLabel`, `emptyTitle` and `accessibilityLabel` still win.
 */
export interface PaymentMethodMessages {
  /** What a row says under itself when its state has no message of its own. `ok` says nothing. */
  states: Record<Exclude<PaymentMethodState, 'ok'>, string>;
  /** The badge on the default method. */
  default: string;
  /** The add row. */
  add: string;
  /** An empty list's title. */
  emptyTitle: string;
  /** The list's name when neither the caller nor a `Field` gives one. */
  paymentMethods: string;
}

export const PAYMENT_METHOD_MESSAGES: MessageCatalog<PaymentMethodMessages> = defineMessages<PaymentMethodMessages>('PAYMENT_METHOD_MESSAGES', { states: { expired: 'Expired', declined: 'Declined' }, default: 'Default', add: 'Add a payment method', emptyTitle: 'No saved payment methods', paymentMethods: 'Payment methods' });
