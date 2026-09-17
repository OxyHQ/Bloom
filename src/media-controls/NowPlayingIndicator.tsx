import React, { memo, useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../theme/use-theme';
import { resolveMediaControlsPaint } from './shared';
import type { NowPlayingIndicatorProps } from './types';

/**
 * The equalizer bars beside the row that is playing.
 *
 * Bars are 20% of `size` wide (at least 2px) with rounded tops, bottom-aligned.
 * Playing, each bar swings between its own low and high height on its own
 * period, so the group never repeats in step. Paused — or with reduced motion
 * on — the bars stand still at their resting heights, which still reads as
 * "this one". Colour: the theme accent.
 *
 * Accessibility: one `img` named "Now playing".
 */

/** [rest, low, high, period ms] per bar, as fractions of `size`. */
const BAR_MOTION: ReadonlyArray<readonly [number, number, number, number]> = [
  [0.55, 0.25, 0.9, 420],
  [0.9, 0.4, 1, 540],
  [0.4, 0.2, 0.75, 360],
  [0.7, 0.3, 0.95, 480],
];

function Bar({
  size,
  width,
  color,
  motion,
  animate,
}: {
  size: number;
  width: number;
  color: string;
  motion: readonly [number, number, number, number];
  animate: boolean;
}) {
  const [rest, low, high, period] = motion;
  const fraction = useSharedValue(rest);

  useEffect(() => {
    cancelAnimation(fraction);
    if (!animate) {
      fraction.value = rest;
      return;
    }
    const easing = Easing.inOut(Easing.quad);
    fraction.value = withRepeat(
      withSequence(
        withTiming(high, { duration: period / 2, easing }),
        withTiming(low, { duration: period / 2, easing }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(fraction);
  }, [animate, fraction, rest, low, high, period]);

  const animated = useAnimatedStyle(
    () => ({ height: Math.max(width, fraction.value * size) }),
    [fraction, width, size],
  );

  return (
    <Animated.View
      style={[
        {
          width,
          backgroundColor: color,
          borderTopLeftRadius: width / 2,
          borderTopRightRadius: width / 2,
        },
        animated,
      ]}
    />
  );
}

function NowPlayingIndicatorComponent({
  playing = true,
  size = 16,
  bars = 4,
  color,
  label = 'Now playing',
  style,
  testID,
}: NowPlayingIndicatorProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveMediaControlsPaint(theme), [theme]);
  const reducedMotion = useReducedMotion();
  const animate = playing && !reducedMotion;
  const barWidth = Math.max(2, Math.round(size * 0.2));

  return (
    <View
      role="img"
      accessibilityLabel={label}
      style={[
        {
          width: size,
          height: size,
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          paddingLeft: bars === 3 ? Math.round(size * 0.1) : 0,
          paddingRight: bars === 3 ? Math.round(size * 0.1) : 0,
        },
        style,
      ]}
      testID={testID}
    >
      {BAR_MOTION.slice(0, bars).map((motion, index) => (
        <Bar
          key={index}
          size={size}
          width={barWidth}
          color={color ?? paint.accent}
          motion={motion}
          animate={animate}
        />
      ))}
    </View>
  );
}

export const NowPlayingIndicator = memo(NowPlayingIndicatorComponent);
NowPlayingIndicator.displayName = 'NowPlayingIndicator';
