/**
 * Bloom-original — the WEB / default toast host. Metro selects
 * `ToastHost.native.tsx` on iOS and Android; every other bundler (and a
 * consumer's `tsc`) sees this file, matching the `.native` split convention
 * `design-tokens/shadows.ts` already uses.
 *
 * Two jobs, both of which are why the rest of the engine can stay universal:
 *
 *  - W7: it portals into `#bloom-portal-root` and provides a `position: fixed`,
 *    full-viewport containing block. `Positioner`'s `position: 'absolute'` would
 *    otherwise anchor to the nearest positioned ancestor — react-native-web's
 *    `View` defaults to `relative`, so a deeply-mounted outlet would anchor to a
 *    provider somewhere in the tree instead of the viewport. A `Positioner.web`
 *    with `position: fixed` would NOT be enough: `fixed` is still contained by any
 *    ancestor `transform`/`filter`/`contain`, which is exactly why `Dialog` and
 *    `BottomSheet` portal too. Sharing the one portal root also keeps a single
 *    document-level overlay layer rather than a second competing one.
 *  - W8: portaled content sits outside the app-root `GestureHandlerRootView`, so
 *    swipe-to-dismiss would never receive touches. This provides its own, exactly
 *    as `bottom-sheet/index.web.tsx` does. Web consumers need no setup.
 *
 * `pointerEvents: 'box-none'` keeps the empty area click-through while the rows
 * themselves stay interactive.
 */
import * as React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Portal } from '../portal/index.web';
import { WEB_POSITION_FIXED } from '../styles/web-view-style';
import { Z_INDEX } from '../styles/z-index';
import type { ToastHostProps } from './types';

export function ToastHost({ children, ToasterOverlayWrapper }: ToastHostProps) {
  const content = (
    <GestureHandlerRootView style={styles.host}>
      {children}
    </GestureHandlerRootView>
  );

  return (
    <Portal>
      {ToasterOverlayWrapper ? (
        <ToasterOverlayWrapper>{content}</ToasterOverlayWrapper>
      ) : (
        content
      )}
    </Portal>
  );
}

ToastHost.displayName = 'ToastHost';

const styles = StyleSheet.create({
  host: {
    // Full-viewport containing block for `Positioner`'s `position: 'absolute'`.
    position: WEB_POSITION_FIXED,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Inside `#bloom-portal-root` (which owns the document layer at 999999),
    // this keeps toasts above Dialog's surface (60) and tooltips (70).
    zIndex: Z_INDEX.toast,
    pointerEvents: 'box-none',
  },
});
