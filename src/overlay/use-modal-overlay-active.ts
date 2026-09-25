/**
 * `useModalOverlayActive` — whether any modal Bloom overlay is open.
 *
 * Re-renders only when the answer flips. See `./modal-registry.ts` for who
 * registers and why.
 */
import { useEffect, useSyncExternalStore } from 'react';

import {
  hasActiveModalOverlays,
  registerModalOverlay,
  subscribeModalOverlays,
} from './modal-registry';

/** `false` on the server: nothing is open before hydration. */
const serverSnapshot = () => false;

export function useModalOverlayActive(): boolean {
  return useSyncExternalStore(subscribeModalOverlays, hasActiveModalOverlays, serverSnapshot);
}

/**
 * Register as an open modal overlay while mounted and `modal` is true. Used by
 * `OverlayRoot`; exported only within the family.
 */
export function useModalOverlayRegistration(modal: boolean): void {
  useEffect(() => {
    if (!modal) return undefined;
    return registerModalOverlay({});
  }, [modal]);
}
