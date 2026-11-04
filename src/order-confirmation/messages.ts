import { defineMessages, type MessageCatalog } from '../locale/messages';

/**
 * The words the confirmation says when the app says nothing, in each Bloom
 * language. The `title`, `referenceLabel` and `itemsLabel` props still win.
 */
export interface OrderConfirmationMessages {
  title: string;
  referenceLabel: string;
  itemsLabel: string;
}

export const ORDER_CONFIRMATION_MESSAGES: MessageCatalog<OrderConfirmationMessages> =
  defineMessages<OrderConfirmationMessages>('ORDER_CONFIRMATION_MESSAGES', {
    title: 'Your order is placed',
    referenceLabel: 'Order number',
    itemsLabel: 'What you ordered',
  });
