import React, { useEffect } from 'react';
import { ActivityIndicator, View, type ViewStyle } from 'react-native';

// Lazy-loaded dependencies for the SVG spinner.
// Falls back to ActivityIndicator if react-native-svg or react-native-reanimated are not installed.
type SvgModuleType = typeof import('react-native-svg');
type ReanimatedType = typeof import('react-native-reanimated');

let svgModule: SvgModuleType | null = null;
let svgModuleResolved = false;
let reanimatedModule: ReanimatedType | null = null;
let reanimatedResolved = false;

function getSvgModule(): SvgModuleType | null {
  if (!svgModuleResolved) {
    svgModuleResolved = true;
    try {
      svgModule = require('react-native-svg');
    } catch {
      svgModule = null;
    }
  }
  return svgModule;
}

function getReanimated(): ReanimatedType | null {
  if (!reanimatedResolved) {
    reanimatedResolved = true;
    try {
      reanimatedModule = require('react-native-reanimated');
    } catch {
      reanimatedModule = null;
    }
  }
  return reanimatedModule;
}

interface SpinnerIconProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

/**
 * iOS-style SVG spinner with 8 rotating rectangles and an opacity gradient trail.
 * Requires react-native-svg and react-native-reanimated as peer dependencies.
 * Falls back to ActivityIndicator if either is missing.
 */
export const SpinnerIcon: React.FC<SpinnerIconProps> = ({
  color = '#005c67',
  size = 26,
  style,
}) => {
  const svg = getSvgModule();
  const reanimated = getReanimated();

  if (!svg || !reanimated) {
    return <ActivityIndicator size={size > 30 ? 'large' : 'small'} color={color} />;
  }

  const { default: Svg, Rect } = svg;
  const {
    default: Animated,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    Easing,
  } = reanimated;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const rotation = useSharedValue(0);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 400, easing: Easing.linear }),
      -1,
      false
    );
  }, [rotation, withRepeat, withTiming, Easing]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
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
    </Animated.View>
  );
};

SpinnerIcon.displayName = 'SpinnerIcon';
