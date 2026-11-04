import { useNetworkStatus } from '../connection-status/use-network-status';
import { useBloomPreferences } from './context';

/**
 * Whether media may start by itself right now: the viewer's `videoAutoplay`
 * preference, read against the current connection (`useNetworkStatus`). "Wi-Fi
 * only" holds back on a cellular or otherwise metered connection and allows
 * anything else (a browser that does not say what it is on, or an app without
 * the optional netinfo peer), so it never silently means "never".
 *
 * The default for `VideoPlaybackProvider`'s `autoplay` and `GifMessage`'s
 * `playing`. Media the viewer starts plays whatever this says.
 */
export function useMediaAutoplay(): boolean {
  const { preferences } = useBloomPreferences();
  const { metered } = useNetworkStatus();
  const policy = preferences.videoAutoplay;
  if (policy === 'never') return false;
  if (policy === 'always') return true;
  return !metered;
}
