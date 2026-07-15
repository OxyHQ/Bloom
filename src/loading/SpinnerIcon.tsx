import React, { useEffect } from 'react';
import { ActivityIndicator, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { lazyRequire } from '../utils/lazy-require';

// react-native-svg is loaded lazily so the loading module can fall back to
// ActivityIndicator when the host app doesn't ship SVG support. Reanimated,
// by contrast, MUST be statically imported: the worklets Babel plugin
// performs build-time closure analysis (`__closure` metadata) that fails on
// runtime requires, which would crash the UI thread with
// "Tried to synchronously call a non-worklet function `addListener`".
type SvgModuleType = typeof import('react-native-svg');

const getSvgModule = lazyRequire<SvgModuleType>('react-native-svg');

interface SpinnerIconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: ViewStyle;
}

type AnimatedSpinnerProps = Omit<SpinnerIconProps, 'className'> & {
  className?: string;
  svg: NonNullable<SvgModuleType>;
};

/**
 * Inner component that unconditionally calls Reanimated hooks.
 * Only rendered when react-native-svg is available.
 */
const AnimatedSpinner: React.FC<AnimatedSpinnerProps> = ({
  color = 'currentColor',
  size = 26,
  className,
  style,
  svg,
}) => {
  const { default: Svg, Rect } = svg;

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
    <Animated.View
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
      <Svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        {...(className ? ({ className } as Record<string, string>) : {})}
      >
        <Rect fill={color} height="10" opacity="0" rx="5" ry="5" transform="rotate(-90 50 50)" width="28" x="67" y="45" />
        <Rect fill={color} height="10" opacity="0.125" rx="5" ry="5" transform="rotate(-45 50 50)" width="28" x="67" y="45" />
        <Rect fill={color} height="10" opacity="0.25" rx="5" ry="5" transform="rotate(0 50 50)" width="28" x="67" y="45" />
        <Rect fill={color} height="10" opacity="0.375" rx="5" ry="5" transform="rotate(45 50 50)" width="28" x="67" y="45" />
        <Rect fill={color} height="10" opacity="0.5" rx="5" ry="5" transform="rotate(90 50 50)" width="28" x="67" y="45" />
        <Rect fill={color} height="10" opacity="0.625" rx="5" ry="5" transform="rotate(135 50 50)" width="28" x="67" y="45" />
        <Rect fill={color} height="10" opacity="0.75" rx="5" ry="5" transform="rotate(180 50 50)" width="28" x="67" y="45" />
        <Rect fill={color} height="10" opacity="0.875" rx="5" ry="5" transform="rotate(225 50 50)" width="28" x="67" y="45" />
      </Svg>
    </Animated.View>
  );
};

/**
 * iOS-style SVG spinner with 8 rotating rectangles and an opacity gradient trail.
 * Requires react-native-svg (lazy) and react-native-reanimated (static).
 * Falls back to ActivityIndicator if react-native-svg is missing.
 */
export const SpinnerIcon: React.FC<SpinnerIconProps> = ({
  color = 'currentColor',
  size = 26,
  className,
  style,
}) => {
  const svg = getSvgModule();

  if (!svg) {
    return <ActivityIndicator size={size > 30 ? 'large' : 'small'} color={color} />;
  }

  return (
    <AnimatedSpinner
      color={color}
      size={size}
      className={className}
      style={style}
      svg={svg}
    />
  );
};

SpinnerIcon.displayName = 'SpinnerIcon';
