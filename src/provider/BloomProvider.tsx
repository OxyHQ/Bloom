/** Universal application state. Supply scrollAdapter explicitly to enable router restoration.
 * Visual outlets remain owned by the app's composition to avoid duplicate hosts.
 */
import type { ReactNode } from 'react';

import { GlassBlurTargetProvider } from '../glass/blur-target';
import { TopEdgeProvider } from '../layout/top-edge';
import { BottomEdgeProvider } from '../layout/bottom-edge';
import { ImageResolverProvider, type ImageResolver } from '../image-resolver';
import { BloomHapticsProvider } from '../hooks/use-haptics';
import { TabBarMinimizeProvider } from '../tab-bar/context';
import { BloomThemeProvider, type BloomThemeProviderProps } from '../theme';
import { ScrollRestorationProvider } from '../scroll/context';
import { useEffect } from 'react';
import type { ScrollRouterAdapter } from '../scroll/types';

// Stable inert adapter keeps root composition universal; routing is explicit.
const noRouterAdapter: ScrollRouterAdapter = {
  useScreenContentId: () => null,
  useScreenFocusEffect: effect => useEffect(effect, [effect]),
};
import type { BloomProviderProps } from './types';

export function BloomProvider({
  children,
  imageResolver,
  haptics = true,
  scrollAdapter = noRouterAdapter,
  ...themeProps
}: BloomProviderProps) {
  return (
    // `value` is passed unconditionally (null when unset) so toggling a resolver
    // never changes the tree shape and remounts everything below it.
    <ImageResolverProvider value={imageResolver ?? null}>
      <BloomThemeProvider {...themeProps}>
        <ScrollRestorationProvider adapter={scrollAdapter}>
          <BloomHapticsProvider enabled={haptics}>
            {/*
              A PROVIDER, not an outlet, and the distinction is the one this
              component's exclusion list encodes. Outlets stay out because a
              second mount duplicates every surface they render; this renders NO
              surface — a transparent container on Android and nothing at all
              elsewhere — so a second mount duplicates nothing, and the nearest
              one simply becomes the target for its subtree. Nor is its position
              an app decision the way an outlet's is: it has no z-order and no
              insets, and it must WRAP the content, which is exactly what this
              provider already does with `children`.
            */}
            <GlassBlurTargetProvider>
              {/*
                The bottom edge's claim registry. Also a provider, not an outlet:
                it renders nothing and holds only the set of surfaces currently
                parked at the bottom edge, so a tab bar can publish its footprint
                and a FAB or a toast stack can read it without either importing
                the other.
              */}
              <BottomEdgeProvider>
                <TopEdgeProvider><TabBarMinimizeProvider>{children}</TabBarMinimizeProvider></TopEdgeProvider>
              </BottomEdgeProvider>
            </GlassBlurTargetProvider>
          </BloomHapticsProvider>
        </ScrollRestorationProvider>
      </BloomThemeProvider>
    </ImageResolverProvider>
  );
}

BloomProvider.displayName = 'BloomProvider';
