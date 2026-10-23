/**
 * The native status bar's content style, owned by Bloom so no app renders its
 * own.
 *
 * The rule is the theme's: light content over a dark appearance, dark content
 * over a light one. `BloomProvider` mounts the ONE owner, which follows the app
 * theme. A `Screen` whose resolved appearance differs from the app's (a reel in
 * `BloomColorScope mode="dark"` inside a light app) claims its own content while
 * it is active and releases it when it deactivates; the latest live claim wins.
 * Screens that match the app claim nothing, so a light list beside a dark reel
 * can never take the bar back from it.
 *
 * It renders React Native's own `StatusBar` (`expo-status-bar` is a wrapper
 * around the same component), so there is no optional peer to install. Its stack
 * merges entries in mount order: this one mounts with the provider, so a status
 * bar an app still renders below it overrides Bloom until the app drops it.
 *
 * Web renders nothing: the browser chrome follows the `theme-color` meta that
 * `apply-dark-class.ts` already keeps in step with the theme.
 */
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { Platform, StatusBar } from 'react-native';

import { useLatestClaim, type Claim } from '../hooks/use-latest-claim';
import { BloomThemeContext } from './BloomThemeProvider';

type StatusBarContent = 'light' | 'dark';

interface StatusBarOwner {
  /** The content the app theme asks for. */
  root: StatusBarContent;
  claim: Claim<StatusBarContent>;
}

const StatusBarOwnerContext = createContext<StatusBarOwner | null>(null);

/** The content the nearest theme or scope asks for. */
function useThemeContent(): StatusBarContent {
  return useContext(BloomThemeContext)?.theme.isDark ? 'light' : 'dark';
}

export function SystemStatusBar({ children }: { children: ReactNode }) {
  const root = useThemeContent();
  const [claimed, claim] = useLatestClaim<StatusBarContent>();
  const owner = useMemo(() => (Platform.OS === 'web' ? null : { root, claim }), [root, claim]);
  return (
    <StatusBarOwnerContext.Provider value={owner}>
      {owner ? <StatusBar barStyle={`${claimed ?? root}-content`} animated /> : null}
      {children}
    </StatusBarOwnerContext.Provider>
  );
}

/**
 * While `active`, claim the status bar content of the caller's resolved
 * appearance when it differs from the app theme's. A no-op on web and outside
 * `BloomProvider`.
 */
export function useStatusBarClaim(active: boolean): void {
  const owner = useContext(StatusBarOwnerContext);
  const content = useThemeContent();
  useEffect(() => {
    if (active && owner && content !== owner.root) return owner.claim(content);
  }, [active, owner, content]);
}
