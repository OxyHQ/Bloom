/**
 * Web variant — see `./use-network-status.ts`. The browser's own signals, so a
 * Vite/SPA consumer needs no native dependency: `navigator.onLine` with the
 * `online`/`offline` events, and the Network Information API (`connection`,
 * where the browser has it) for a cellular link or the viewer's Save-Data.
 */
import { useSyncExternalStore } from 'react';

import { createNetworkStatusStore, type NetworkStatus } from './network-status';

interface NetworkInformationLike {
  type?: string;
  saveData?: boolean;
  addEventListener?: (type: 'change', listener: () => void) => void;
  removeEventListener?: (type: 'change', listener: () => void) => void;
}

const store = createNetworkStatusStore((publish) => {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return undefined;
  const connection = (navigator as { connection?: NetworkInformationLike }).connection;
  const read = () =>
    publish({
      online: navigator.onLine,
      metered: connection?.type === 'cellular' || connection?.saveData === true,
    });
  read();
  window.addEventListener('online', read);
  window.addEventListener('offline', read);
  connection?.addEventListener?.('change', read);
  return () => {
    window.removeEventListener('online', read);
    window.removeEventListener('offline', read);
    connection?.removeEventListener?.('change', read);
  };
});

/**
 * Whether the browser is online, and whether its connection is metered — live,
 * from one subscription shared by every caller.
 */
export function useNetworkStatus(): NetworkStatus {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}
