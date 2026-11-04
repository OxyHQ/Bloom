import { useEffect, useState } from 'react';

import { loadNetInfo } from '../connection-status/netinfo';
import { useBloomPreferences } from './context';

/**
 * Whether media may start by itself right now: the viewer's `videoAutoplay`
 * preference, read against the current connection. "Wi-Fi only" holds back on a
 * cellular or otherwise metered connection and allows anything else (a browser
 * that does not say what it is on, or an app without the optional netinfo
 * peer), so it never silently means "never".
 *
 * The default for `VideoPlaybackProvider`'s `autoplay` and `GifMessage`'s
 * `playing`. Media the viewer starts plays whatever this says.
 */
export function useMediaAutoplay(): boolean {
  const { preferences } = useBloomPreferences();
  const policy = preferences.videoAutoplay;
  const metered = useMeteredConnection(policy === 'wifi');
  if (policy === 'never') return false;
  if (policy === 'always') return true;
  return !metered;
}

/** Subscribes only while asked: "always" and "never" never touch netinfo. */
function useMeteredConnection(enabled: boolean): boolean {
  const [metered, setMetered] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    const netInfo = loadNetInfo();
    if (!netInfo) return;
    return netInfo.addEventListener((state) => {
      setMetered(state.type === 'cellular' || state.details?.isConnectionExpensive === true);
    });
  }, [enabled]);
  return enabled && metered;
}
