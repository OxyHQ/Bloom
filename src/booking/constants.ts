import type { AccentTone } from '../theme/accent-colors';
import type { TripStatus } from './types';

/** `TripCard`'s badge tone and default English label per status. */
export const TRIP_STATUS: Record<TripStatus, { tone: AccentTone; label: string }> = {
  confirmed: { tone: 'success', label: 'Confirmed' },
  pending: { tone: 'warning', label: 'Pending' },
  cancelled: { tone: 'error', label: 'Cancelled' },
  completed: { tone: 'default', label: 'Completed' },
};
