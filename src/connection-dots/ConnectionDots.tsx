import React, { memo, useEffect } from 'react';
import Animated, {
  Easing,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../theme/use-theme';
import { ConnectionDotsBase } from './ConnectionDotsBase';
import type { ConnectionDotsProps } from './types';

const DEFAULT_DOT_COUNT = 6;
const DEFAULT_DOT_SIZE = 6;
const WAVE_DURATION = 1400;
/** Opacity floor of a dot at the trough of the wave. */
const DOT_DIM = 0.25;

interface ShimmerDotProps {
  /** 0..1 phase offset of this dot within the wave. */
  phase: number;
  color: string;
  size: number;
  /** Shared 0..1 driver advanced once per loop for the whole row. */
  driver: SharedValue<number>;
}

/**
 * One dot. Its opacity is the shared driver phase-shifted by `phase`, mapped
 * through a triangle wave so the bright crest sweeps left→right across the row
 * (the "ellipsis shimmer").
 */
const ShimmerDot: React.FC<ShimmerDotProps> = ({ phase, color, size, driver }) => {
  // `driver`/`opacity` MUST be in the deps arrays: on web without the worklets
  // Babel plugin, useDerivedValue/useAnimatedStyle do not auto-track
  // shared-value reads and would freeze at frame 1. Native (plugin present)
  // auto-tracks and ignores the extra deps.
  const opacity = useDerivedValue(() => {
    // wrap into 0..1 then fold into a 0→1→0 triangle so the crest is a moving band
    const t = (driver.value + phase) % 1;
    const wave = 1 - Math.abs(t * 2 - 1);
    return interpolate(wave, [0, 1], [DOT_DIM, 1]);
  }, [phase, driver]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }), [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
};

/**
 * Native `ConnectionDots` — a consent/linking header rendering
 * `left · (animated ellipsis dots) · right`. The dots run a looping opacity wave
 * in the brand color (`fill-brand` → `theme.colors.primary`). Reduced-motion
 * (Reanimated's `useReducedMotion`, or the `reducedMotion` prop) renders the
 * dots static at full opacity.
 */
const ConnectionDotsComponent: React.FC<ConnectionDotsProps> = ({
  left,
  right,
  dotCount = DEFAULT_DOT_COUNT,
  dotSize = DEFAULT_DOT_SIZE,
  accessibilityLabel,
  className,
  style,
  reducedMotion,
}) => {
  const theme = useTheme();
  const systemReduceMotion = useReducedMotion();
  const reduce = reducedMotion ?? systemReduceMotion;
  const color = theme.colors.primary;

  const driver = useSharedValue(0);

  useEffect(() => {
    if (reduce) {
      driver.value = 0;
      return;
    }
    driver.value = withRepeat(
      withTiming(1, { duration: WAVE_DURATION, easing: Easing.linear }),
      -1,
      false,
    );
    // driver is a stable shared-value ref; withRepeat/withTiming/Easing are
    // module-level constants from a static import.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  const count = Math.max(1, Math.floor(dotCount));

  const dots = reduce
    ? Array.from({ length: count }, (_, i) => (
        <Animated.View
          key={i}
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: color,
          }}
        />
      ))
    : Array.from({ length: count }, (_, i) => (
        <ShimmerDot
          key={i}
          phase={i / count}
          color={color}
          size={dotSize}
          driver={driver}
        />
      ));

  return (
    <ConnectionDotsBase
      left={left}
      right={right}
      dots={dots}
      accessibilityLabel={accessibilityLabel}
      className={className}
      style={style}
    />
  );
};

export const ConnectionDots = memo(ConnectionDotsComponent);
ConnectionDots.displayName = 'ConnectionDots';
