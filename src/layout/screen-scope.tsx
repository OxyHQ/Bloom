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
 * Bloom's own overlay surfaces mount it (`DialogBody`, `BottomSheetBase`), so a
 * consumer gets this by using them. It is exported for a surface Bloom does not
 * own — an app's own full-screen route presented over another.
 */
import type { PropsWithChildren } from 'react';

import { BottomEdgeProvider } from './bottom-edge';
import { ScrollOffsetProvider } from './scroll-offset';
import { TopEdgeProvider } from './top-edge';

export function ScreenScope({ children }: PropsWithChildren) {
  return (
    <TopEdgeProvider>
      <BottomEdgeProvider>
        {/* `null`, not a zero SharedValue: the two mean different things to the
            chrome reading it (`scroll-offset.ts`). */}
        <ScrollOffsetProvider value={null}>{children}</ScrollOffsetProvider>
      </BottomEdgeProvider>
    </TopEdgeProvider>
  );
}
