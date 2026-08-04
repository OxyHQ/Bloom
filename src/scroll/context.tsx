/**
 * The provider and context both platform barrels share.
 *
 * Nothing here is platform-specific: the provider holds an offset store and the
 * router adapter, and that composition is identical on web and native. Keeping
 * it in one module also guarantees ONE context identity — a provider mounted
 * from the native barrel and a hook imported from the web barrel would
 * otherwise read two different contexts and the hook would throw.
 */
import { createContext, useContext, useEffect, useMemo } from 'react';

import { ScrollOffsetStore } from './store';
import type {
  ScrollRestorationProviderProps,
  ScrollRouterAdapter,
} from './types';

export interface ScrollRestorationContextValue {
  store: ScrollOffsetStore;
  adapter: ScrollRouterAdapter;
}

const ScrollRestorationContext =
  createContext<ScrollRestorationContextValue | null>(null);
ScrollRestorationContext.displayName = 'BloomScrollRestorationContext';

/**
 * Holds the offset map and the router binding for the subtree. One provider
 * near the app root is enough; the store lives as long as the provider, so
 * offsets survive navigating away and back (including browser Back/Forward).
 */
export function ScrollRestorationProvider({
  children,
  adapter,
}: ScrollRestorationProviderProps) {
  const store = useMemo(() => new ScrollOffsetStore(), []);
  const value = useMemo(() => ({ store, adapter }), [store, adapter]);

  useManualBrowserScrollRestoration();

  return (
    <ScrollRestorationContext.Provider value={value}>
      {children}
    </ScrollRestorationContext.Provider>
  );
}

export function useScrollRestorationContext(): ScrollRestorationContextValue {
  const value = useContext(ScrollRestorationContext);
  if (value === null) {
    throw new Error(
      'useScrollRestoration must be used within a <ScrollRestorationProvider>.',
    );
  }
  return value;
}

/**
 * Take over scroll restoration from the browser for as long as this provider is
 * mounted, and hand it back both on unmount and on `pagehide`.
 *
 * The browser's default `'auto'` restoration fights our restore on
 * Back/Forward, so it has to be turned off — but only while something is
 * actually going to restore instead. Two moments where that stops being true:
 *
 *  - **Unmount.** This used to run at MODULE scope, which meant merely
 *    importing the module disabled the browser's own restoration. Now that the
 *    core is importable by apps that mount no provider (and by SSR and Node
 *    tooling), that would have left those apps with neither restoration. Tying
 *    the switch to the provider's lifetime makes it describe exactly the period
 *    during which a replacement exists. The provider mounts at the app root on
 *    the first commit, which is before any navigation can create a history
 *    entry, so nothing is lost by not doing it at module scope.
 *  - **`pagehide`.** The offset map lives in memory only. A reload starts with
 *    an empty one, and a bfcache restore resumes a document whose provider is
 *    already mounted and whose focus effects therefore never re-run — so in
 *    both cases `'manual'` means NOBODY restores. Handing the mode back to the
 *    browser on the way out lets it do the job we are no longer able to.
 *    (react-router does exactly this, for the same reason.)
 *
 * The feature detect is also the platform test — `history` exists on web and
 * nowhere else — so this stays one implementation rather than a fork. On React
 * Native and during SSR it is a no-op.
 */
function useManualBrowserScrollRestoration(): void {
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof history === 'undefined' ||
      !('scrollRestoration' in history)
    ) {
      return undefined;
    }
    const previous = history.scrollRestoration;
    history.scrollRestoration = 'manual';

    const handBackToBrowser = () => {
      history.scrollRestoration = 'auto';
    };
    window.addEventListener('pagehide', handBackToBrowser);

    return () => {
      window.removeEventListener('pagehide', handBackToBrowser);
      history.scrollRestoration = previous;
    };
  }, []);
}
