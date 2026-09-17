import { createContext, useContext } from 'react';

/**
 * Closes the surface a `GuestPicker` is rendered in — `BookingCard` provides it
 * around its guests popover — so the picker's "Close" link works without the
 * app wiring `onClose` itself. `null` outside such a surface.
 */
const GuestPickerCloseContext = createContext<(() => void) | null>(null);
GuestPickerCloseContext.displayName = 'BloomGuestPickerCloseContext';

export const GuestPickerCloseProvider = GuestPickerCloseContext.Provider;

export function useGuestPickerClose(): (() => void) | null {
  return useContext(GuestPickerCloseContext);
}
