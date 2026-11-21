/**
 * Derived from sonner-native v0.26.4 — src/gestures.tsx
 * (MIT © Gunnar Torfi Steinarsson).
 *
 * W2 — the swipe is Bloom's gesture layer (`useSwipe`): the row's offset is a
 * motion value its pan writes, bound through the one mapper (`useMotionStyle`),
 * which lists every value it reads. Both axes stay bound, so a toast that
 * changes position mid-life still swipes the right way.
 *
 * W12 — this wrapper is THE row box, so it is where `TOAST_MAX_ROW_WIDTH` caps
 * and centres the toast. Capping here rather than on `ToastContent`'s card
 * covers `toast.custom` JSX and `unstyled` rows too, which never reach that
 * card. Every distance the gesture measures is a fraction of the capped
 * `rowWidth`, not of the window — see the constant.
 *
 * W13 — being THE row box also makes it the hover target: `useStackHover`'s
 * handlers go here so a pointer over ANY row counts as a pointer over the stack.
 * The handlers are empty on native.
 */
import type * as React from 'react';
import { useCallback } from 'react';
import { Platform, StyleSheet, useWindowDimensions, type ViewStyle } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, LinearTransition } from 'react-native-reanimated';

import { useSwipe, type SwipeDirection } from '../motion/gestures';
import { useDerivedMotionValue, useMotionStyle, useMotionValue } from '../motion/motion-value';
import { sampledTiming } from '../motion/timing';

import { easeInOutCircFn } from './animations';
import { TOAST_MAX_ROW_WIDTH } from './constants';
import { useToastContext } from './context';
import type { ToastPosition, ToastProps } from './types';
import { useStackHover } from './use-stack-hover';

/** Fraction of the row a horizontal swipe must cross to dismiss. */
const HORIZONTAL_DISMISS_FRACTION = 0.25;
/** Vertical travel that fades a row fully out. */
const VERTICAL_FADE_DISTANCE = 60;
const SPRING_BACK_EASING_BOUNCINESS = 0.8;
const WRONG_DIRECTION_SPRING_DURATION = 400;
/** Reanimated's `withTiming` default, which the toast's swipe motions always used. */
const SWIPE_DURATION = 300;

// The swipe's motions as both engines play them: the curves sampled, since an
// elastic settle and a symmetric ease have no cubic-bezier.
const springBackEasing = Easing.elastic(SPRING_BACK_EASING_BOUNCINESS);
const SPRING_BACK = sampledTiming(SWIPE_DURATION, (t) => springBackEasing(t));
const SPRING_BACK_AGAINST = sampledTiming(WRONG_DIRECTION_SPRING_DURATION, (t) =>
  springBackEasing(t),
);
const dismissEasing = Easing.inOut(Easing.ease);
const DISMISS = sampledTiming(SWIPE_DURATION, (t) => dismissEasing(t));

type ToastSwipeHandlerProps = Pick<ToastProps, 'important' | 'variant'> & {
  onRemove: () => void;
  style?: ViewStyle | (ViewStyle | undefined)[];
  onBegin: () => void;
  onFinalize: () => void;
  enabled?: boolean;
  unstyled?: boolean;
  position?: ToastPosition;
  onPress: (args: { x: number; y: number }) => void;
};

export const ToastSwipeHandler: React.FC<React.PropsWithChildren<ToastSwipeHandlerProps>> = ({
  children,
  onRemove,
  style,
  onBegin,
  onFinalize,
  enabled,
  unstyled,
  important,
  variant,
  position: positionProps,
  onPress,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  // The row is `width: '100%'` up to the cap, so this is its real width.
  const rowWidth = Math.min(windowWidth, TOAST_MAX_ROW_WIDTH);
  const {
    swipeToDismissDirection: direction,
    position: positionCtx,
    enableStacking,
  } = useToastContext();
  const position = positionProps ?? positionCtx;
  const isBottomPosition = position === 'bottom-center' || position === 'bottom-right';
  const isAndroid = Platform.OS === 'android';
  // W13 — hover lives on THE ROW BOX, so hovering any row counts as hovering the
  // stack. Empty on native; see `use-stack-hover.native.ts`.
  const hoverProps = useStackHover({ enableStacking });

  // `up` means toward the toast's own edge: down for a bottom stack.
  const swipeDirection: SwipeDirection =
    direction === 'left' ? 'left' : isBottomPosition ? 'down' : 'up';
  const swipe = useSwipe(swipeDirection, onRemove, {
    distance: windowWidth,
    // A horizontal swipe must cross a quarter of the ROW, not of the window; a
    // vertical one only has to read as more than a tap (`useSwipe`'s default),
    // and meets progressive resistance the other way.
    threshold: direction === 'left' ? rowWidth * HORIZONTAL_DISMISS_FRACTION : undefined,
    away: DISMISS,
    back: SPRING_BACK,
    backAgainst: SPRING_BACK_AGAINST,
    enabled,
    onBegin,
    onFinalize,
    onTap: onPress,
  });

  // Android composites the fade poorly against the elevation shadow, so the row
  // stays opaque there and relies on the translate alone. So does the web: the
  // toast paints the material, and an opacity above it would make a backdrop
  // root and turn it flat for the whole drag.
  const fades = !isAndroid && Platform.OS !== 'web';
  const fadeDistance = direction === 'left' ? rowWidth : VERTICAL_FADE_DISTANCE;
  const fade = useCallback(
    (offset: number) => {
      'worklet';
      return fades ? 1 - Math.min(Math.abs(offset) / fadeDistance, 1) : 1;
    },
    [fades, fadeDistance],
  );
  const opacity = useDerivedMotionValue([swipe.value], fade);
  // Both axes are bound for the row's life, so a toast whose direction or
  // position changes mid-life still moves the right way.
  const rest = useMotionValue(0);
  const horizontal = direction === 'left';
  const motion = useMotionStyle({
    translateX: horizontal ? swipe.value : rest,
    translateY: horizontal ? rest : swipe.value,
    opacity,
  });

  return (
    <GestureDetector gesture={swipe.gesture}>
      <Animated.View
        ref={motion.ref}
        style={[motion.style, unstyled ? undefined : styles.centered, styles.rowBox, style]}
        {...hoverProps}
        // W9 — on web `LinearTransition`'s easing degrades to CSS `ease` because
        // a `bezierFn` result carries no easing-name symbol for the CSS mapper.
        // Accepted: the transition still runs, only its curve differs.
        layout={LinearTransition.easing(easeInOutCircFn)}
        // The row is the toast's live region (`aria-live` on a View reaches
        // native as `accessibilityLiveRegion`): a screen reader says its text,
        // not its buttons, once when it appears or changes. See `toastLiveness`.
        aria-live={toastLiveness(important, variant)}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  centered: { justifyContent: 'center' },
  /**
   * `alignSelf` is load-bearing: the parent anchor stretches its children, but a
   * child with a definite cross size (`width: '100%'` capped by `maxWidth`) is
   * not stretched — it would sit against the left edge without this.
   */
  rowBox: {
    width: '100%',
    maxWidth: TOAST_MAX_ROW_WIDTH,
    alignSelf: 'center',
  },
});

/**
 * How a toast is announced. Polite by default: a toast is news the user did not
 * ask to be interrupted by. An `error` toast is assertive — something the user
 * started failed and they are about to act on the wrong belief — and so is one
 * the caller marks `important`. An explicit `important: false` keeps an error
 * polite: the caller's word wins over the variant's, as `aria-live` wins over a
 * role's implied politeness. A promise toast changes variant in place, so its
 * `loading` line is polite and its rejection is said assertively.
 */
export function toastLiveness(
  important: boolean | undefined,
  variant: ToastProps['variant'],
): 'polite' | 'assertive' {
  return (important ?? variant === 'error') ? 'assertive' : 'polite';
}
