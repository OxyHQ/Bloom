import type { AccentTone } from '../theme/accent-colors';
import type { GuestCategory, TripStatus } from './types';

/**
 * `GuestSelect`'s default categories: adults (at least one), children, and
 * infants and pets, which do not count toward `maxGuests`. English strings —
 * pass your own `categories` to translate or change them.
 */
export const DEFAULT_GUEST_CATEGORIES: GuestCategory[] = [
  { key: 'adults', title: 'Adults', description: 'Ages 13 or above', min: 1 },
  { key: 'children', title: 'Children', description: 'Ages 2–12' },
  { key: 'infants', title: 'Infants', description: 'Under 2', max: 5, countsTowardMax: false },
  { key: 'pets', title: 'Pets', description: 'Bringing a service animal?', max: 5, countsTowardMax: false },
];

/** `TripCard`'s badge tone and default English label per status. */
export const TRIP_STATUS: Record<TripStatus, { tone: AccentTone; label: string }> = {
  confirmed: { tone: 'success', label: 'Confirmed' },
  pending: { tone: 'warning', label: 'Pending' },
  cancelled: { tone: 'error', label: 'Cancelled' },
  completed: { tone: 'default', label: 'Completed' },
};
