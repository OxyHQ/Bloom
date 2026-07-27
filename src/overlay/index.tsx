/**
 * The shared plumbing every portaled surface needs: an interactive ROOT and a
 * press-to-dismiss BACKDROP. Dialog, BottomSheet, the image gallery, menus and
 * toasts each used to hand-roll both, and each one got the web contract subtly
 * wrong in its own way.
 *
 * ## The contract these two components encode
 *
 * Bloom's web `Portal` renders into `#bloom-portal-root`, which is
 * `position: fixed; inset: 0; pointer-events: none` — an idle portal must let
 * clicks reach the app underneath. `pointer-events` INHERITS in CSS, so every
 * portaled descendant starts out click-through and has to opt back in.
 *
 * The opt-in only works through the `pointerEvents` **prop**. Passing it inside
 * a `style` object (`style={{ pointerEvents: 'box-none' }}`) does NOT reach the
 * DOM: react-native-web resolves the RN-only `box-none`/`box-only` values in
 * `createDOMProps`, mapping the PROP onto its own class pair
 * (`self { none !important }` + `> * { auto }`), while a style-object value is
 * not valid CSS and is dropped. `pointerEvents: 'auto'`/`'none'` do survive as
 * styles, which is what makes this so easy to get wrong — the two RN-only
 * values silently do nothing. The symptom is brutal and silent: the whole
 * surface — backdrop AND panel — renders perfectly and is completely
 * click-through. Backdrop taps don't dismiss, buttons don't press, and the
 * clicks land on whatever is behind the overlay (so a tap "through" a viewer
 * navigates the page underneath). Only keyboard paths (Escape) keep working,
 * which is what makes it look like a dismissal bug rather than a hit-testing
 * one.
 *
 * Use `<OverlayRoot>` for the surface's outermost node and `<Backdrop>` for its
 * dimming layer; do not re-implement either with raw `View`s.
 */
import { memo, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { WEB_POSITION_FIXED } from '../styles/web-view-style';

export interface OverlayRootProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Outermost node of a portaled surface. Fills the viewport and re-enables
 * pointer events for its own children while empty gaps stay click-through
 * (`box-none`), so a surface that only covers part of the screen never steals
 * clicks from the app behind it.
 */
export function OverlayRoot({ children, style, testID }: OverlayRootProps) {
  return (
    <View pointerEvents="box-none" style={[styles.root, style]} testID={testID}>
      {children}
    </View>
  );
}

OverlayRoot.displayName = 'OverlayRoot';

export interface BackdropProps {
  /** Dismiss handler. Omit (or pass `disabled`) for a backdrop that only dims. */
  onPress?: () => void;
  /** `true` keeps the dim but makes it inert — a blocking dialog, a busy state. */
  disabled?: boolean;
  /** Extra style (dim colour, animated opacity). Rendered over `absoluteFill`. */
  style?: StyleProp<ViewStyle>;
  /** Rendered inside the backdrop — e.g. a blur layer that must dim with it. */
  children?: ReactNode;
  accessibilityLabel?: string;
  testID?: string;
}

/**
 * Full-bleed dimming layer that dismisses the surface when pressed. Always
 * takes pointer events (that is its whole job), so it must render UNDER the
 * surface's panel in the tree, never over it.
 */
export const Backdrop = memo(function Backdrop({
  onPress,
  disabled = false,
  style,
  children,
  accessibilityLabel = 'Dismiss',
  testID,
}: BackdropProps) {
  const inert = disabled || !onPress;
  return (
    <Pressable
      pointerEvents="auto"
      onPress={inert ? undefined : onPress}
      disabled={inert}
      // A dimming layer is not a focus stop on web: Escape and the panel's own
      // controls are the keyboard paths out. It stays labelled for screen
      // readers that surface it as the dismiss affordance.
      focusable={false}
      accessibilityRole={inert ? undefined : 'button'}
      accessibilityLabel={inert ? undefined : accessibilityLabel}
      testID={testID}
      style={[StyleSheet.absoluteFill, style]}
    >
      {children}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  root: {
    // Web: the portal root is `fixed; inset: 0`, but a plain absolute child of
    // it anchors to the document flow in some browsers once the page scrolls —
    // pin this box to the viewport itself. Native: absolute fill inside the
    // Outlet, which is already full-screen.
    ...(Platform.OS === 'web'
      ? { position: WEB_POSITION_FIXED, top: 0, left: 0, right: 0, bottom: 0 }
      : StyleSheet.absoluteFillObject),
  },
});
