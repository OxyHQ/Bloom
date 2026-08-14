/**
 * Derived from sonner-native v0.26.4 — src/positioner.tsx
 * (MIT © Gunnar Torfi Steinarsson). See the top-level NOTICE.
 *
 * One container per occupied position, plus the press-to-collapse area outside an
 * expanded stack. The container pins all four edges and `getInsetValues` overrides
 * just the anchored one, so it always has a real height and the rows inside it —
 * which are absolutely positioned — are never laid out out of bounds. See
 * `getContainerStyle` for what a zero-height container did to Android.
 *
 * `position: 'absolute'` is correct on BOTH platforms and this file stays fully
 * universal: `ToastHost` supplies a viewport-sized containing block on web, so
 * there is no `.web` fork and no `position: 'fixed'` here (W7).
 *
 * `pointerEvents` goes on the PROP, never in `style`: react-native-web resolves
 * the RN-only `box-none` value only from the prop path, so as a style entry it
 * is silently dropped and this full-host container inherits `auto` — a
 * transparent sheet over the whole app that swallows every tap for as long as a
 * toast is up. RNW logs a deprecation notice for the prop once per session;
 * that is the cheaper of the two.
 */
import * as React from 'react';
import { Platform, Pressable, View } from 'react-native';
import {
  SafeAreaInsetsContext,
  initialWindowMetrics,
} from 'react-native-safe-area-context';

import { useDynamicToastContext, useToastContext } from './context';
import {
  calculateOutsidePressableArea,
  getContainerStyle,
  getInsetValues,
} from './container-geometry';
import type { ToasterProps } from './types';

/**
 * Web `initialWindowMetrics` is `null`, and on native it is null until the
 * provider measures — both fall back to zero insets, which `getInsetValues` then
 * turns into its 16px default.
 */
const FALLBACK_INSETS = initialWindowMetrics?.insets ?? {
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
};

/**
 * Without elevation the positioner can render behind sibling react-native-screens
 * surfaces (native-stack, bottom-tabs) on Android, hiding toasts entirely. Kept
 * alongside the `zIndex` the host applies, because Android orders those native
 * siblings by elevation.
 */
const ANDROID_ELEVATION = 9999;
const androidElevationStyle =
  Platform.OS === 'android' ? { elevation: ANDROID_ELEVATION } : null;

export const Positioner: React.FC<
  React.PropsWithChildren<Pick<ToasterProps, 'position' | 'style'>>
> = ({ children, position, style }) => {
  const { offset, gap, visibleToasts } = useToastContext();
  const { isExpanded, collapse, toastHeights } = useDynamicToastContext();
  const insets = React.useContext(SafeAreaInsetsContext) ?? FALLBACK_INSETS;

  const resolvedPosition = position ?? 'bottom-center';
  const insetValues = getInsetValues({
    position: resolvedPosition,
    offset,
    safeAreaInsets: { top: insets.top, bottom: insets.bottom },
  });

  const handleOutsidePress = React.useCallback(() => {
    if (isExpanded) {
      collapse();
    }
  }, [isExpanded, collapse]);

  // Collapsing by pressing outside only makes sense for an anchored stack.
  const shouldAllowCollapse = resolvedPosition !== 'center' && isExpanded;
  const hasChildren = React.Children.count(children) > 0;

  return (
    <>
      {shouldAllowCollapse ? (
        <Pressable
          style={[
            calculateOutsidePressableArea({
              position: resolvedPosition,
              toastHeights,
              gap,
              visibleToasts,
              insetValues,
            }),
            androidElevationStyle,
          ]}
          onPress={handleOutsidePress}
        />
      ) : null}
      <View
        style={[
          getContainerStyle(),
          androidElevationStyle,
          // Overrides ONE edge of the four `getContainerStyle` pins, so the box
          // keeps a real height and the rows inside it stay in bounds.
          insetValues,
          style,
        ]}
        // This container spans the whole host, so it must never swallow a touch.
        // `box-none` passes presses through to the app while still reaching the
        // rows; an EMPTY one on Android drops to `none` outright, because the
        // outlet's configured position always renders a container even with no
        // rows in it (see `Toaster`'s grouping).
        pointerEvents={Platform.OS === 'android' && !hasChildren ? 'none' : 'box-none'}
      >
        {children}
      </View>
    </>
  );
};

Positioner.displayName = 'ToastPositioner';
