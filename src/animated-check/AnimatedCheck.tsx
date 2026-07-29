import React, { forwardRef, useCallback, useImperativeHandle } from 'react';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { useTheme } from '../theme';

/** Square viewBox the ring + check are drawn on. */
const VIEW_BOX = 52;
/** Ring radius within the viewBox. */
const CIRCLE_RADIUS = 24;
/** Ring circumference (2·π·r ≈ 150.8) rounded up so the dash fully hides it. */
const CIRCLE_LENGTH = 166;
/** Approximate path length of the check stroke. */
const CHECK_LENGTH = 48;
/** The check glyph, drawn on the 52×52 canvas. */
const CHECK_PATH = 'M14.1 27.2l7.1 7.2 16.7-16.8';
const STROKE_WIDTH = 4;
/** Ring draw-on duration (ms). */
const CIRCLE_DURATION = 500;
/** Check draw-on duration (ms), started once the ring completes. */
const CHECK_DURATION = 300;

export interface AnimatedCheckRef {
  /** Replays the draw-on animation from the start. */
  play: () => void;
}

export interface AnimatedCheckProps {
  /** Width and height in px. Defaults to `24`. */
  size?: number;
  /** Stroke color of the ring and check. Defaults to the theme success color. */
  color?: string;
}

// `Animated.createAnimatedComponent` must be called once per underlying
// component — calling it per render would remount the element and break the
// animation — so the wrappers are built once at module scope.
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * A draw-on checkmark: a ring strokes on, then the check strokes in. Expose a
 * ref and call `ref.current?.play()` to (re)play — e.g. on a successful submit.
 * Ported from Bluesky's `AnimatedCheck`.
 */
export const AnimatedCheck = forwardRef<AnimatedCheckRef, AnimatedCheckProps>(
  function AnimatedCheck({ size = 24, color }, ref) {
    const theme = useTheme();
    const resolvedColor = color ?? theme.colors.success;

    const circleProgress = useSharedValue(0);
    const checkProgress = useSharedValue(0);

    // The progress shared values MUST be in the deps arrays: this component has
    // no `.web` fork, so it runs on web (RN-Web) where the worklets Babel plugin
    // is absent and useAnimatedProps does not auto-track shared-value reads —
    // an empty deps array freezes the draw-on at frame 1. Native (plugin
    // present) auto-tracks and ignores the extra deps.
    const circleAnimatedProps = useAnimatedProps(() => ({
      strokeDashoffset: CIRCLE_LENGTH - circleProgress.value * CIRCLE_LENGTH,
    }), [circleProgress]);
    const checkAnimatedProps = useAnimatedProps(() => ({
      strokeDashoffset: CHECK_LENGTH - CHECK_LENGTH * checkProgress.value,
    }), [checkProgress]);

    const play = useCallback(() => {
      circleProgress.value = 0;
      checkProgress.value = 0;
      circleProgress.value = withTiming(1, {
        duration: CIRCLE_DURATION,
        easing: Easing.linear,
      });
      checkProgress.value = withDelay(
        CIRCLE_DURATION,
        withTiming(1, { duration: CHECK_DURATION, easing: Easing.linear }),
      );
    }, [circleProgress, checkProgress]);

    useImperativeHandle(ref, () => ({ play }), [play]);

    return (
      <Svg fill="none" viewBox={`0 0 ${VIEW_BOX} ${VIEW_BOX}`} width={size} height={size}>
        <AnimatedCircle
          animatedProps={circleAnimatedProps}
          cx={VIEW_BOX / 2}
          cy={VIEW_BOX / 2}
          r={CIRCLE_RADIUS}
          fill="none"
          stroke={resolvedColor}
          strokeWidth={STROKE_WIDTH}
          strokeDasharray={CIRCLE_LENGTH}
        />
        <AnimatedPath
          animatedProps={checkAnimatedProps}
          d={CHECK_PATH}
          stroke={resolvedColor}
          strokeWidth={STROKE_WIDTH}
          strokeDasharray={CHECK_LENGTH}
        />
      </Svg>
    );
  },
);

AnimatedCheck.displayName = 'AnimatedCheck';
