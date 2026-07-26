/**
 * Bloom-original — the NATIVE toast host. Metro selects this file; every other
 * bundler resolves the sibling `ToastHost.tsx` (web/default).
 *
 * On native the rows render inline in the app's own view hierarchy, which is what
 * makes them respect the safe area and the app-root `GestureHandlerRootView` that
 * consumers already mount. So there is nothing to portal — the host only applies
 * the optional overlay wrapper.
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
import * as React from 'react';

import type { ToastHostProps } from './types';

export function ToastHost({ children, ToasterOverlayWrapper }: ToastHostProps) {
  if (ToasterOverlayWrapper) {
    return <ToasterOverlayWrapper>{children}</ToasterOverlayWrapper>;
  }
  return <>{children}</>;
}

ToastHost.displayName = 'ToastHost';
