/**
 * Bloom-original — the NATIVE toast host. Metro selects this file; every other
 * bundler resolves the sibling `ToastHost.tsx` (web/default).
 *
 * On native the rows render inline in the app's own view hierarchy, which is what
 * makes them respect the safe area and the app-root `GestureHandlerRootView` that
 * consumers already mount. So there is nothing to portal.
 *
 * THE TOAST LAYER IS STILL A LAYER OF ITS OWN: the same pinned `OverlayRoot` at
 * `TOAST_LAYER_Z` the web host portals. Rendered bare, the rows' own stacking
 * (`ToastRow`'s negative `zIndex`, which puts the front row on top) escaped into
 * the APP's stacking context: `Positioner`'s container paints nothing, so Fabric
 * flattens it, and a row at `zIndex: -1` is then ordered against the app's own
 * views and drawn beneath them. Behind a screen with a background the toast was
 * invisible, though its text was in the accessibility tree (OxyOS's fidelity
 * gallery, page 8). An absolute view with a `zIndex` forms a stacking context,
 * so the rows order among themselves inside it, and the layer itself sits above
 * the app as it does on the web. Gate: `ToastHostWebFork.test.ts`.
 *
 * `react-native-screens` is deliberately NOT imported (D6). Upstream statically
 * imports `FullWindowOverlay` from it, an undeclared dependency that only works
 * because apps happen to install it. A consumer who needs a toast above a native
 * iOS modal injects it themselves:
 *
 * ```tsx
 * import { FullWindowOverlay } from 'react-native-screens';
 * <ToastOutlet ToasterOverlayWrapper={FullWindowOverlay} />
 * ```
 */

import { OverlayRoot, TOAST_LAYER_Z } from '../overlay';
import type { ToastHostProps } from './types';

export function ToastHost({ children, ToasterOverlayWrapper }: ToastHostProps) {
  const content = <OverlayRoot zIndex={TOAST_LAYER_Z}>{children}</OverlayRoot>;
  if (ToasterOverlayWrapper) {
    return <ToasterOverlayWrapper>{content}</ToasterOverlayWrapper>;
  }
  return content;
}

ToastHost.displayName = 'ToastHost';
