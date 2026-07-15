import React, { forwardRef, useCallback, useImperativeHandle, useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { getSvgModule } from '../avatar/svg-module';
import { useTheme } from '../theme';

/** The resolved `react-native-svg` module (non-null branch). */
type SvgModule = NonNullable<ReturnType<typeof getSvgModule>>;

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
// component (calling it per-render would remount and break the animation).
// react-native-svg is a lazy/optional peer, so we build the animated wrappers
// the first time it resolves and cache them at module scope.
function buildAnimatedSvg(svg: SvgModule) {
  return {
    Circle: Animated.createAnimatedComponent(svg.Circle),
    Path: Animated.createAnimatedComponent(svg.Path),
  };
}

let animatedSvgCache: ReturnType<typeof buildAnimatedSvg> | null = null;

function getAnimatedSvg(svg: SvgModule): ReturnType<typeof buildAnimatedSvg> {
  if (!animatedSvgCache) animatedSvgCache = buildAnimatedSvg(svg);
  return animatedSvgCache;
}

interface AnimatedCheckSvgProps {
  size: number;
  color: string;
  svg: SvgModule;
}

/** The animated SVG implementation, rendered only when react-native-svg exists. */
const AnimatedCheckSvg = forwardRef<AnimatedCheckRef, AnimatedCheckSvgProps>(
  function AnimatedCheckSvg({ size, color, svg }, ref) {
    const { default: Svg } = svg;
    const { Circle, Path } = getAnimatedSvg(svg);

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
        <Circle
          animatedProps={circleAnimatedProps}
          cx={VIEW_BOX / 2}
          cy={VIEW_BOX / 2}
          r={CIRCLE_RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          strokeDasharray={CIRCLE_LENGTH}
        />
        <Path
          animatedProps={checkAnimatedProps}
          d={CHECK_PATH}
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          strokeDasharray={CHECK_LENGTH}
        />
      </Svg>
    );
  },
);

interface StaticCheckProps {
  size: number;
  color: string;
}

/**
 * Static fallback rendered when react-native-svg is unavailable (e.g. a web
 * bundle that omits the optional peer). Draws a plain Unicode check so the
 * component still communicates "done"; `play()` is a no-op.
 */
const StaticCheck = forwardRef<AnimatedCheckRef, StaticCheckProps>(
  function StaticCheck({ size, color }, ref) {
    useImperativeHandle(ref, () => ({ play: () => undefined }), []);
    return (
      <Text
        accessibilityElementsHidden
        style={[styles.staticCheck, { width: size, fontSize: size * 0.8, lineHeight: size, color }]}
      >
        {'✓'}
      </Text>
    );
  },
);

/**
 * A draw-on checkmark: a ring strokes on, then the check strokes in. Expose a
 * ref and call `ref.current?.play()` to (re)play — e.g. on a successful submit.
 * Ported from Bluesky's `AnimatedCheck`.
 */
export const AnimatedCheck = forwardRef<AnimatedCheckRef, AnimatedCheckProps>(
  function AnimatedCheck({ size = 24, color }, ref) {
    const theme = useTheme();
    const resolvedColor = color ?? theme.colors.success;
    const svg = useMemo(() => getSvgModule(), []);

    if (!svg) {
      return <StaticCheck ref={ref} size={size} color={resolvedColor} />;
    }
    return <AnimatedCheckSvg ref={ref} size={size} color={resolvedColor} svg={svg} />;
  },
);

AnimatedCheck.displayName = 'AnimatedCheck';

const styles = StyleSheet.create({
  staticCheck: {
    textAlign: 'center',
    fontWeight: '700',
  },
});
