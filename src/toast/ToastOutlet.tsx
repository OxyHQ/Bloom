import * as React from 'react';

import { Toaster } from './Toaster';
import type { ToasterProps } from './types';

/**
 * The toast stack. Mount this ONCE near the app root — `OxyProvider` already
 * does, so most apps never write it themselves.
 *
 * Every default (position, swipe direction, offset, gap, `visibleToasts`,
 * duration, pause-when-hidden) comes from `toastDefaults`, which `Toaster`
 * applies; passing a prop here overrides exactly that one.
 *
 * ```tsx
 * <ToastOutlet />
 * <ToastOutlet position="top-center" visibleToasts={5} />
 * ```
 *
 * On iOS a toast that must appear above a native modal needs the overlay host
 * injected — Bloom does not depend on `react-native-screens` itself:
 *
 * ```tsx
 * import { FullWindowOverlay } from 'react-native-screens';
 * <ToastOutlet ToasterOverlayWrapper={FullWindowOverlay} />
 * ```
 */
export function ToastOutlet(props: ToasterProps) {
  return <Toaster {...props} />;
}

ToastOutlet.displayName = 'ToastOutlet';
