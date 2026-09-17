import { createContext, useContext } from 'react';

/**
 * Closes the `BookingCard` guests popover a `GuestSelect` is rendered in, so
 * its "Close" link works without the app wiring `onClose` itself. `null`
 * outside a card.
 */
const GuestSelectCloseContext = createContext<(() => void) | null>(null);
GuestSelectCloseContext.displayName = 'BloomGuestSelectCloseContext';

export const GuestSelectCloseProvider = GuestSelectCloseContext.Provider;

export function useGuestSelectClose(): (() => void) | null {
  return useContext(GuestSelectCloseContext);
}
