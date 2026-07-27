/**
 * The shared plumbing every portaled surface needs: an interactive ROOT and a
 * press-to-dismiss BACKDROP. Dialog, BottomSheet, the image gallery, menus and
 * toasts each used to hand-roll both, and each one got the web contract subtly
 * wrong in its own way — and looked different while doing it (the image viewer
 * blurred, everything else only dimmed).
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
 * A backdrop also only dismisses what is actually ON TOP of it: a full-screen
 * layer rendered ABOVE the backdrop (a pager, a zoom container) receives the
 * press first and swallows it. Either that layer opts out (`pointerEvents
 *="box-none"`) or it owns the dismiss itself — the backdrop being present is
 * not enough.
 *
 * EXPO/EXPO-ROUTER APPS ONLY for `BloomProvider` — see `src/provider`; these
 * two components are universal.
 *
 * Use `<OverlayRoot>` for the surface's outermost node and `<Backdrop>` for its
 * dimming layer; do not re-implement either with raw `View`s.
 */
import { memo, type ReactNode } from 'react';
import { BlurView } from 'expo-blur';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { WEB_POSITION_FIXED } from '../styles/web-view-style';

/**
 * One blur radius for every Bloom overlay. Surfaces differ in what they show,
 * not in how the app behind them recedes.
 */
export const BACKDROP_BLUR_INTENSITY = 40;
/** Dim laid over the blur — the blur alone does not give enough contrast. */
export const BACKDROP_DIM_OPACITY = 0.45;

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
  /** Blur radius behind the dim. `0` renders the dim alone. */
  blurIntensity?: number;
  /** Blur tint. Backdrops dim the app, so `dark` is the default on every theme. */
  blurTint?: 'light' | 'dark' | 'default';
  /** Dim colour over the blur. */
  dimColor?: string;
  /** Dim opacity, 0–1. */
  dimOpacity?: number;
  /** Extra style on the press target — animated opacity, insets, z-index. */
  style?: StyleProp<ViewStyle>;
  /** Rendered ON TOP of the dim, inside the press target (Dialog's panel does this). */
  children?: ReactNode;
  accessibilityLabel?: string;
  testID?: string;
}

/**
 * Full-bleed blur + dim that dismisses the surface when pressed. Always takes
 * pointer events (that is its whole job), so anything that must stay pressable
 * goes INSIDE it as `children`, never as a sibling rendered over it.
 */
export const Backdrop = memo(function Backdrop({
  onPress,
  disabled = false,
  blurIntensity = BACKDROP_BLUR_INTENSITY,
  blurTint = 'dark',
  dimColor = '#000',
  dimOpacity = BACKDROP_DIM_OPACITY,
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
      {blurIntensity > 0 ? (
        <BlurView
          intensity={blurIntensity}
          tint={blurTint}
          // Android's default blur is a no-op on many devices; this is the
          // implementation that actually renders there.
          experimentalBlurMethod="dimezisBlurView"
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: dimColor, opacity: dimOpacity }]}
      />
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
    // `absoluteFillObject` was removed in RN 0.85 — the inset is written out.
    position: Platform.OS === 'web' ? WEB_POSITION_FIXED : 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
