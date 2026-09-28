import type { AccentTone } from '../theme/accent-colors';
import { BOOKING_MESSAGES } from './messages';
import type { TripStatus } from './types';

const EN = BOOKING_MESSAGES.en.tripStatus;

/**
 * `TripCard`'s badge tone and English label per status. The card itself speaks
 * the label in the locale (`BOOKING_MESSAGES`); `statusLabel` still wins.
 */
export const TRIP_STATUS: Record<TripStatus, { tone: AccentTone; label: string }> = {
  confirmed: { tone: 'success', label: EN.confirmed },
  pending: { tone: 'warning', label: EN.pending },
  cancelled: { tone: 'error', label: EN.cancelled },
  completed: { tone: 'default', label: EN.completed },
};
