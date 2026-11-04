/**
 * Web variant — see `./index.tsx` for what this is and why it is a toast.
 *
 * `navigator.onLine` + the `online`/`offline` events are the browser's own
 * signal, so a Vite/SPA consumer needs no native dependency to get the same
 * behaviour. (The browser only knows about the link, not reachability; that is
 * the honest limit of what a web app can detect without polling.)
 */
import { useConnectionStatusToasts, type ConnectionStatusToastsProps } from './shared';
import { useNetworkStatus } from './use-network-status.web';

/** Mount once at the app root. Renders nothing. */
export function ConnectionStatusToasts(props: ConnectionStatusToastsProps = {}): null {
  useConnectionStatusToasts(useNetworkStatus().online, props);
  return null;
}

ConnectionStatusToasts.displayName = 'ConnectionStatusToasts';
