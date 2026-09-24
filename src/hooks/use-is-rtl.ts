import { useSyncExternalStore } from 'react';
import { I18nManager, Platform } from 'react-native';

import type { FloatingAlign, FloatingSide } from '../floating/types';

/**
 * Whether the layout around the caller is mirrored (right-to-left), read from
 * the SAME place each platform's layout engine reads it, so a sign computed
 * from it agrees with the flex order and the logical insets by construction:
 *
 *   web     `document.documentElement.dir === 'rtl'`, observed live — an app
 *           that switches language sets `dir` on `<html>` and every caller
 *           re-renders. Bloom never writes `dir` itself.
 *   native  `I18nManager.isRTL`. `I18nManager.forceRTL` takes effect on the
 *           NEXT launch (a running app cannot mirror itself), so the value is
 *           constant for the process and the subscription never fires.
 *
 * It exists for what logical style keys CANNOT express: a `translateX` sign, a
 * `transformOrigin`, a floating `side`. Insets use the `*InlineStart`/
 * `*InlineEnd` keys instead, with `useDirectionProps()` on the root on web.
 *
 * `useSyncExternalStore`, not a read in render: both sources are external
 * mutable state, and the sign has to be settled before the first paint rather
 * than one effect later. The server snapshot is left-to-right — a statically
 * exported shell has no `dir` yet.
 */
export function useIsRtl(): boolean {
  const web = Platform.OS === 'web';
  return useSyncExternalStore(
    web ? subscribeToDocumentDirection : subscribeToNothing,
    web ? readDocumentDirection : readNativeDirection,
    readServerDirection,
  );
}

function subscribeToNothing(): () => void {
  return () => {};
}

function readNativeDirection(): boolean {
  return I18nManager?.isRTL === true;
}

function readServerDirection(): boolean {
  return false;
}

function subscribeToDocumentDirection(onChange: () => void): () => void {
  // No DOM (static export under Node) or no observer (a bare DOM shim): nothing
  // can change during that render, and the first client render subscribes.
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return () => {};
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['dir'] });
  return () => observer.disconnect();
}

function readDocumentDirection(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.dir === 'rtl';
}

/**
 * Floating surfaces (`side`, `align`) are PHYSICAL — `'right'` is the right of
 * the viewport, and under a vertical side `'end'` is the right edge of the
 * anchor. A caller that means "beside the trailing edge" mirrors them here.
 */
export function mirrorSide(side: FloatingSide, rtl: boolean): FloatingSide {
  if (!rtl) return side;
  return side === 'left' ? 'right' : side === 'right' ? 'left' : side;
}

/** The horizontal `align` under a `top`/`bottom` side; a no-op otherwise. */
export function mirrorAlign(align: FloatingAlign, side: FloatingSide, rtl: boolean): FloatingAlign {
  if (!rtl || (side !== 'top' && side !== 'bottom')) return align;
  return align === 'start' ? 'end' : align === 'end' ? 'start' : align;
}

const RTL_DIR = { dir: 'rtl' } as const;
const NO_DIR = {} as const;

/**
 * Props that hand the document's direction to react-native-web — spread them on
 * the ROOT view of anything using logical insets.
 *
 * react-native-web does NOT resolve `paddingInlineStart`/`insetInlineEnd`/
 * `borderEndWidth` against `<html dir>`. Its inline and atomic style paths both
 * rewrite them to PHYSICAL properties against its own direction context, which
 * only a `dir` (or `lang`) prop on an ancestor `View` sets and which otherwise
 * defaults to left-to-right. Without this the flex rows mirror (CSS `direction`
 * inherits from `<html>`) while every logical inset stays on the left — half a
 * mirror. Measured on react-native-web 0.21.2: `StyleSheet([{ insetInlineStart:
 * 0 }])` resolves to `left: 0px` with no context.
 *
 * Reanimated's web writer bypasses that rewrite and sets the CSS logical
 * property itself, which then follows the DOM `dir` this also sets — so the first
 * paint and every animated frame agree. Web only; native Yoga reads
 * `I18nManager` directly and has no `dir` prop.
 */
export function useDirectionProps(): { dir?: 'rtl' } {
  const rtl = useIsRtl();
  return Platform.OS === 'web' && rtl ? RTL_DIR : NO_DIR;
}
