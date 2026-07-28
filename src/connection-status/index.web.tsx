/**
 * Web variant — see `./index.tsx` for what this is and why it is a toast.
 *
 * `navigator.onLine` + the `online`/`offline` events are the browser's own
 * signal, so a Vite/SPA consumer needs no native dependency to get the same
 * behaviour. (The browser only knows about the link, not reachability; that is
 * the honest limit of what a web app can detect without polling.)
 */
import { useEffect, useState } from 'react';

import { useConnectionStatusToasts, type ConnectionStatusToastsProps } from './shared';

export type { ConnectionStatusToastsProps } from './shared';

/** Mount once at the app root. Renders nothing. */
export function ConnectionStatusToasts(props: ConnectionStatusToastsProps = {}): null {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof navigator === 'undefined' || typeof window === 'undefined') return undefined;

    setIsOnline(navigator.onLine);
    const update = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  useConnectionStatusToasts(isOnline, props);
  return null;
}

ConnectionStatusToasts.displayName = 'ConnectionStatusToasts';
