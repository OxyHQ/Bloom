import React, { useEffect } from 'react';
import { type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';

import { StyledView } from '../styles/styled-primitives';

interface SpinnerIconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: ViewStyle;
}

/**
 * iOS-style SVG spinner with 8 rotating rectangles and an opacity gradient trail.
 *
 * `react-native-svg` and `react-native-reanimated` are both REQUIRED peers and
 * both are imported statically. Reanimated in particular must never be loaded at
 * runtime: the worklets Babel plugin performs build-time closure analysis
 * (`__closure` metadata) that fails on a runtime require, which crashes the UI
 * thread with "Tried to synchronously call a non-worklet function `addListener`".
 *
 * Native only — `SpinnerIcon.web.tsx` draws the same shape with CSS, so this
 * file is never reached by a web bundler.
 */
// The class lands on the node the PARENT lays out — the rotating box, which
// carries the size and the caller's `style` — not on the inner `<Svg>`, which is
// sized from `size` and cannot grow. That inner placement is the same two-node
// mistake `Button`, `Fab` and `FrostedIconButton` had, and the web fork already
// puts the class on the outer node.
const AnimatedStyledView = Animated.createAnimatedComponent(StyledView);

export const SpinnerIcon: React.FC<SpinnerIconProps> = ({
  color = 'currentColor',
  size = 26,
  className,
  style,
}) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 400, easing: Easing.linear }),
      -1,
      false,
    );
    // rotation is a stable shared value reference; withRepeat/withTiming/Easing
    // are module-level constants from a static import and are stable too.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // `rotation` MUST be in the deps array: on web without the worklets Babel
  // plugin, useAnimatedStyle does not auto-track shared-value reads and would
  // freeze at frame 1. Native (plugin present) auto-tracks and ignores the dep.
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }), [rotation]);

  return (
    <AnimatedStyledView
      className={className}
      style={[
        {
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
        },
        animatedStyle,
        style,
      ]}
    >
      <Svg viewBox="0 0 100 100" width={size} height={size}>
        <Rect fill={color} height="10" opacity="0" rx="5" ry="5" transform="rotate(-90 50 50)" width="28" x="67" y="45" />
        <Rect fill={color} height="10" opacity="0.125" rx="5" ry="5" transform="rotate(-45 50 50)" width="28" x="67" y="45" />
        <Rect fill={color} height="10" opacity="0.25" rx="5" ry="5" transform="rotate(0 50 50)" width="28" x="67" y="45" />
        <Rect fill={color} height="10" opacity="0.375" rx="5" ry="5" transform="rotate(45 50 50)" width="28" x="67" y="45" />
        <Rect fill={color} height="10" opacity="0.5" rx="5" ry="5" transform="rotate(90 50 50)" width="28" x="67" y="45" />
        <Rect fill={color} height="10" opacity="0.625" rx="5" ry="5" transform="rotate(135 50 50)" width="28" x="67" y="45" />
        <Rect fill={color} height="10" opacity="0.75" rx="5" ry="5" transform="rotate(180 50 50)" width="28" x="67" y="45" />
        <Rect fill={color} height="10" opacity="0.875" rx="5" ry="5" transform="rotate(225 50 50)" width="28" x="67" y="45" />
      </Svg>
    </AnimatedStyledView>
  );
};

SpinnerIcon.displayName = 'SpinnerIcon';
