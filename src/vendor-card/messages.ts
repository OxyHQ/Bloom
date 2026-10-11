import { defineMessages, type MessageCatalog } from '../locale/messages';
import type { VendorAvailability, VendorFactKey } from './types';
import { counted, has } from './message-helpers';

/**
 * Every fixed string the vendor card draws or announces, in each Bloom
 * language. A caller's `factLabels`, `availabilityLabel`, `newLabel` and
 * `accessibilityLabel` still win over any entry here.
 */
export interface VendorCardMessages {
  /** The word said before each reading in the card's accessible name. */
  facts: Record<VendorFactKey, string>;
  /** The status pill. `open` draws none. */
  availability: Record<Exclude<VendorAvailability, 'open'>, string>;
  /** An unrated vendor's mark. */
  new: string;
  /**
   * The rating in the card's accessible name: "Rated 4.8 out of 5, 214
   * reviews". `reviews` is the app's count, a number or pre-formatted text.
   */
  rated: (value: string, reviews?: number | string) => string;
}

export const VENDOR_CARD_MESSAGES: MessageCatalog<VendorCardMessages> =
  defineMessages<VendorCardMessages>('VENDOR_CARD_MESSAGES', {
    facts: {
      deliveryTime: 'Delivery time',
      deliveryFee: 'Delivery',
      distance: 'Distance',
      minimumOrder: 'Minimum order',
    },
    availability: { paused: 'Paused', closed: 'Closed' },
    new: 'New',
    rated: (value, reviews) =>
      `Rated ${value} out of 5${has(reviews) ? `, ${counted('en', reviews, { one: '{n} review', other: '{n} reviews' })}` : ''}`,
  });
