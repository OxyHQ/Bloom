/**
 * Connection loss as a toast, not a layout-shifting banner.
 *
 * Every Oxy app needs this and none of them should hand-roll it: a coloured bar
 * sliding in above the header pushes the whole screen down, has to be themed
 * again in each app, and competes with the app's own chrome. The toast host is
 * already mounted, already themed, already stacks.
 *
 * NATIVE variant: `@react-native-community/netinfo` reports both link state and
 * reachability, read through `useNetworkStatus`. It is an OPTIONAL peer loaded
 * through `./netinfo` — see that file for why it is not a static import, and
 * why an app that omits it gets an inert component rather than a broken bundle. The web fork uses
 * `navigator.onLine` instead so Vite/SPA consumers need no extra dependency at
 * all.
 */
import { useEffect } from 'react';

import { loadNetInfo, warnNetInfoUnavailable } from './netinfo';
import { useConnectionStatusToasts, type ConnectionStatusToastsProps } from './shared';
import { useNetworkStatus } from './use-network-status';

/** Mount once at the app root. Renders nothing. */
export function ConnectionStatusToasts(props: ConnectionStatusToastsProps = {}): null {
  // Without netinfo the status stays online, so the component is inert instead
  // of broken; the warning says why no toast will ever appear.
  useEffect(() => {
    if (!loadNetInfo()) warnNetInfoUnavailable();
  }, []);

  useConnectionStatusToasts(useNetworkStatus().online, props);
  return null;
}

ConnectionStatusToasts.displayName = 'ConnectionStatusToasts';
