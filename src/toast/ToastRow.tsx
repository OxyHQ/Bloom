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
 * THE ENTER ANIMATION IS IMPERATIVE, THE EXIT IS A LAYOUT ANIMATION. `rowStyle`
 * below fades and slides the row in from `enterTranslateY`; only `exiting` is
 * handed to reanimated. Moving the enter back onto `entering` reintroduces a
 * blocker where reanimated's web layout-animation cleanup freezes the row in
 * viewport coordinates and a later toast draws on top of it — the full mechanism
 * is documented in `animations.ts`.
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
  toastDefaults,
} from './constants';
import { useDynamicToastContext, useToastContext } from './context';
import { calculateStackScaleX } from './position-utils';
import { useAnimatedTarget } from './use-animated-target';
import { ToastContent } from './ToastContent';
import { ToastSwipeHandler } from './ToastSwipeHandler';
import { toastStore } from './toast-store';
import type { ToasterProps, ToastProps, ToastRef, ToastStyles } from './types';
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

    const stackScaleX = useAnimatedTarget(
      calculateStackScaleX({
        index,
        numberOfToasts,
        enableStacking,
        position,
        isExpanded,
        stackGap,
        screenWidth,
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

    // 0 -> 1 over the enter animation. Seeded at 1 (no animation) when a consumer
    // supplied their own `entering` builder or reduced motion is on, in which case
    // `enterTranslateY` is undefined and this style is the identity.
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

    const onSwipePress = React.useCallback(
      ({ x }: { x: number; y: number }) => {
        if (enableStacking && numberOfToasts > 1 && position !== 'center') {
          // On Android the RNGH tap wins the race against the nested Pressable,
          // so a press in the close-button strip has to dismiss explicitly.
          if (x > screenWidth - CLOSE_BUTTON_HIT_AREA) {
            if (isExpanded && closeButton && dismissible) {
              onDismiss(id);
            }
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
        screenWidth,
        isExpanded,
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
          position === 'bottom-center' ? styles.anchorBottom : styles.anchorTop,
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
});
