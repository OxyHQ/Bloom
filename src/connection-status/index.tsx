/**
 * Connection loss as a toast, not a layout-shifting banner.
 *
 * Every Oxy app needs this and none of them should hand-roll it: a coloured bar
 * sliding in above the header pushes the whole screen down, has to be themed
 * again in each app, and competes with the app's own chrome. The toast host is
 * already mounted, already themed, already stacks.
 *
 * NATIVE variant: `@react-native-community/netinfo` (an Expo-managed dependency
 * every Oxy app already ships) reports both link state and reachability. The
 * web fork uses `navigator.onLine` instead so Vite/SPA consumers need no extra
 * dependency at all.
 */
import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

import { useConnectionStatusToasts, type ConnectionStatusToastsProps } from './shared';

export type { ConnectionStatusToastsProps } from './shared';

/** Mount once at the app root. Renders nothing. */
export function ConnectionStatusToasts(props: ConnectionStatusToastsProps = {}): null {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    // `isInternetReachable` is null until the first probe resolves; treat that
    // as "connected as far as we know" so a captive-portal check never flashes
    // an outage on launch.
    return NetInfo.addEventListener((state) => {
      setIsOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
    });
  }, []);

  useConnectionStatusToasts(isOnline, props);
  return null;
}

ConnectionStatusToasts.displayName = 'ConnectionStatusToasts';
