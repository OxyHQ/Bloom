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
import { createContext, memo, useContext, useMemo, type ReactNode } from 'react';
import { BlurView } from 'expo-blur';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { WEB_POSITION_FIXED } from '../styles/web-view-style';
import { layerForRank, type OverlayLayer } from './stack';
import { useOverlayLayer } from './use-overlay-layer';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

/**
 * The z-indices of the nearest enclosing `OverlayRoot`. Descendants that order
 * themselves within a surface (a dialog's panel above its own backdrop) read
 * this instead of picking their own numbers.
 *
 * The default is the first rank rather than 0, so a surface part rendered
 * outside any `OverlayRoot` still lands in the overlay band instead of behind
 * the app.
 */
const OverlayLayerContext = createContext<OverlayLayer>(layerForRank(1));
OverlayLayerContext.displayName = 'BloomOverlayLayerContext';

/** Z-indices of the enclosing overlay surface. See `OverlayRoot`. */
export function useOverlayLayerContext(): OverlayLayer {
  return useContext(OverlayLayerContext);
}

/**
 * One blur radius for every Bloom overlay. Surfaces differ in what they show,
 * not in how the app behind them recedes.
 */
export const BACKDROP_BLUR_INTENSITY = 80;
/**
 * Extra dim laid OVER the blur. The blur already paints its own tint wash
 * (`rgba(25,25,25,~0.62)` at the intensity above), so this is what takes the
 * total to roughly 0.72 — dark enough to read a panel against, still clearly
 * see-through. Every surface uses this one value: with each of them picking its
 * own, menus landed at ~0.83 and read as solid black next to the image viewer's
 * ~0.72.
 */
export const BACKDROP_DIM_OPACITY = 0.28;

export interface OverlayRootProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /**
   * Opt OUT of the open-order stack and pin to a fixed depth. Only the toast
   * layer does this — a notification has to stay visible over whatever is open,
   * including a surface opened after it. Everything else must leave this unset
   * so it stacks by open order; a hand-picked number here is precisely the bug
   * `./stack.ts` exists to remove.
   */
  zIndex?: number;
}

/**
 * Outermost node of a portaled surface. Three jobs:
 *
 *  - Fills the viewport.
 *  - Re-enables pointer events for its own children while empty gaps stay
 *    click-through (`box-none`), so a surface that only covers part of the
 *    screen never steals clicks from the app behind it.
 *  - Takes this surface's place in the overlay stack, so a surface opened later
 *    paints above one opened earlier (see `./stack.ts`).
 *
 * Because the rank is taken on MOUNT, this must be rendered inside whatever
 * guard makes the surface appear (`if (!isOpen) return null`), which is where
 * every Bloom surface already puts it. Descendants that need to order
 * themselves within the surface read `useOverlayLayerContext()`.
 */
export function OverlayRoot({ children, style, testID, zIndex }: OverlayRootProps) {
  // Split into two components rather than branching on the hook: a pinned root
  // must not CONSUME a rank either. The toast host is pinned and mounts for the
  // whole life of the app, so holding a rank would keep the live set permanently
  // non-empty — the counter would never reset and depths would climb for the
  // rest of the session.
  return zIndex === undefined ? (
    <StackedOverlayRoot style={style} testID={testID}>
      {children}
    </StackedOverlayRoot>
  ) : (
    <PinnedOverlayRoot zIndex={zIndex} style={style} testID={testID}>
      {children}
    </PinnedOverlayRoot>
  );
}

function StackedOverlayRoot({ children, style, testID }: Omit<OverlayRootProps, 'zIndex'>) {
  const layer = useOverlayLayer();
  return (
    <OverlayRootView layer={layer} style={style} testID={testID}>
      {children}
    </OverlayRootView>
  );
}

function PinnedOverlayRoot({
  children,
  style,
  testID,
  zIndex,
}: OverlayRootProps & { zIndex: number }) {
  // Outside the stack, so descendants must not read stack depths from it
  // either — every slot is the pinned depth.
  const layer = useMemo(
    () => ({ root: zIndex, backdrop: zIndex, surface: zIndex }),
    [zIndex],
  );
  return (
    <OverlayRootView layer={layer} style={style} testID={testID}>
      {children}
    </OverlayRootView>
  );
}

function OverlayRootView({
  children,
  style,
  testID,
  layer,
}: Omit<OverlayRootProps, 'zIndex'> & { layer: OverlayLayer }) {
  return (
    <OverlayLayerContext.Provider value={layer}>
      <View
        pointerEvents="box-none"
        style={[styles.root, { zIndex: layer.root }, style]}
        testID={testID}
      >
        {children}
      </View>
    </OverlayLayerContext.Provider>
  );
}

OverlayRoot.displayName = 'OverlayRoot';

export interface BackdropProps {
  /** Dismiss handler. Omit (or pass `disabled`) for a backdrop that only dims. */
  onPress?: () => void;
  /**
   * Fade driver, 0 (hidden) → 1 (fully shown). The backdrop applies it to its
   * OWN layers — see the note on `style` for why the caller must not animate
   * opacity from the outside.
   */
  progress?: SharedValue<number>;
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
  /**
   * Geometry for the press target: insets, layout. NOT a z-index — where this
   * surface sits relative to others is `OverlayRoot`'s call (see `./stack.ts`),
   * and within the surface the panel is simply rendered after this. NOT opacity
   * either —
   * `backdrop-filter` samples nothing under an ancestor with `opacity < 1`
   * (the group composites in isolation), so a fade applied here silently kills
   * the blur. An `opacity` found in this style is redirected onto the layers;
   * animate the fade through `progress` instead.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Extra style for the blur + dim LAYERS, for fades a shared value can't
   * express — the web dialog's CSS keyframes, for instance.
   */
  layerStyle?: StyleProp<ViewStyle>;
  /** Rendered ON TOP of the dim, as a sibling of the press target (Dialog's panel does this). */
  children?: ReactNode;
  accessibilityLabel?: string;
  testID?: string;
}

interface BackdropLayerProps {
  blurIntensity: number;
  blurTint: 'light' | 'dark' | 'default';
  dimColor: string;
  dimOpacity: number;
  /** Opacity the caller asked for, already lifted off the press target. */
  staticOpacity: number;
  layerStyle?: StyleProp<ViewStyle>;
}

/**
 * Layers fading under a shared value. Reanimated owns the opacity on both, so
 * the fade runs off the JS thread and the caller never has to animate an
 * ancestor (which would erase the blur — see `BackdropProps['style']`).
 */
function AnimatedBackdropLayers({
  progress,
  blurIntensity,
  blurTint,
  dimColor,
  dimOpacity,
  staticOpacity,
  layerStyle,
}: BackdropLayerProps & { progress: SharedValue<number> }) {
  // The fade lives on each LAYER, never on their shared ancestor.
  const blurFade = useAnimatedStyle(
    () => ({ opacity: progress.value * staticOpacity }),
    [progress, staticOpacity],
  );
  const dimFade = useAnimatedStyle(
    () => ({ opacity: progress.value * staticOpacity * dimOpacity }),
    [progress, staticOpacity, dimOpacity],
  );

  return (
    <>
      {blurIntensity > 0 ? (
        <AnimatedBlurView
          intensity={blurIntensity}
          tint={blurTint}
          // Android's default blur is a no-op on many devices; this is the
          // implementation that actually renders there.
          experimentalBlurMethod="dimezisBlurView"
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, layerStyle, blurFade]}
        />
      ) : null}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: dimColor }, layerStyle, dimFade]}
      />
    </>
  );
}

/**
 * Layers with no shared value driving them: the opacity is whatever the caller
 * asked for, and a caller that still wants movement hands a CSS transition down
 * through `layerStyle` — which is exactly what the web side sheet does, flipping
 * its own `opacity` between 0 and 1 and letting the browser interpolate.
 *
 * These MUST stay plain, non-reanimated components. On web, an animated
 * component whose style carries `transitionProperty` is routed through
 * reanimated's CSS transitions manager, which assigns straight into
 * `element.style` — where `element` is whatever ref the wrapped component
 * exposes. expo-blur's web `BlurView` exposes a `useImperativeHandle` object
 * carrying only `setNativeProps`, so there is no `.style` on it and opening the
 * surface throws `Cannot set properties of undefined (setting
 * 'transitionProperty')`. A plain layer puts the transition on the DOM node
 * itself, which is both where it belongs and the only place it works.
 */
function StaticBackdropLayers({
  blurIntensity,
  blurTint,
  dimColor,
  dimOpacity,
  staticOpacity,
  layerStyle,
}: BackdropLayerProps) {
  return (
    <>
      {blurIntensity > 0 ? (
        <BlurView
          intensity={blurIntensity}
          tint={blurTint}
          experimentalBlurMethod="dimezisBlurView"
          pointerEvents="none"
          // Opacity last, as in the animated pair: the level this component
          // resolved wins over anything `layerStyle` happens to carry.
          style={[StyleSheet.absoluteFill, layerStyle, { opacity: staticOpacity }]}
        />
      ) : null}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: dimColor },
          layerStyle,
          { opacity: staticOpacity * dimOpacity },
        ]}
      />
    </>
  );
}

/**
 * Full-bleed blur + dim that dismisses the surface when pressed.
 *
 * The dismiss target is a hit box that fills this component and sits BEHIND
 * `children`, never around them. It used to wrap them, which read fine on
 * native but is invalid on web: the hit box carries `accessibilityRole="button"`,
 * so react-native-web renders it as a real `<button>` — and every control inside
 * any Bloom surface (a dialog's own buttons, a menu's rows) became a nested
 * `<button>`. React reports that as a hydration error, and the nested control's
 * activation behaviour is undefined per the HTML spec.
 *
 * Hit testing is unchanged: the hit box still covers the whole area, `children`
 * render above it and take their own presses, and a press that lands on empty
 * space falls through to the hit box. Layout styles passed via `style` stay on
 * the outer box, so a caller that centres its panel with this component (the
 * centred dialog) keeps doing so.
 */
export const Backdrop = memo(function Backdrop({
  onPress,
  progress,
  disabled = false,
  blurIntensity = BACKDROP_BLUR_INTENSITY,
  blurTint = 'dark',
  dimColor = '#000',
  dimOpacity = BACKDROP_DIM_OPACITY,
  style,
  layerStyle,
  children,
  accessibilityLabel = 'Dismiss',
  testID,
}: BackdropProps) {
  const inert = disabled || !onPress;

  // The press target must stay a pure hit box. Two things a caller's `style`
  // can carry would break the visuals if honoured there:
  //   - `opacity`, because `backdrop-filter` samples nothing under an ancestor
  //     that composites in isolation, so the fade would erase the blur;
  //   - `backgroundColor`, which would paint an opaque sheet UNDER the blur —
  //     a second backdrop, and the reason menus and sheets rendered solid black
  //     while the image viewer (which passed no background) looked right.
  // Both are hoisted onto the layers, where they mean what the caller intended.
  const flat: ViewStyle = StyleSheet.flatten(style) ?? {};
  const { opacity: styleOpacity, backgroundColor: styleBackground, ...rootStyle } = flat;
  const staticOpacity = typeof styleOpacity === 'number' ? styleOpacity : 1;
  const resolvedDimColor = typeof styleBackground === 'string' ? styleBackground : dimColor;

  const layerProps: BackdropLayerProps = {
    blurIntensity,
    blurTint,
    dimColor: resolvedDimColor,
    dimOpacity,
    staticOpacity,
    layerStyle,
  };

  return (
    // `box-none` so this box never takes a press itself: the hit box below and
    // `children` above are what receive them.
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, rootStyle]}>
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
        style={StyleSheet.absoluteFill}
      >
        {/* Split into two components rather than branching inside one, so the
            reanimated hooks stay unconditional AND a caller without a shared
            value gets layers reanimated never touches. Which branch a call site
            takes is fixed by whether it passes `progress` at all, so this never
            swaps mid-life. */}
        {progress ? (
          <AnimatedBackdropLayers progress={progress} {...layerProps} />
        ) : (
          <StaticBackdropLayers {...layerProps} />
        )}
      </Pressable>
      {children}
    </View>
  );
});

Backdrop.displayName = 'Backdrop';

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

export {
  layerForRank,
  OVERLAY_STACK_BAND,
  OVERLAY_STACK_BASE,
  OVERLAY_STACK_MAX_RANK,
  TOAST_LAYER_Z,
  type OverlayLayer,
} from './stack';
export { useOverlayLayer } from './use-overlay-layer';
