/**
 * Derived from sonner-native v0.26.4 — src/gestures.tsx
 * (MIT © Gunnar Torfi Steinarsson). See the top-level NOTICE.
 *
 * W2 — the animated style reads `translate`, `direction`, `position`,
 * `windowWidth` and `isAndroid`; ALL of them are in the dependency array. On web
 * without the worklets babel plugin reanimated re-runs the mapper on its deps
 * rather than on auto-tracked reads, so a missing dep freezes the swipe transform
 * at its first frame (upstream omits `position` and `isAndroid`, so a toast that
 * changes position mid-life swipes the wrong way).
 */
import * as React from 'react';
import {
  Platform,
  StyleSheet,
  useWindowDimensions,
  type ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  LinearTransition,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { easeInOutCircFn } from './animations';
import { useToastContext } from './context';
import type { ToastPosition, ToastProps } from './types';

/** Fraction of the screen a horizontal swipe must cross to dismiss. */
const HORIZONTAL_DISMISS_FRACTION = 0.25;
/** Below this the gesture reads as a tap, so the row springs back. */
const TAP_SLOP = 16;
/** Vertical travel that fades a row fully out. */
const VERTICAL_FADE_DISTANCE = 60;
const SPRING_BACK_EASING_BOUNCINESS = 0.8;
const WRONG_DIRECTION_SPRING_DURATION = 400;

type ToastSwipeHandlerProps = Pick<ToastProps, 'important'> & {
  onRemove: () => void;
  style?: ViewStyle | (ViewStyle | undefined)[];
  onBegin: () => void;
  onFinalize: () => void;
  enabled?: boolean;
  unstyled?: boolean;
  position?: ToastPosition;
  onPress: (args: { x: number; y: number }) => void;
};

export const ToastSwipeHandler: React.FC<
  React.PropsWithChildren<ToastSwipeHandlerProps>
> = ({
  children,
  onRemove,
  style,
  onBegin,
  onFinalize,
  enabled,
  unstyled,
  important,
  position: positionProps,
  onPress,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const translate = useSharedValue(0);
  const { swipeToDismissDirection: direction, position: positionCtx } =
    useToastContext();
  const position = positionProps ?? positionCtx;
  const isAndroid = Platform.OS === 'android';

  const pan = Gesture.Pan()
    .onBegin(() => {
      'worklet';

      if (!enabled) {
        return;
      }
      runOnJS(onBegin)();
    })
    .onChange((event) => {
      'worklet';

      if (!enabled) {
        return;
      }

      if (direction === 'left' && event.translationX < 0) {
        translate.value = event.translationX;
        return;
      }

      if (direction === 'up') {
        const isBottomPosition = position === 'bottom-center';
        const rawTranslation = event.translationY * (isBottomPosition ? -1 : 1);

        // Negative is the dismissal direction; dragging the other way meets
        // progressive resistance instead of moving freely.
        if (rawTranslation < 0) {
          translate.value = rawTranslation;
        } else if (rawTranslation > 0) {
          translate.value = elasticResistance(rawTranslation);
        }
      }
    })
    .onFinalize(() => {
      'worklet';

      if (!enabled) {
        return;
      }

      const springBack = (duration?: number) => {
        'worklet';
        translate.value = withTiming(0, {
          easing: Easing.elastic(SPRING_BACK_EASING_BOUNCINESS),
          duration,
        });
      };

      const dismiss = () => {
        'worklet';
        translate.value = withTiming(
          -windowWidth,
          { easing: Easing.inOut(Easing.ease) },
          (isDone) => {
            if (isDone) {
              runOnJS(onRemove)();
            }
          },
        );
      };

      if (direction === 'left') {
        if (Math.abs(translate.value) < TAP_SLOP) {
          springBack();
        } else if (translate.value < -windowWidth * HORIZONTAL_DISMISS_FRACTION) {
          dismiss();
        } else {
          springBack();
        }
      } else if (direction === 'up') {
        if (translate.value > 0) {
          // Dragged against the dismissal direction — always settle back.
          springBack(WRONG_DIRECTION_SPRING_DURATION);
        } else if (Math.abs(translate.value) < TAP_SLOP) {
          springBack();
        } else {
          dismiss();
        }
      }

      runOnJS(onFinalize)();
    });

  const tap = Gesture.Tap().onEnd((event) => {
    'worklet';
    runOnJS(onPress)({ x: event.x, y: event.y });
  });

  const animatedStyle = useAnimatedStyle(() => {
    const transform =
      direction === 'left'
        ? { translateX: translate.value }
        : { translateY: translate.value * (position === 'bottom-center' ? -1 : 1) };

    return {
      transform: [transform],
      // Android composites the fade poorly against the elevation shadow, so the
      // row stays opaque there and relies on the translate alone.
      opacity: isAndroid
        ? 1
        : interpolate(
            translate.value,
            [0, direction === 'left' ? -windowWidth : -VERTICAL_FADE_DISTANCE],
            [1, 0],
          ),
    };
  }, [direction, translate, windowWidth, position, isAndroid]);

  return (
    <GestureDetector gesture={Gesture.Race(tap, pan)}>
      <Animated.View
        style={[
          animatedStyle,
          unstyled ? undefined : styles.centered,
          styles.fullWidth,
          style,
        ]}
        // W9 — on web `LinearTransition`'s easing degrades to CSS `ease` because
        // a `bezierFn` result carries no easing-name symbol for the CSS mapper.
        // Accepted: the transition still runs, only its curve differs.
        layout={LinearTransition.easing(easeInOutCircFn)}
        // https://reactnative.dev/docs/accessibility#aria-live-android
        aria-live={important ? 'assertive' : 'polite'}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  centered: { justifyContent: 'center' },
  fullWidth: { width: '100%' },
});

/**
 * Apple-style progressive resistance: the further the drag goes the less the row
 * follows it.
 */
function elasticResistance(distance: number) {
  'worklet';
  const BASE_RESISTANCE = 0.4;
  const PROGRESSIVE_DAMPENING = 0.02;
  return (
    distance * BASE_RESISTANCE * (1 / (1 + distance * PROGRESSIVE_DAMPENING))
  );
}
