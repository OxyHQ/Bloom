/**
 * `BloomProvider` — the ONE Bloom root an app mounts.
 *
 * Bloom's app-wide state used to be a handful of separate providers that every
 * consumer wired by hand (theme, haptics, image resolution, scroll restoration,
 * tab-bar minimize progress). Mounting them separately means each one can end
 * up at a different depth, and a provider mounted too low fails in ways that
 * are hard to trace:
 *
 *   - `useScrollRestoration()` THROWS on web outside `ScrollRestorationProvider`,
 *     so any scrollable rendered beside the provider (a right rail, an overlay)
 *     crashes the screen.
 *   - `useMinimizeState()` silently hands each caller a private fallback, so a
 *     tab bar below the provider just never minimizes — no error anywhere.
 *
 * Mounting this single provider at the app root makes both classes of mistake
 * impossible: everything Bloom renders is under all of them, at the same depth.
 * Nesting extra contexts costs nothing at runtime — the win is that scope is no
 * longer a per-app decision.
 *
 * EXPO/EXPO-ROUTER APPS ONLY, and now for one narrow reason: it binds the
 * scroll store to the expo-router ADAPTER, which is the only module in the
 * scroll primitive that imports `expo-router`. The scroll core itself is
 * router-agnostic, so a Vite/SPA consumer can mount
 * `<ScrollRestorationProvider adapter={...}>` from `@oxyhq/bloom/scroll` with
 * an adapter for its own router — alongside `BloomThemeProvider` and whatever
 * else it needs — rather than going without.
 *
 * NOT included, on purpose — these are OUTLETS, not state, and their placement
 * in the tree is a real app decision (z-order, safe areas, and mounting a
 * second one duplicates every surface it renders):
 * `<ToastOutlet>`, `<PortalProvider>`/`<PortalOutlet>`, `<SurfaceHost>`.
 */
import type { ReactNode } from 'react';

import { ImageResolverProvider, type ImageResolver } from '../image-resolver';
import { BloomHapticsProvider } from '../hooks/use-haptics';
import { TabBarMinimizeProvider } from '../tab-bar/context';
import { BloomThemeProvider, type BloomThemeProviderProps } from '../theme';
import { ScrollRestorationProvider } from '../scroll/context';
import { expoRouterScrollAdapter } from '../scroll/expo-router';
import type { BloomProviderProps } from './types';

export function BloomProvider({
  children,
  imageResolver,
  haptics = true,
  ...themeProps
}: BloomProviderProps) {
  return (
    // `value` is passed unconditionally (null when unset) so toggling a resolver
    // never changes the tree shape and remounts everything below it.
    <ImageResolverProvider value={imageResolver ?? null}>
      <BloomThemeProvider {...themeProps}>
        <ScrollRestorationProvider adapter={expoRouterScrollAdapter}>
          <BloomHapticsProvider enabled={haptics}>
            <TabBarMinimizeProvider>{children}</TabBarMinimizeProvider>
          </BloomHapticsProvider>
        </ScrollRestorationProvider>
      </BloomThemeProvider>
    </ImageResolverProvider>
  );
}

BloomProvider.displayName = 'BloomProvider';
