/**
 * Derived from sonner-native v0.26.4 — src/toast.tsx:39-437
 * (MIT © Gunnar Torfi Steinarsson). See the top-level NOTICE.
 *
 * The animated shell around a row: stack offset + scale, enter/exit animation,
 * height measurement, swipe wrapper and the imperative wiggle handle. The visual
 * row itself is `ToastContent` (or the consumer's `jsx`).
 *
 * W6 — INVARIANT: THE MEASURED `Animated.View` IS `style`-ONLY, NEVER
 * `className`'d. Under react-native-css on web, `onLayout` never fires for a
 * className'd component, which would strand every row at
 * `ESTIMATED_TOAST_HEIGHT` and pile the stack on top of itself. Measurement runs
 * a three-tier ladder — `getBoundingClientRect()` (RN >= 0.83 refs and RN-Web),
 * then `measureInWindow` (older New Arch), then `onLayout` as the safety net —
 * so no single platform quirk can silently degrade it. A consumer's `toast.custom`
 * JSX is unaffected: the ref sits on this engine wrapper, not on their element.
 *
 * W3 — the animated style READS two shared values and returns only the transform.
 * `position`, `width` and the `top`/`bottom` anchor are static `StyleSheet` entries:
 * upstream writes the anchor conditionally INSIDE the mapper, so the previous
 * anchor is never cleared when `position` changes and the static keys are
 * re-committed every frame. Both shared values are driven imperatively from plain-JS
 * targets (`useAnimatedTarget`), never returned from a mapper.
 *
 * W5 — this row does NOT subscribe to `AppState`. `Toaster` holds one
 * subscription for the whole stack (upstream creates one per row, so N toasts
 * meant N `visibilitychange` listeners).
 *
 * THE EXIT IS ALWAYS A LAYOUT ANIMATION; THE ENTER DEPENDS ON THE PLATFORM.
 * `animations.ts` returns EITHER an `entering` builder (native, and any consumer
 * override) OR an `enterTranslateY` for `rowStyle` below to fade and slide the row
 * in imperatively (web default) — never both. When `enterTranslateY` is
 * `undefined`, `enterProgress` is seeded at 1 and `rowStyle` collapses to the
 * wiggle scale alone, so nothing here competes with `entering`. Both halves of
 * that split are load-bearing and neither may be "simplified" into the other:
 * `animations.ts` documents the web pin that forbids `entering` on web and the
 * native regression that forbids the imperative driver on native.
 */
import * as React from 'react';
import {
  StyleSheet,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { easeOutQuartFn, useToastLayoutAnimations } from './animations';
import {
  CLOSE_BUTTON_HIT_AREA,
  ENTERING_ANIMATION_DURATION,
  STACKING_ANIMATION_DURATION,
  TOAST_MAX_ROW_WIDTH,
  toastDefaults,
} from './constants';
import { useDynamicToastContext, useToastContext } from './context';
import { calculateStackScaleX } from './position-utils';
import { useAnimatedTarget } from './use-animated-target';
import { ToastContent } from './ToastContent';
import { ToastSwipeHandler } from './ToastSwipeHandler';
import { toastStore } from './toast-store';
import type {
  ToasterProps,
  ToastPosition,
  ToastProps,
  ToastRef,
  ToastStyles,
} from './types';
import { useToastPosition } from './use-toast-position';

/** How much a wiggle grows the row, and for how long per half-cycle. */
const WIGGLE_SCALE = 1.035;
const WIGGLE_DURATION = 150;
const WIGGLE_REPEATS = 4;

/**
 * Fold the outlet-level `toastOptions` style slots into the per-toast
 * `ToastStyles` shape so the renderer has ONE styles object to apply. Upstream
 * threads all fifteen slots down as separate props; collapsing them here keeps
 * `ToastContent` to a single `styles` prop while honouring the same API. The
 * per-toast value always wins over the outlet's.
 */
function mergeToastStyles(
  toastOptions: NonNullable<ToasterProps['toastOptions']>,
  perToast: ToastStyles | undefined,
  variantStyle: ToastStyles['toast'],
): ToastStyles {
  return {
    toastContainer: {
      ...toastOptions.toastContainerStyle,
      ...perToast?.toastContainer,
    },
    toast: {
      ...toastOptions.style,
      ...variantStyle,
      ...perToast?.toast,
    },
    toastContent: {
      ...toastOptions.toastContentStyle,
      ...perToast?.toastContent,
    },
    textContainer: {
      ...toastOptions.textContainerStyle,
      ...perToast?.textContainer,
    },
    title: { ...toastOptions.titleStyle, ...perToast?.title },
    description: { ...toastOptions.descriptionStyle, ...perToast?.description },
    buttons: { ...toastOptions.buttonsStyle, ...perToast?.buttons },
    closeButton: {
      ...toastOptions.closeButtonStyle,
      ...perToast?.closeButton,
    },
    closeButtonIcon: {
      ...toastOptions.closeButtonIconStyle,
      ...perToast?.closeButtonIcon,
    },
  };
}

type ToastRowProps = ToastProps & {
  onDismiss: (id: string | number) => void;
};

export const ToastRow = React.forwardRef<ToastRef, ToastRowProps>(
  function ToastRow(
    {
      id,
      title,
      jsx,
      description,
      icon,
      duration,
      variant,
      action,
      cancel,
      close,
      onDismiss,
      dismissible = toastDefaults.dismissible,
      closeButton: closeButtonProp,
      actionButtonStyle,
      actionButtonTextStyle,
      cancelButtonStyle,
      cancelButtonTextStyle,
      style,
      styles: styleOverrides,
      promiseOptions,
      position: positionProp,
      animation,
      unstyled: unstyledProp,
      important,
      richColors: richColorsProp,
      onPress,
      allowFontScaling: allowFontScalingProp,
      maxFontSizeMultiplier: maxFontSizeMultiplierProp,
      backgroundComponent: backgroundComponentProp,
      numberOfToasts,
      index,
      orderedToastIds,
    },
    ref,
  ) {
    const {
      closeButton: closeButtonCtx,
      icons,
      richColors: richColorsCtx,
      allowFontScaling: allowFontScalingCtx,
      maxFontSizeMultiplier: maxFontSizeMultiplierCtx,
      enableStacking,
      gap,
      position: positionCtx,
      visibleToasts,
      unstyled: unstyledCtx,
      toastOptions,
    } = useToastContext();
    const { toastHeights, isExpanded, toggleExpand } = useDynamicToastContext();

    const position = positionProp ?? positionCtx;
    const unstyled = unstyledProp ?? toastOptions.unstyled ?? unstyledCtx;
    const richColors = richColorsProp ?? richColorsCtx;
    const closeButton = closeButtonProp ?? closeButtonCtx;
    const allowFontScaling = allowFontScalingProp ?? allowFontScalingCtx;
    const maxFontSizeMultiplier =
      maxFontSizeMultiplierProp ?? maxFontSizeMultiplierCtx;
    const backgroundComponent =
      backgroundComponentProp ?? toastOptions.backgroundComponent;
    const stackGap = gap ?? toastDefaults.stackGap;

    const mergedStyles = React.useMemo(
      () =>
        mergeToastStyles(
          toastOptions,
          styleOverrides,
          variant ? toastOptions[variant] : undefined,
        ),
      [toastOptions, styleOverrides, variant],
    );

    // For top-center the array is reversed, so the front row is index 0.
    const distanceFromFront =
      position === 'top-center' ? index : numberOfToasts - 1 - index;
    const isHiddenByLimit = enableStacking && distanceFromFront >= visibleToasts;

    const { entering, exiting, enterTranslateY } = useToastLayoutAnimations(
      positionProp,
      animation,
      isHiddenByLimit,
      numberOfToasts,
    );

    const yPosition = useToastPosition({
      index,
      numberOfToasts,
      enableStacking,
      position,
      allToastHeights: toastHeights,
      gap,
      orderedToastIds,
      isExpanded,
      stackGap,
    });

    const { width: screenWidth } = useWindowDimensions();
    // The row is `width: '100%'` up to the cap, so this is its real width.
    const rowWidth = Math.min(screenWidth, TOAST_MAX_ROW_WIDTH);

    const stackScaleX = useAnimatedTarget(
      calculateStackScaleX({
        index,
        numberOfToasts,
        enableStacking,
        position,
        isExpanded,
        stackGap,
        rowWidth,
      }),
      { duration: STACKING_ANIMATION_DURATION, easing: easeOutQuartFn },
    );

    const stackTransformStyle = useAnimatedStyle(
      () => ({
        transform: [
          { translateY: yPosition.value },
          { scaleX: stackScaleX.value },
        ],
      }),
      [yPosition, stackScaleX],
    );

    // 0 -> 1 over the enter animation. Seeded at 1 with NO mount-time `withTiming`
    // whenever `enterTranslateY` is undefined — i.e. whenever `entering` is playing
    // the enter instead, or reduced motion is on — leaving this style the identity.
    const enterProgress = useAnimatedTarget(1, {
      duration: ENTERING_ANIMATION_DURATION,
      easing: easeOutQuartFn,
      from: enterTranslateY === undefined ? undefined : 0,
    });
    const enterDistance = enterTranslateY ?? 0;

    const wiggleScale = useSharedValue(1);
    // ONE mapper for both transforms: two animated styles on the same view would
    // each return a `transform` array and the later one would win outright.
    const rowStyle = useAnimatedStyle(
      () => ({
        opacity: enterProgress.value,
        transform: [
          { translateY: (1 - enterProgress.value) * enterDistance },
          { scale: wiggleScale.value },
        ],
      }),
      [enterProgress, enterDistance, wiggleScale],
    );

    const wiggle = React.useCallback(() => {
      'worklet';
      wiggleScale.value = withRepeat(
        withTiming(Math.min(wiggleScale.value * WIGGLE_SCALE, WIGGLE_SCALE), {
          duration: WIGGLE_DURATION,
        }),
        WIGGLE_REPEATS,
        true,
      );
    }, [wiggleScale]);

    const handleWiggle = React.useCallback(() => {
      // A toast that never auto-closes has no timer to draw attention back to.
      if (duration === Infinity) {
        return;
      }
      if (wiggleScale.value !== 1) {
        // Settle back to rest first, otherwise the scale compounds.
        wiggleScale.value = withTiming(1, { duration: WIGGLE_DURATION }, wiggle);
        return;
      }
      wiggle();
    }, [wiggle, wiggleScale, duration]);

    React.useImperativeHandle(ref, () => ({ wiggle: handleWiggle }));

    const measuredRef = React.useRef<
      (View & { getBoundingClientRect?: () => DOMRect }) | null
    >(null);

    // Tiers 1 and 2 of the ladder — see the W6 note in the file header.
    React.useLayoutEffect(() => {
      const node = measuredRef.current;
      if (!node) {
        return;
      }

      if (typeof node.getBoundingClientRect === 'function') {
        toastStore.setToastHeight(id, node.getBoundingClientRect().height);
        return;
      }

      let stale = false;
      node.measureInWindow((_x, _y, _width, height) => {
        if (!stale) {
          toastStore.setToastHeight(id, height);
        }
      });
      return () => {
        stale = true;
      };
    }, [id, variant, title, description, jsx]);

    // Tier 3. Also the only tier that reports a LATER resize (a wrapped line, a
    // font swap) on platforms without a synchronous read.
    const handleLayout = React.useCallback(
      ({ nativeEvent }: LayoutChangeEvent) => {
        const { height } = nativeEvent.layout;
        if (height > 0) {
          toastStore.setToastHeight(id, height);
        }
      },
      [id],
    );

    const onRemove = React.useCallback(() => {
      onDismiss(id);
    }, [onDismiss, id]);

    const onSwipeBegin = React.useCallback(() => {
      toastStore.pauseTimer(id);
    }, [id]);

    const onSwipeFinalize = React.useCallback(() => {
      if (!isExpanded) {
        toastStore.resumeTimer(id);
      }
    }, [id, isExpanded]);

    /**
     * INVARIANT: NO TAP ON A STACKED ROW IS INERT. Every one of them dismisses,
     * expands or collapses.
     *
     * The close-button strip dismisses only when a ✕ is actually THERE to aim at,
     * which is exactly `closeButton && dismissible` — the same condition
     * `ToastContent` renders it under, and nothing to do with expansion. Anything
     * else in the strip falls through to the row's own behaviour rather than being
     * swallowed: on a collapsed stack it expands, on an expanded one it collapses.
     *
     * Guarding the strip on `isExpanded` (as this did until now) made two taps do
     * nothing at all — the whole strip at default config, where `closeButton` is
     * `false` so the dismiss branch is unreachable, and the VISIBLE ✕ on a
     * collapsed stack's front row. On Android that second one has no fallback:
     * the RNGH tap wins the race against `ToastContent`'s nested close Pressable,
     * so the ✕ never got its own press either.
     *
     * `x` is relative to the row, which is CAPPED at `TOAST_MAX_ROW_WIDTH`.
     * Measuring the strip from the window edge would put it outside the row
     * entirely on a wide viewport — do not "simplify" this back to `screenWidth`.
     */
    const onSwipePress = React.useCallback(
      ({ x }: { x: number; y: number }) => {
        if (enableStacking && numberOfToasts > 1 && position !== 'center') {
          const inCloseStrip = x > rowWidth - CLOSE_BUTTON_HIT_AREA;
          if (inCloseStrip && closeButton && dismissible) {
            onDismiss(id);
          } else {
            toggleExpand();
          }
        }
        onPress?.();
      },
      [
        enableStacking,
        numberOfToasts,
        position,
        rowWidth,
        closeButton,
        dismissible,
        onDismiss,
        id,
        toggleExpand,
        onPress,
      ],
    );

    // Front row on top: later rows in the stack sit progressively behind.
    const stackZIndex =
      position === 'top-center' ? -(index + 1) : -(numberOfToasts - index);

    return (
      <Animated.View
        style={[
          styles.anchor,
          anchorFor(position),
          { zIndex: stackZIndex },
          stackTransformStyle,
        ]}
      >
        <ToastSwipeHandler
          onRemove={onRemove}
          onBegin={onSwipeBegin}
          onFinalize={onSwipeFinalize}
          onPress={onSwipePress}
          // A pending promise toast cannot be swiped away mid-flight.
          enabled={!promiseOptions && dismissible}
          style={mergedStyles.toastContainer}
          unstyled={unstyled}
          important={important}
          position={positionProp}
        >
          <Animated.View style={rowStyle}>
            <Animated.View
              ref={measuredRef}
              onLayout={handleLayout}
              entering={entering}
              exiting={exiting}
            >
              {jsx ?? (
                <ToastContent
                  id={id}
                  title={title}
                  description={description}
                  variant={variant}
                  icon={icon}
                  icons={icons}
                  action={action}
                  cancel={cancel}
                  close={close}
                  closeButton={closeButton}
                  dismissible={dismissible}
                  richColors={richColors}
                  promiseOptions={promiseOptions}
                  styles={mergedStyles}
                  style={style}
                  unstyled={unstyled}
                  onDismiss={onDismiss}
                  actionButtonStyle={
                    actionButtonStyle ?? toastOptions.actionButtonStyle
                  }
                  actionButtonTextStyle={
                    actionButtonTextStyle ?? toastOptions.actionButtonTextStyle
                  }
                  cancelButtonStyle={
                    cancelButtonStyle ?? toastOptions.cancelButtonStyle
                  }
                  cancelButtonTextStyle={
                    cancelButtonTextStyle ?? toastOptions.cancelButtonTextStyle
                  }
                  allowFontScaling={allowFontScaling}
                  maxFontSizeMultiplier={maxFontSizeMultiplier}
                  backgroundComponent={backgroundComponent}
                />
              )}
            </Animated.View>
          </Animated.View>
        </ToastSwipeHandler>
      </Animated.View>
    );
  },
);

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    width: '100%',
  },
  anchorTop: { top: 0 },
  anchorBottom: { bottom: 0 },
  /**
   * The container is full-bleed for every position, so the vertical midpoint lives
   * on the ROW rather than on the container. `calculateToastPosition` then shifts
   * the front row up by half its height to sit ON the line rather than below it —
   * see its `centerShift`.
   */
  anchorCenter: { top: '50%' },
});

/** Which edge of the (full-bleed, padded) container the row hangs from. */
function anchorFor(position: ToastPosition) {
  if (position === 'bottom-center') {
    return styles.anchorBottom;
  }
  if (position === 'center') {
    return styles.anchorCenter;
  }
  return styles.anchorTop;
}
