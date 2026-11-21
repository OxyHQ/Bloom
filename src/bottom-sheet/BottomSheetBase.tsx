import { sheetPanIntent } from './drag-geometry';
import { sheetFooterOffset } from './footer-position';
import { pointerEventsStyles } from '../styles/pointer-events';
import { useSurfaceTransition } from '../motion/use-surface-transition';
import { MOTION_RECIPES } from '../motion/recipes';
import { surfaceStyle } from '../shapes/surface-style';
import { SURFACE_SHAPES } from '../design-tokens/shapes';
import type React from 'react';
import {
  type ComponentRef,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  StyleSheet,
  Platform,
  useWindowDimensions,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import {
  useDrag,
  useScrollGesture,
  useStableCallback,
  type DragActivation,
} from '../motion/gestures';
import {
  animateMotionValue,
  useDerivedMotionValue,
  useMotionStyle,
  useMotionValueOf,
} from '../motion/motion-value';
import { springSpecOf } from '../motion/spec';
import { resolveSurfaceTransition } from '../motion/surface-transition';
import type { Timing } from '../motion/timing';
import { ScrollBar } from '../layout/ScrollBar';
import type { WebCssStyle } from '../styles/web-view-style';
import { SurfacePaint } from '../surface/SurfacePaint';
import { resolveSurfaceMaterial } from '../surface/resolve-surface-material';
import { SurfaceLevelProvider, surfaceFillVars } from '../styles/surface-levels';
import { ScreenScope } from '../layout';
import { Z_INDEX } from '../styles/z-index';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EDGE_GAP, windowEdgeGap } from '../layout/edge';
import { Backdrop, BACKDROP_DIM_OPACITY } from '../overlay';
import { backdropFade } from './backdrop-fade';
import { ModalKeyboard } from '../overlay/ModalKeyboard';
import { useTheme } from '../theme/use-theme';
import { SheetKeyboardProvider } from './context';
import { shouldClosePan } from './pan-dismiss';
import type { BottomSheetRef, BottomSheetBaseProps } from './types';
import { useCssSafeAreaInsets } from '../hooks/use-css-safe-area-insets';
import { UNSET } from '../styles/animated-style';

/**
 * The sheet's spring, written as physics (mass 0.8, stiffness 300, damping
 * 25): it presents, follows a release and settles a refused dismissal. It
 * leaves on a softer one (stiffness 250). The same oscillators as specs, so
 * they play on the gesture layer exactly as they did.
 */
const SHEET_SPRING = springSpecOf({ mass: 0.8, stiffness: 300, damping: 25 });
const SHEET_LEAVE_SPRING = springSpecOf({ mass: 0.8, stiffness: 250, damping: 25 });

/** Where the sheet's scale is at a translate: 1 at rest, 0.95 a screen's height down. */
function sheetScaleAt(translate: number, screenHeight: number): number {
  'worklet';
  return interpolate(translate, [0, screenHeight], [1, 0.95]);
}

/** The keyboard lifts the sheet by its height. */
function keyboardLift(keyboardHeight: number): number {
  'worklet';
  return -keyboardHeight;
}

/** A footer that rides with the sheet does not move inside it. */
function footerAtRest(): number {
  'worklet';
  return 0;
}

/** A body drag that has its own activation only moves the sheet down from where it started. */
function followsDown(travel: number, next: number): boolean {
  'worklet';
  return travel >= 0 && next >= 0;
}

export const BottomSheetBase = forwardRef(
  (props: BottomSheetBaseProps, ref: React.ForwardedRef<BottomSheetRef>) => {
    const {
      Shell,
      children,
      accessibilityLabel,
      'aria-labelledby': labelledBy,
      'aria-describedby': describedBy,
      open,
      onDismiss,
      enablePanDownToClose = true,
      material: surfaceMaterial = 'surface',
      backgroundComponent,
      backgroundFill,
      backdropComponent,
      backdrop,
      transition,
      style,
      enableHandlePanningGesture = true,
      onDismissAttempt,
      detached = false,
      showHandle = true,
      backdropOpacity = BACKDROP_DIM_OPACITY,
      scrollable = true,
      sizing = 'content',
      maxHeightRatio = 1,
      manualActivation = false,
      animatedProgress,
      handleComponent,
      scrollY: externalScrollY,
      headerOverlay,
      footer,
      footerBehavior = 'sheet',
      onLayout,
    } = props;

    const motion = useSurfaceTransition(transition);
    const timed = transition !== undefined;
    const timedConfig = useMemo(
      () => ({
        ...MOTION_RECIPES.present,
        duration: motion.duration ?? 250,
        easing: motion.easing,
      }),
      [motion.duration, motion.easing],
    );
    // The same timed presentation as the gesture layer plays it on the
    // sheet's translate: the transition's duration and cubic-bezier.
    const [x1, y1, x2, y2] = resolveSurfaceTransition(transition).easing;
    const timedMotion = useMemo<Timing>(
      () => ({
        duration: timedConfig.duration,
        curve: { kind: 'bezier', points: [x1, y1, x2, y2] },
      }),
      [timedConfig.duration, x1, y1, x2, y2],
    );
    const insets = useCssSafeAreaInsets(useSafeAreaInsets());
    const theme = useTheme();
    const { colors } = theme;
    // The WINDOW, re-read on every change: an iPad split view, a resizable
    // iOS 27 window and an Android desktop window all change it without a
    // rotation.
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    // Seed from the controlled `open` prop so a sheet that should be open is
    // visible on its FIRST commit (no present()-in-effect race) — this is what
    // lets a responsive Dialog survive a resize placement swap without going blank.
    const [visible, setVisible] = useState(() => open ?? false);
    const [rendered, setRendered] = useState(() => open ?? false); // keep mounted for exit animation
    const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasClosedRef = useRef(false);
    const scrollViewRef = useRef<ComponentRef<typeof Animated.ScrollView>>(null);
    const sheetRef = useRef<ComponentRef<typeof View>>(null);
    /**
     * Monotonically increasing counter that identifies "the current close
     * attempt". Bumped every time the sheet re-opens (`present()`), so any
     * in-flight `withTiming` completion callback or fallback timer from a
     * PREVIOUS close cycle becomes a no-op. Without this guard, a stale
     * `runOnJS(finishClose)` from an aborted close would fire `onDismiss`
     * and unmount the sheet immediately after the user opens it again,
     * causing "tap to open does nothing" reports in production.
     */
    const closeGenerationRef = useRef(0);

    const screenHeightSV = useSharedValue(screenHeight);
    // Keep shared value in sync when screen dimensions change (rotation/resize)
    useEffect(() => {
      screenHeightSV.value = screenHeight;
    }, [screenHeight, screenHeightSV]);

    const translateY = useSharedValue(screenHeight);
    // The sheet's translate as Bloom's gesture layer moves it: its drags write
    // it, its springs play on it, and the sheet's transform follows it through
    // the one mapper. It is a motion value over `translateY` because the
    // backdrop's fade and the owner's `animatedProgress` read the same number
    // in the same frame, on the web too (`useMotionValueOf`).
    const offset = useMotionValueOf(translateY);
    const opacity = useSharedValue(0);
    const scrollOffsetY = useSharedValue(0);
    const isScrollAtTop = useSharedValue(true);
    // Live keyboard height. Written by the native shell's keyboard tracker via
    // this shared value; on web it stays 0 (the browser owns keyboard layout).
    const keyboardHeight = useSharedValue(0);
    // Mirror of `closeGenerationRef` for worklet access. Bumped from the JS
    // thread in lockstep with the ref so gesture worklets always see the
    // current generation when they snapshot it on release.
    const closeGeneration = useSharedValue(0);

    // Completion is not a user request: once closed, every owner must hear it.
    // Vetoes are checked before a user-triggered close starts, never after it.
    const safeClose = useCallback(() => {
      onDismiss?.();
    }, [onDismiss]);

    // Mirror `safeClose` and `rendered` into refs so the unmount cleanup can
    // fire the latest dismiss callback when needed, without re-binding the
    // cleanup effect on every render.
    const safeCloseRef = useRef(safeClose);
    useEffect(() => {
      safeCloseRef.current = safeClose;
    }, [safeClose]);
    const renderedRef = useRef(rendered);
    useEffect(() => {
      renderedRef.current = rendered;
    }, [rendered]);
    // Mirror `visible` so the unmount cleanup can tell "closing" (visible=false,
    // animating out) from "fully open" (visible=true) at teardown time.
    const visibleRef = useRef(visible);
    useEffect(() => {
      visibleRef.current = visible;
    }, [visible]);

    /**
     * Commit a close. Two guards prevent stale callbacks from firing:
     *   1. `hasClosedRef` — protects against the fallback timer AND the
     *      animation callback both racing to call us within a single close
     *      cycle.
     *   2. `generation` — protects against a callback from a PREVIOUS close
     *      cycle firing AFTER the user reopened. If the live generation has
     *      advanced past the one captured when the close started, this
     *      callback is from a cycle that the user has implicitly cancelled
     *      by reopening — silently drop it.
     */
    const finishClose = useCallback(
      (generation: number) => {
        if (closeGenerationRef.current !== generation) return;
        if (hasClosedRef.current) return;
        hasClosedRef.current = true;
        safeClose();
        setRendered(false);
      },
      [safeClose],
    );

    useEffect(() => {
      if (visible) {
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
          closeTimeoutRef.current = null;
        }
        hasClosedRef.current = false;
        // Bump generation: any pending close-completion callback from a
        // prior cycle (animation or fallback timer) will now no-op when
        // it eventually fires, because its captured generation is stale.
        closeGenerationRef.current += 1;
        closeGeneration.value = closeGenerationRef.current;
        opacity.value = withTiming(
          1,
          timed ? timedConfig : { ...MOTION_RECIPES.present, duration: motion.duration ?? 250 },
        );
        animateMotionValue(offset, 0, timed ? timedMotion : SHEET_SPRING, motion.reducedMotion);
      } else if (rendered) {
        // Capture the generation for THIS close cycle so the animation
        // callback (running on the UI thread, scheduled back to JS) and
        // the fallback timer agree on which cycle they belong to.
        const generation = closeGenerationRef.current;
        opacity.value = withTiming(
          0,
          timed ? timedConfig : { ...MOTION_RECIPES.dismiss, duration: motion.duration ?? 250 },
          (finished) => {
            if (finished) {
              runOnJS(finishClose)(generation);
            }
          },
        );
        animateMotionValue(
          offset,
          screenHeight,
          timed ? timedMotion : SHEET_LEAVE_SPRING,
          motion.reducedMotion,
        );

        // Fallback timer to ensure close completes (especially on web
        // where reanimated callbacks occasionally drop on tab blur).
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
        }
        closeTimeoutRef.current = setTimeout(
          () => {
            finishClose(generation);
            closeTimeoutRef.current = null;
          },
          motion.reducedMotion ? 0 : timed ? timedConfig.duration + 50 : 300,
        );
      }
    }, [
      visible,
      rendered,
      finishClose,
      screenHeight,
      closeGeneration,
      opacity,
      offset,
      timed,
      timedConfig,
      timedMotion,
      motion.duration,
      motion.reducedMotion,
    ]);

    // On unmount: ensure pending close callbacks (e.g. consumer's `onDismiss`)
    // still fire if the BS is yanked mid-animation by a parent re-render while a
    // close is IN PROGRESS. Without this, `Dialog`'s `handleDismiss` never runs
    // and queued callbacks (post-close handlers) are silently lost.
    //
    // Guarded on `!visibleRef.current`: only flush when a close was already
    // underway (visible=false → closing/animating out). A sheet yanked while
    // still FULLY OPEN (visible=true) is not closing — it is being swapped out by
    // a parent, e.g. a responsive `Dialog` crossing its breakpoint between the
    // bottom-sheet and centered-card branches. Firing onDismiss there would
    // wrongly dismiss the surface mid-swap (there are no pending close callbacks
    // to flush anyway), so the new branch can take over still-open. Refs are read
    // inside the cleanup, so the latest values are captured.
    useEffect(
      () => () => {
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
          closeTimeoutRef.current = null;
        }
        if (renderedRef.current && !hasClosedRef.current && !visibleRef.current) {
          hasClosedRef.current = true;
          safeCloseRef.current();
        }
      },
      [],
    );

    // Gesture callbacks cross to JS before consulting the consumer's veto.
    // A refused drag springs back; it never hides the Modal or strands its owner.
    const requestPanDismiss = useCallback(
      (generation: number, velocity: number) => {
        if (closeGenerationRef.current !== generation || hasClosedRef.current) return;
        if (onDismissAttempt && !onDismissAttempt()) {
          animateMotionValue(offset, 0, SHEET_SPRING, false, undefined, velocity);
          return;
        }
        // The timed presentation shares the imperative close lifecycle, so a live
        // reduced-motion change can also settle a gesture-initiated dismissal.
        if (timed || motion.reducedMotion) {
          setVisible(false);
          return;
        }
        animateMotionValue(offset, screenHeightSV.value, SHEET_SPRING, false, undefined, velocity);
        opacity.value = withTiming(0, { ...MOTION_RECIPES.dismiss, duration: 250 }, (finished) => {
          if (finished) runOnJS(finishClose)(generation);
        });
      },
      [
        onDismissAttempt,
        offset,
        screenHeightSV,
        opacity,
        finishClose,
        timed,
        timedConfig,
        motion.duration,
        motion.reducedMotion,
      ],
    );

    const present = useCallback(() => {
      setRendered(true);
      setVisible(true);
    }, []);
    const dismiss = useCallback(() => {
      setVisible(false);
    }, []);

    const scrollTo = useCallback((y: number, animated = true) => {
      scrollViewRef.current?.scrollTo({ y, animated });
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        present,
        dismiss,
        close: dismiss,
        expand: present,
        collapse: dismiss,
        scrollTo,
      }),
      [present, dismiss, scrollTo],
    );

    // The drags are Bloom's gesture layer (`useDrag`): each moves `offset`
    // with the finger on the UI thread and hands its release to `release`,
    // which decides in the same frame. One rule closes every pan the sheet
    // owns (`shouldClosePan`); a pull short of it springs home from the
    // finger's velocity; a close crosses to JS for the owner's veto.
    const dismissFromPan = useStableCallback(requestPanDismiss);
    const release = useCallback(
      (end: { value: number; velocity: number }) => {
        'worklet';
        if (shouldClosePan(end.value, end.velocity, screenHeightSV.value)) {
          runOnJS(dismissFromPan)(closeGeneration.value, end.velocity);
        } else {
          animateMotionValue(offset, 0, SHEET_SPRING, false, undefined, end.velocity);
        }
      },
      [dismissFromPan, screenHeightSV, closeGeneration, offset],
    );

    // Body drag — two strategies, switched by `manualActivation`.
    //
    // (1) Legacy mode (`manualActivation: false`, the bloom 0.3.x default):
    //     the drag shares every touch with the scroll view's own gesture and
    //     takes one past the pan's own slop. Whether it drags at all is read
    //     when it takes the touch (`scrollOffsetY <= 8`); after that it holds
    //     still while a pull down meets content that is not at (or near) the
    //     top, so the ScrollView scrolls instead.
    //
    // (2) gorhom-style mode (`manualActivation: true`):
    //     the drag takes a touch itself, only when the inner ScrollView is at
    //     the top AND the finger has moved down > 8dp (`sheetPanIntent`). In
    //     every other case it fails, so the ScrollView keeps full ownership
    //     of the touch. This is the only pattern that does not steal vertical
    //     events from the inner scroller on Android. Required for
    //     FileManagement / PhotoPicker style sheets. It only moves the sheet
    //     down from where it started.
    const scrollGesture = useScrollGesture();
    const startsAtTop = useCallback(() => {
      'worklet';
      return scrollOffsetY.value <= 8;
    }, [scrollOffsetY]);
    // If the user is pulling down while content isn't at (or near) the top,
    // the ScrollView handles it (a slightly larger tolerance for a smoother handoff).
    const followsAtTop = useCallback(
      (travel: number) => {
        'worklet';
        return !(travel > 0 && scrollOffsetY.value > 8);
      },
      [scrollOffsetY],
    );
    const takesAtTop = useCallback(
      (travel: number): DragActivation => {
        'worklet';
        return sheetPanIntent(travel, scrollOffsetY.value, 0, 'dismiss');
      },
      [scrollOffsetY],
    );

    // Dedicated handle drag — only mounted in `manualActivation` mode. It
    // takes a touch past 8dp either way, so users can drag the handle even
    // while content is mid-scroll. In legacy mode the body drag already wraps
    // the whole sheet (handle included), so no separate gesture is needed.
    // Only a detached sheet follows a pull above its rest, at 0.3 of it.
    const handleDrag = useDrag(offset, {
      axis: 'y',
      min: 0,
      overdrag: detached ? 0.3 : 0,
      activeOffset: 8,
      enabled: manualActivation && enablePanDownToClose && enableHandlePanningGesture,
      startOn: 'activation',
      onRelease: release,
    });
    // In manualActivation mode the body and handle drags are simultaneous
    // (Gesture Handler makes the relation mutual). Without it they race, and
    // a touch that begins in the handle area could be claimed by whichever
    // activates first — leading to inconsistent drag start.
    const bodyDrag = useDrag(
      offset,
      manualActivation
        ? {
            axis: 'y',
            min: 0,
            enabled: enablePanDownToClose,
            simultaneousWith: handleDrag,
            activation: takesAtTop,
            follows: followsDown,
            onRelease: release,
          }
        : {
            axis: 'y',
            min: 0,
            overdrag: detached ? 0.3 : 0,
            activeOffset: null,
            enabled: enablePanDownToClose,
            simultaneousWith: scrollGesture,
            startOn: 'activation',
            takes: startsAtTop,
            follows: followsAtTop,
            onRelease: release,
          },
    );

    // CRITICAL — the shared values each `useAnimatedStyle` READS (translateY,
    // opacity, screenHeightSV, keyboardHeight) MUST be listed in its dependency
    // array. On web WITHOUT the react-native-worklets babel plugin (the
    // production reality for the RN-Web apps: console, accounts, the SDK, etc.),
    // reanimated cannot auto-detect which shared values a worklet reads (there
    // is no injected `__closure`), so it drives the style mapper's re-runs off
    // the dependency array instead. With an empty/incomplete deps array the
    // mapper runs ONCE and freezes at the initial frame — the shared value keeps
    // animating underneath but the DOM never updates, so the sheet stays one
    // full viewport below the fold (translateY = screenHeight) and is invisible.
    // Native (with the plugin) auto-tracks and ignores the extra deps, so this
    // is safe on both platforms. Do NOT strip the shared values from these deps.
    //
    // `opacity.value` drives the fade in/out (0 -> 1). `backdropOpacity` is the
    // final dim level once fully visible. We multiply so the consumer-provided
    // dim opacity applies smoothly across the animation. When
    // `dynamicBackdrop` is enabled, the dim also fades proportionally with
    // drag distance (iOS Photos style).
    // A VALUE, not a style: `Backdrop` applies it to its blur and dim layers
    // itself. Handing it over as an animated style would put the opacity on the
    // layers' shared ancestor, which composites the group in isolation and
    // leaves `backdrop-filter` with nothing behind it to blur.
    // The backdrop follows the sheet: it fades in with the sheet and fades out as the sheet is
    // dragged away, reaching nothing exactly when the sheet is out of sight.
    const sheetHeightSV = useSharedValue(0);
    const backdropProgress = useDerivedValue(() => {
      const travel = sheetHeightSV.value > 0 ? sheetHeightSV.value : screenHeightSV.value;
      return opacity.value * backdropFade(translateY.value, travel);
    }, [opacity, translateY, sheetHeightSV, screenHeightSV]);

    useAnimatedReaction(
      () =>
        Math.min(
          opacity.value,
          backdropFade(
            translateY.value,
            sheetHeightSV.value > 0 ? sheetHeightSV.value : screenHeightSV.value,
          ),
        ),
      (progress) => {
        if (animatedProgress) animatedProgress.value = progress;
      },
      [animatedProgress, opacity, translateY, sheetHeightSV, screenHeightSV],
    );

    // Only the consumer-supplied `backdropComponent` needs the progress as a
    // style — it owns its own visuals, blur included, so the ancestor-opacity
    // hazard is its call to make.
    const customBackdropStyle = useAnimatedStyle(
      () => ({ opacity: backdropProgress.value }),
      [backdropProgress],
    );

    const footerHeight = useSharedValue(0);
    const [footerInset, setFooterInset] = useState(0);
    const overlayFooter = footerBehavior === 'viewport' && scrollable && footer != null;
    // The sheet's transform follows its translate through the one mapper:
    // lifted by the keyboard, and shrinking to 0.95 over a screen's travel.
    // A `viewport` footer holds the panel's bottom edge as the sheet moves
    // down, until it reaches the panel's top (`sheetFooterOffset`).
    const screenHeightValue = useMotionValueOf(screenHeightSV);
    const sheetHeightValue = useMotionValueOf(sheetHeightSV);
    const footerHeightValue = useMotionValueOf(footerHeight);
    const keyboardValue = useMotionValueOf(keyboardHeight);
    const sheetScale = useDerivedMotionValue([offset, screenHeightValue], sheetScaleAt);
    const lift = useDerivedMotionValue([keyboardValue], keyboardLift);
    const sheetMotion = useMotionStyle({ translateY: [offset, lift], scale: sheetScale });
    const footerOffset = useDerivedMotionValue(
      [offset, sheetScale, sheetHeightValue, footerHeightValue],
      footerBehavior === 'viewport' ? sheetFooterOffset : footerAtRest,
    );
    const footerMotion = useMotionStyle({ translateY: footerOffset });
    // The sheet's node is the keyboard boundary's (`sheetRef`) and, on the web,
    // the one the mapper writes.
    const bindSheetMotion = sheetMotion.ref;
    const attachSheet = useCallback(
      (node: ComponentRef<typeof View> | null) => {
        sheetRef.current = node;
        bindSheetMotion?.(node);
      },
      [bindSheetMotion],
    );

    // The shared window-edge rule, resolved on the JS thread: `windowEdgeGap` is
    // not a worklet, so the worklets below capture the number rather than call it.
    //
    // A detached sheet deliberately does NOT read `useBottomEdgeInset()`. It is a
    // modal surface rendered in the portal ABOVE whatever owns the bottom edge and
    // it covers that surface — offsetting it by a tab bar it is already hiding
    // would float it off the bottom of the screen for nothing.
    const detachedGap = detached ? windowEdgeGap(insets.bottom, EDGE_GAP) : 0;
    // A detached sheet floats, so a tall one holds off the top edge by the same
    // breathing room it keeps from the bottom one. A flush sheet only clears the
    // safe area: it is a panel hanging off the screen, not a card.
    const topGap = detached ? windowEdgeGap(insets.top, EDGE_GAP) : insets.top;

    const sheetHeightStyle = useAnimatedStyle(() => {
      const availableHeight = Math.max(
        0,
        Math.min(
          screenHeightSV.value * Math.max(0, Math.min(1, maxHeightRatio)),
          screenHeightSV.value - keyboardHeight.value - topGap - detachedGap,
        ),
      );
      return {
        maxHeight: availableHeight,
        height: sizing === 'fill' ? availableHeight : UNSET,
      };
    }, [sizing, maxHeightRatio, topGap, detachedGap, screenHeightSV, keyboardHeight]);

    const sheetMarginStyle = useAnimatedStyle(() => {
      // Only add margin when detached, otherwise extend behind safe area
      if (detached) {
        return {
          marginBottom: keyboardHeight.value > 0 ? EDGE_GAP : detachedGap,
        };
      }
      return {
        marginBottom: 0,
      };
    }, [detachedGap, detached, keyboardHeight]);

    const handleBackdropPress = useCallback(() => {
      // Always animate close on backdrop press
      if (onDismissAttempt && !onDismissAttempt()) {
        return;
      }
      dismiss();
    }, [onDismissAttempt, dismiss]);

    const scrollHandler = useAnimatedScrollHandler(
      {
        onScroll: (event) => {
          scrollOffsetY.value = event.contentOffset.y;
          isScrollAtTop.value = event.contentOffset.y <= 0;
          // Mirror into the host's collapse offset (a Dialog nav header) when
          // provided. Listed in deps so the RN-Web (no worklets plugin) handler
          // re-binds if the shared value identity changes.
          if (externalScrollY) externalScrollY.value = event.contentOffset.y;
        },
      },
      [externalScrollY, scrollOffsetY, isScrollAtTop],
    );

    const dynamicStyles = useMemo(() => {
      return StyleSheet.create({
        handle: {
          ...styles.handle,
          backgroundColor: theme.isDark ? '#444' : '#C7C7CC',
        },
        sheet: {
          ...styles.sheet,
          backgroundColor: 'transparent',
          ...(detached ? styles.sheetDetached : styles.sheetNormal),
        },
        scrollContent: {
          ...styles.scrollContent,
          // In normal mode, don't add padding here - screens handle their own padding
          // The sheet extends behind safe area, and screens add padding as needed
        },
      });
    }, [colors.background, theme.isDark, detached]);

    // The paint is absolute: gestures, measurements and layout stay on the existing sheet.
    const flatSurfaceStyle = StyleSheet.flatten(style as StyleProp<ViewStyle>);
    const backingFill = String(
      backgroundFill ?? flatSurfaceStyle?.backgroundColor ?? colors.background,
    );
    const material = resolveSurfaceMaterial({
      fill: backingFill,
      parentFill: colors.background,
      paint: !backgroundComponent && surfaceMaterial !== 'flat',
      level: 0,
    });
    const { paintFill, publishedFill: surfaceFill } = material;
    // Centred by its insets, not by auto margins: Yoga places an absolute view
    // with both `left` and `right` at `left` once `maxWidth` caps it, so every
    // native sheet in a window wider than its cap sat in the bottom-LEFT corner
    // (an iPad, a Mac, an Android desktop window) while the web centred it.
    // A sheet its window can hold keeps the static edge insets, so it draws
    // exactly as it always has; only a capped one takes the centring insets.
    const sheetMaxWidth =
      typeof flatSurfaceStyle?.maxWidth === 'number' ? flatSurfaceStyle.maxWidth : SHEET_MAX_WIDTH;
    const sheetSideInset = sheetSideInsetFor(screenWidth, sheetMaxWidth, detached);
    const surfaceRadius =
      flatSurfaceStyle?.borderRadius ?? flatSurfaceStyle?.borderTopLeftRadius ?? 24;
    const surfaceCorners: ViewStyle = {
      ...surfaceStyle({ curve: SURFACE_SHAPES.panel.curve }),
      borderTopLeftRadius: flatSurfaceStyle?.borderTopLeftRadius ?? surfaceRadius,
      borderTopRightRadius: flatSurfaceStyle?.borderTopRightRadius ?? surfaceRadius,
      borderBottomLeftRadius:
        flatSurfaceStyle?.borderBottomLeftRadius ?? (detached ? surfaceRadius : 0),
      borderBottomRightRadius:
        flatSurfaceStyle?.borderBottomRightRadius ?? (detached ? surfaceRadius : 0),
    };

    // Publish the sheet's keyboard shared value to the shell so the native
    // shell's keyboard tracker can drive it. Kept stable
    // (shared values are stable refs) so the shell never re-mounts for this.
    if (!rendered) return null;

    // Default handle render — used when `handleComponent` is not provided.
    const renderDefaultHandle = () => <View style={dynamicStyles.handle} />;
    const handleNode = showHandle
      ? handleComponent
        ? handleComponent()
        : renderDefaultHandle()
      : null;

    // In `manualActivation` mode the handle gets its own gesture detector
    // sitting in a dedicated absolutely-positioned hit area at the top of the
    // sheet. In legacy mode the handle is rendered inline as a decorative
    // overlay (the body pan covers the entire sheet, handle included).
    const handleSlot =
      handleNode && manualActivation ? (
        <GestureDetector gesture={handleDrag}>
          {/*
              The hit area is a POINTER affordance and is deliberately not an
              accessibility element. It used to carry `accessible
              accessibilityRole="adjustable"`, which react-native-web maps to
              `role="slider"` — an unlabelled, valueless slider in the a11y tree,
              and a promise the component cannot keep on either platform: the
              sheet has no snap points to step between and the handle declares no
              `accessibilityActions`, so the increment/decrement gestures the role
              advertises do nothing. Screen-reader users dismiss the sheet through
              the backdrop, the close control or Escape.
            */}
          <View style={styles.handleHitArea}>{handleNode}</View>
        </GestureDetector>
      ) : (
        handleNode
      );

    // The sheet uses the PAGE token as its tint and nominal surface, resetting
    // everything inside it. Without this a sheet rendered inside a `ContentPanel`
    // — web keeps React context across a portal — would tell its content it is
    // sitting on the panel's card, and in-sheet chrome would paint the column's
    // colour on top of the sheet's.
    // ...and it is its own SCREEN for the same reason: a header inside the sheet
    // must claim the sheet's top edge rather than the page's, and chrome inside
    // it must follow the sheet's scroller rather than `window.scrollY`
    // (`layout/screen-scope.tsx`).
    const surfaceChildren = (
      <SheetKeyboardProvider value={keyboardHeight}>
        <ScreenScope sizing={sizing}>{children}</ScreenScope>
      </SheetKeyboardProvider>
    );

    // Inner content: scrollable wraps in Animated.ScrollView, non-scrollable
    // renders children directly. In legacy mode the scrollview is also
    // wrapped in the scroll view's own gesture (`scrollGesture`) for scroll/pan coordination.
    const scrollViewNode = (
      <Animated.ScrollView
        ref={scrollViewRef}
        style={[styles.scrollView, surfaceCorners]}
        contentContainerStyle={
          overlayFooter
            ? [dynamicStyles.scrollContent, { paddingBottom: footerInset }]
            : dynamicStyles.scrollContent
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {surfaceChildren}
      </Animated.ScrollView>
    );

    const scrollBody = manualActivation ? (
      // In manualActivation mode the scroll view is not wrapped in a native
      // gesture. (Naming its ref in the pan's simultaneous list was a no-op:
      // RNGH resolves an external ref to `ref.current.handlerTag`, which a
      // react-native ScrollView does not have, and drops it.)
      scrollViewNode
    ) : (
      // Legacy mode: native gesture wraps the scroll view to coordinate
      // with the always-active body pan.
      <GestureDetector gesture={scrollGesture}>{scrollViewNode}</GestureDetector>
    );
    const bodyContent = scrollable ? (
      Platform.OS === 'web' ? (
        // Bloom's scrollbar floats over the scroller, so it needs a box of its own around it.
        <View style={styles.scrollBox}>
          {scrollBody}
          <ScrollBar target={scrollViewRef} />
        </View>
      ) : (
        scrollBody
      )
    ) : (
      <View
        style={[
          styles.nonScrollableContent,
          sizing === 'content' ? { flexBasis: 'auto' } : undefined,
          surfaceCorners,
          { overflow: 'hidden' },
        ]}
      >
        {surfaceChildren}
      </View>
    );

    return (
      <Shell
        visible={rendered}
        onRequestClose={handleBackdropPress}
        keyboardHeight={keyboardHeight}
      >
        {/* Web keyboard and focus: in on open, back on close, Tab kept in
                the sheet, Escape a USER dismissal — through `onDismissAttempt`,
                exactly like the backdrop. The sheet had no keyboard path at
                all. Inside the shell's `OverlayRoot`; inert on native. */}
        <ModalKeyboard panelRef={sheetRef} dismissible dismiss={handleBackdropPress} />
        <View style={StyleSheet.absoluteFill}>
          {backdropComponent ? (
            <Animated.View style={[StyleSheet.absoluteFill, customBackdropStyle]}>
              {backdropComponent({ onPress: handleBackdropPress })}
            </Animated.View>
          ) : (
            // The ONE Bloom backdrop (blur + dim + press-to-dismiss).
            // `backdropStyle` drives the fade; the dim level rides on
            // `backdropOpacity`, so the shared component's own dim is
            // switched off here to keep a single source of dimming.
            <Backdrop
              {...backdrop}
              onPress={handleBackdropPress}
              // `progress` is the FADE (0 → 1, folding the drag);
              // how dark the backdrop gets is `backdropOpacity`,
              // which defaults to the library-wide dim so a sheet
              // matches every other surface. It goes through
              // `progress` rather than an animated style because an
              // opacity on the root would sit above the blur layer
              // and neutralise it.
              dimOpacity={backdrop?.dimOpacity ?? backdropOpacity}
              progress={backdropProgress}
              style={styles.backdrop}
            />
          )}

          <GestureDetector gesture={bodyDrag}>
            <Animated.View
              collapsable={false}
              ref={attachSheet}
              // The semantic modal and keyboard boundary must include
              // the sticky header as well as the scrolling body.
              role={Platform.OS === 'web' ? 'dialog' : undefined}
              aria-modal={Platform.OS === 'web' ? true : undefined}
              aria-label={Platform.OS === 'web' ? accessibilityLabel : undefined}
              aria-labelledby={Platform.OS === 'web' ? labelledBy : undefined}
              aria-describedby={Platform.OS === 'web' ? describedBy : undefined}
              tabIndex={Platform.OS === 'web' ? -1 : undefined}
              onLayout={(event) => {
                sheetHeightSV.value = event.nativeEvent.layout.height;
                onLayout?.(event);
              }}
              style={[
                dynamicStyles.sheet,
                // `--bloom-surface` on the element that carries the
                // fill — web CSS under the sheet reads the sheet's
                // colour, not the colour of whatever it opened over.
                surfaceFillVars(surfaceFill),
                ...(sheetSideInset === sheetEdgeGap(detached)
                  ? []
                  : [{ left: sheetSideInset, right: sheetSideInset }]),
                sheetMarginStyle,
                sheetMotion.style,
                sheetHeightStyle,
                style,
                {
                  backgroundColor: backgroundComponent
                    ? surfaceFill
                    : surfaceMaterial === 'flat'
                      ? paintFill
                      : 'transparent',
                },
              ]}
            >
              {backgroundComponent ? (
                backgroundComponent({ style: styles.background })
              ) : surfaceMaterial === 'flat' ? null : (
                <View
                  style={[
                    [StyleSheet.absoluteFill, surfaceCorners, { overflow: 'hidden' }],
                    pointerEventsStyles.none,
                  ]}
                >
                  <View
                    style={[
                      [
                        StyleSheet.absoluteFill,
                        {
                          bottom: detached
                            ? 0
                            : -(typeof surfaceRadius === 'number' ? surfaceRadius : 24),
                        },
                      ],
                      pointerEventsStyles.none,
                    ]}
                  >
                    <SurfacePaint
                      floating
                      fill={paintFill}
                      shape={{ curve: SURFACE_SHAPES.panel.curve }}
                      radius={surfaceRadius}
                    />
                  </View>
                </View>
              )}

              <SurfaceLevelProvider level={material.level} fill={surfaceFill}>
                {handleSlot}

                {bodyContent}
                {footer != null && (
                  <Animated.View
                    testID="bloom-sheet-footer"
                    ref={footerMotion.ref}
                    pointerEvents="box-none"
                    onLayout={(event) => {
                      const height = event.nativeEvent.layout.height;
                      footerHeight.value = height;
                      setFooterInset(height);
                    }}
                    style={[
                      { flexShrink: 0 },
                      overlayFooter && { position: 'absolute', left: 0, right: 0, bottom: 0 },
                      footerMotion.style,
                    ]}
                  >
                    {footer}
                  </Animated.View>
                )}

                {/* Sticky nav-header overlay (Dialog nav-header mode): floats
                            above the scroll body, clipped to the sheet's rounded top. */}
                {headerOverlay != null && (
                  <View
                    testID="bloom-sheet-header-clip"
                    pointerEvents="box-none"
                    style={[StyleSheet.absoluteFill, surfaceCorners, { overflow: 'hidden' }]}
                  >
                    {headerOverlay}
                  </View>
                )}
              </SurfaceLevelProvider>
            </Animated.View>
          </GestureDetector>
        </View>
      </Shell>
    );
  },
);

BottomSheetBase.displayName = 'BottomSheetBase';

/** The widest a sheet grows when its style sets no `maxWidth`. */
export const SHEET_MAX_WIDTH = 800;

/** The edge gap a detached sheet keeps on each side of a narrow window. */
export const DETACHED_SHEET_SIDE_GAP = 16;

/**
 * The `left` / `right` inset that centres a sheet of `maxWidth` in a window
 * `windowWidth` wide: the detached sheet's 16 side gap on a narrow window (a
 * flush sheet touches both edges), half the room the cap leaves on a wide one.
 */
function sheetEdgeGap(detached: boolean): number {
  return detached ? DETACHED_SHEET_SIDE_GAP : 0;
}

export function sheetSideInsetFor(
  windowWidth: number,
  maxWidth: number,
  detached: boolean,
): number {
  return Math.max(sheetEdgeGap(detached), (windowWidth - maxWidth) / 2);
}

const styles = StyleSheet.create({
  backdrop: {
    // Geometry only: the colour and the dim level belong to `Backdrop`.
    flex: 1,
  },
  backdropTouchable: {
    flex: 1,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    maxWidth: SHEET_MAX_WIDTH,
    alignSelf: 'center',
    marginHorizontal: 'auto',
  },
  sheetDetached: {
    left: DETACHED_SHEET_SIDE_GAP,
    right: DETACHED_SHEET_SIDE_GAP,
    ...surfaceStyle({ ...SURFACE_SHAPES.panel, radius: 24 }),
  },
  sheetNormal: {
    left: 0,
    right: 0,
    ...surfaceStyle(SURFACE_SHAPES.sheet),
  },
  /** Legacy (non-manualActivation) handle: decorative overlay only. */
  handle: {
    position: 'absolute',
    top: 10,
    left: '50%',
    marginLeft: -18,
    width: 36,
    height: 5,
    borderRadius: 3,
    zIndex: Z_INDEX.sheetHandle,
  },
  /**
   * Hit area for the drag handle in `manualActivation` mode. Absolutely
   * positioned at the top of the sheet so the area visually "floats" above
   * the content — content scrolls up underneath it (no layout offset)
   * while the thumb can still grab the full-width 28dp strip to drag.
   */
  handleHitArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 28,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 6,
    zIndex: Z_INDEX.sheetHandle,
  },
  background: {
    ...StyleSheet.absoluteFill,
  },
  scrollView: {
    flex: 1,
  },
  scrollBox: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    flexGrow: 1,
  },
  nonScrollableContent: {
    flex: 1,
    // A `scrollable={false}` sheet hands its own scrolling to a child
    // VirtualizedList, which needs a BOUNDED height to scroll. The sheet is
    // clamped by `maxHeight`, but on web a flex child defaults to
    // `min-height: auto` and grows to its content instead of shrinking into
    // that clamp — so the list overflows and is clipped (no scroll). Yoga
    // already defaults min to 0 on native; making it explicit here fixes the
    // web output so the bounded height propagates down to the list.
    minHeight: 0,
  },
});
