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
 * EXPO/EXPO-ROUTER APPS ONLY. The scroll-restoration provider it mounts imports
 * `expo-router` (its web implementation keys offsets on the focused route), so
 * a Vite/SPA consumer that has no expo-router cannot resolve this module. Those
 * apps keep mounting `BloomThemeProvider` (and any other piece they need)
 * directly — that is not a lesser path, just the one without a router.
 *
 * NOT included, on purpose — these are OUTLETS, not state, and their placement
 * in the tree is a real app decision (z-order, safe areas, and mounting a
 * second one duplicates every surface it renders):
 * `<ToastOutlet>`, `<Portal.Provider>`/`<Portal.Outlet>`, `<SurfaceHost>`,
 * `<BloomDialogProvider>`, `<AlertDialogHost>`.
 */
import type { ReactNode } from 'react';

import { ImageResolverProvider, type ImageResolver } from '../image-resolver';
import { BloomHapticsProvider } from '../hooks/useHaptics';
import { TabBarMinimizeProvider } from '../tab-bar/minimize-context';
import { BloomThemeProvider, type BloomThemeProviderProps } from '../theme';
import { ScrollRestorationProvider } from './scroll-provider';

export interface BloomProviderProps extends Omit<BloomThemeProviderProps, 'children'> {
  children: ReactNode;
  /**
   * Resolves bare media identifiers (Oxy file ids) to loadable URLs for every
   * Bloom surface that takes a `source` — `<Avatar>`, image galleries, cards.
   * Typically `(id, variant) => oxyServices.getFileDownloadUrl(id, variant)`.
   */
  imageResolver?: ImageResolver;
  /** `false` disables haptic feedback app-wide (honored by every `useHaptics()` call). */
  haptics?: boolean;
}

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
        <ScrollRestorationProvider>
          <BloomHapticsProvider enabled={haptics}>
            <TabBarMinimizeProvider>{children}</TabBarMinimizeProvider>
          </BloomHapticsProvider>
        </ScrollRestorationProvider>
      </BloomThemeProvider>
    </ImageResolverProvider>
  );
}

BloomProvider.displayName = 'BloomProvider';
