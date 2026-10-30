import { BloomScope } from '../appearance/BloomScope';
import { ScreenHostContext, ScreenViewportContext } from '../screen/context';
import { ScreenContext, ScreenNavigationContext } from '../screen/context';
/**
 * A surface that is its OWN screen, for the two contracts that are screen-scoped.
 *
 * ## What goes wrong without it
 *
 * `top-edge.tsx` and `scroll-offset.ts` are per-SCREEN by design: one registry
 * of what is parked at the top, one scroller that the chrome follows. A modal,
 * a bottom sheet or a detail panel is a second screen drawn over the first, and
 * both contracts reach into it from outside:
 *
 *   - A header inside a full-screen dialog CLAIMS the top edge of the screen
 *     underneath it. The claim combines with `max`, so the page behind the modal
 *     is padded for a header it cannot see — and when the modal closes the claim
 *     unregisters, so the padding appears and disappears with the modal.
 *   - Chrome inside the sheet READS the page's scroll offset and follows a
 *     scroller the user is not touching. The sheet's own list scrolls and the
 *     sheet's header does not react; the page behind scrolls and it does.
 *
 * Neither throws, neither warns, and both look like layout decisions.
 *
 * ## What it does
 *
 * Nests a fresh `TopEdgeProvider` (an empty registry the surface's own chrome
 * claims against) and publishes a `null` scroll offset, which is the honest
 * value: nothing inside has said which scroller it owns yet. A scroll owner
 * INSIDE the surface publishes its own offset in the ordinary way and wins,
 * because it is nearer.
 *
 * The BOTTOM edge is scoped too, and for the same reason read from the other
 * side: the bottom edge is the tab bar and the FAB, and a sheet covers both. A
 * form inside a sheet that padded itself for a tab bar it is drawn over ends in
 * a band of empty space.
 *
 * It is not the window's corner either: a `Screen` inside draws no window
 * controls and keeps no room for them, unless its host hands it the window's
 * chrome inside the scope (a panel along the window's top edge).
 *
 * Bloom's own overlay surfaces mount it (`DialogBody`, `BottomSheetBase`), so a
 * consumer gets this by using them. It is exported for a surface Bloom does not
 * own — an app's own full-screen route presented over another.
 */
import { useContext, type PropsWithChildren } from 'react';

import { BottomEdgeProvider } from './bottom-edge';
import { ScrollMetricsContext } from './scroll-metrics';
import { ScrollOffsetProvider } from './scroll-offset';
import { TopEdgeProvider } from './top-edge';
import { WindowChromeProvider, WindowCornerProvider } from '../window/context';

export function ScreenScope({
  children,
  inheritBottomEdge = false,
  inheritNavigation = false,
  sizing,
}: PropsWithChildren<{
  inheritBottomEdge?: boolean;
  /** Keep the enclosing navigation motion (a panel the shell's bottom bar follows). */
  inheritNavigation?: boolean;
  sizing?: 'content' | 'fill';
}>) {
  const navigation = useContext(ScreenNavigationContext);
  return (
    <ScreenHostContext.Provider
      value={{ active: true, kind: 'element', restoreScroll: false, sizing }}
    >
      <ScreenViewportContext.Provider value={null}>
        <ScreenContext.Provider value={null}>
          <ScreenNavigationContext.Provider value={inheritNavigation ? navigation : null}>
            <TopEdgeProvider>
              <BottomEdgeProvider inherit={inheritBottomEdge}>
                {/* null means no scroller has claimed this scope yet. */}
                <ScrollMetricsContext.Provider value={null}>
                  <ScrollOffsetProvider value={null}>
                    <WindowCornerProvider value>
                      <WindowChromeProvider value={null}>
                        <BloomScope controlDensity="default">{children}</BloomScope>
                      </WindowChromeProvider>
                    </WindowCornerProvider>
                  </ScrollOffsetProvider>
                </ScrollMetricsContext.Provider>
              </BottomEdgeProvider>
            </TopEdgeProvider>
          </ScreenNavigationContext.Provider>
        </ScreenContext.Provider>
      </ScreenViewportContext.Provider>
    </ScreenHostContext.Provider>
  );
}
