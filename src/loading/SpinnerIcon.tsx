import React, { useEffect } from 'react';
import { ActivityIndicator, type ViewStyle } from 'react-native';

import { lazyRequire } from '../utils/lazy-require';

// Lazy-loaded dependencies for the SVG spinner.
// Falls back to ActivityIndicator if react-native-svg or react-native-reanimated are not installed.
type SvgModuleType = typeof import('react-native-svg');
type ReanimatedType = typeof import('react-native-reanimated');

const getSvgModule = lazyRequire<SvgModuleType>('react-native-svg');
const getReanimated = lazyRequire<ReanimatedType>('react-native-reanimated');

interface SpinnerIconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: ViewStyle;
}

type AnimatedSpinnerProps = Omit<SpinnerIconProps, 'className'> & {
  className?: string;
  svg: NonNullable<SvgModuleType>;
  reanimated: NonNullable<ReanimatedType>;
};

/**
 * Inner component that unconditionally calls Reanimated hooks.
 * Only rendered when both react-native-svg and react-native-reanimated are available.
 */
const AnimatedSpinner: React.FC<AnimatedSpinnerProps> = ({
  color = 'currentColor',
  size = 26,
  className,
  style,
  svg,
  reanimated,
}) => {
  const { default: Svg, Rect } = svg;
  const {
    default: Animated,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    Easing,
  } = reanimated;

  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 400, easing: Easing.linear }),
      -1,
      false,
    );
    // Reanimated shared values are stable references; withRepeat/withTiming/Easing
    // are module-level functions from the lazily-loaded module and are stable too.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

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
      {/* @ts-expect-error className is added by NativeWind cssInterop at runtime */}
      <Svg viewBox="0 0 100 100" width={size} height={size} className={className}>
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
 * Requires react-native-svg and react-native-reanimated as peer dependencies.
 * Falls back to ActivityIndicator if either is missing.
 */
export const SpinnerIcon: React.FC<SpinnerIconProps> = ({
  color = 'currentColor',
  size = 26,
  className,
  style,
}) => {
  const svg = getSvgModule();
  const reanimated = getReanimated();

  if (!svg || !reanimated) {
    return <ActivityIndicator size={size > 30 ? 'large' : 'small'} color={color} />;
  }

  return (
    <AnimatedSpinner
      color={color}
      size={size}
      className={className}
      style={style}
      svg={svg}
      reanimated={reanimated}
    />
  );
};

SpinnerIcon.displayName = 'SpinnerIcon';
