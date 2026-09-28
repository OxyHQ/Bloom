import { defineMessages, type MessageCatalog } from '../locale/messages';
import type { TripStatus } from './types';
import { priceName } from './message-helpers';

/**
 * Every fixed string the booking family draws or announces, in each Bloom
 * language. A caller's `*Label` props still win over any entry here; prices,
 * dates and guest counts arrive formatted from the app.
 */
export interface BookingMessages {
  checkIn: string;
  checkOut: string;
  guests: string;
  addDate: string;
  reserve: string;
  checkAvailability: string;
  /** The note under the button once both dates are set. */
  notChargedYet: string;
  /** `PriceBreakdown`'s bold last row. */
  total: string;
  tripStatus: Record<TripStatus, string>;
  /**
   * A price's spoken name: "$180 per night, originally $210". `unit` and
   * `originalPrice` are optional; each language places them itself.
   */
  priceName: (price: string, unit?: string, originalPrice?: string) => string;
}

export const BOOKING_MESSAGES: MessageCatalog<BookingMessages> = defineMessages<BookingMessages>('BOOKING_MESSAGES', {
  checkIn: 'Check-in',
  checkOut: 'Checkout',
  guests: 'Guests',
  addDate: 'Add date',
  reserve: 'Reserve',
  checkAvailability: 'Check availability',
  notChargedYet: "You won't be charged yet",
  total: 'Total',
  tripStatus: { confirmed: 'Confirmed', pending: 'Pending', cancelled: 'Cancelled', completed: 'Completed' },
  priceName: priceName((p, u) => `${p} per ${u}`, (s, o) => `${s}, originally ${o}`),
});
