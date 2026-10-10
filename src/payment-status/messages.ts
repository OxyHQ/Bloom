import { defineMessages, type MessageCatalog } from '../locale/messages';
import type { PaymentStatusState } from './types';

/**
 * Every fixed string the payment-status family draws or announces, in each
 * Bloom language. A caller's `status`, `labels` and `referenceLabel` still win.
 */
export interface PaymentStatusMessages {
  /** The words each state says — read on their own, so "Payment failed", not "Failed". */
  states: Record<PaymentStatusState, string>;
  /** The word before the reference. */
  reference: string;
}

export const PAYMENT_STATUS_MESSAGES: MessageCatalog<PaymentStatusMessages> =
  defineMessages<PaymentStatusMessages>('PAYMENT_STATUS_MESSAGES', {
    states: {
      authorising: 'Authorising',
      paid: 'Paid',
      failed: 'Payment failed',
      refunded: 'Refunded',
      pending: 'Payment pending',
    },
    reference: 'Reference',
  });
