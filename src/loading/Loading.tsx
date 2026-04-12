import React, { memo, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, type DimensionValue } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { animation } from '../styles/tokens';
import { lazyRequire } from '../utils/lazy-require';
import { SpinnerIcon } from './SpinnerIcon';
import type {
  LoadingProps,
  SpinnerLoadingProps,
  TopLoadingProps,
  SkeletonLoadingProps,
  InlineLoadingProps,
} from './types';

const SIZE_CONFIG = {
  small: { spinner: 20, text: 13 },
  medium: { spinner: 24, text: 15 },
  large: { spinner: 44, text: 16 },
} as const;

// Lazy-loaded reanimated for the top variant
type ReanimatedType = typeof import('react-native-reanimated');
const getReanimated = lazyRequire<ReanimatedType>('react-native-reanimated');

const SpinnerLoading: React.FC<SpinnerLoadingProps> = ({
  size = 'medium',
  color,
  className,
  text,
  textStyle,
  style,
  showText = true,
  iconSize,
  spinnerIcon,
  testID,
}) => {
  const theme = useTheme();
  const sizeConfig = SIZE_CONFIG[size];
  const effectiveIconSize = iconSize ?? sizeConfig.spinner;
  const spinnerColor = className ? 'currentColor' : (color ?? theme.colors.primary);
  const textColor = color ?? theme.colors.textSecondary;

  return (
    <View style={[styles.container, style]} testID={testID}>
      {spinnerIcon ?? <SpinnerIcon size={effectiveIconSize} color={spinnerColor} className={className} />}
      {showText && text && (
        <Text
          style={[
            styles.text,
            { color: textColor, fontSize: sizeConfig.text, marginTop: 8 },
            textStyle,
          ]}
        >
          {text}
        </Text>
      )}
    </View>
  );
};

/**
 * Inner component for TopLoading that requires react-native-reanimated.
 * Extracted to a dedicated component so all hooks are called unconditionally,
 * satisfying the Rules of Hooks and React Compiler requirements.
 */
type AnimatedTopLoadingProps = {
  showLoading: boolean;
  targetHeight: number;
  effectiveIconSize: number;
  spinnerColor: string;
  spinnerIcon: React.ReactNode | undefined;
  style: TopLoadingProps['style'];
  testID: string | undefined;
  reanimated: NonNullable<ReturnType<typeof getReanimated>>;
};

const AnimatedTopLoading: React.FC<AnimatedTopLoadingProps> = ({
  showLoading,
  targetHeight,
  effectiveIconSize,
  spinnerColor,
  spinnerIcon,
  style,
  testID,
  reanimated,
}) => {
  const { default: Animated, useAnimatedStyle, useSharedValue, withTiming, Easing } = reanimated;

  const height = useSharedValue(showLoading ? targetHeight : 0);
  const opacity = useSharedValue(showLoading ? 1 : 0);
  const translateY = useSharedValue(showLoading ? 0 : -targetHeight);

  useEffect(() => {
    const timingConfig = { duration: animation.duration.slow, easing: Easing.out(Easing.cubic) };
    height.value = withTiming(showLoading ? targetHeight : 0, timingConfig);
    opacity.value = withTiming(showLoading ? 1 : 0, timingConfig);
    translateY.value = withTiming(showLoading ? 0 : -targetHeight, timingConfig);
    // Easing, withTiming: module-level constants from lazily-resolved reanimated, stable.
    // height/opacity/translateY: shared value objects, stable references.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLoading, targetHeight]);

  const containerAnimated = useAnimatedStyle(() => ({
    height: height.value,
  }));

  const innerAnimated = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.topContainer, containerAnimated]} testID={testID}>
      <Animated.View style={[styles.topLoadingView, { height: targetHeight }, innerAnimated, style]}>
        {spinnerIcon ?? <SpinnerIcon size={effectiveIconSize} color={spinnerColor} />}
      </Animated.View>
    </Animated.View>
  );
};

const TopLoading: React.FC<TopLoadingProps> = ({
  size = 'medium',
  color,
  style,
  showLoading = true,
  iconSize,
  heightOffset = 0,
  spinnerIcon,
  testID,
}) => {
  const theme = useTheme();
  const sizeConfig = SIZE_CONFIG[size];
  const effectiveIconSize = iconSize ?? sizeConfig.spinner;
  const targetHeight = Math.max(0, effectiveIconSize + sizeConfig.spinner + heightOffset);
  const spinnerColor = color ?? theme.colors.primary;

  const reanimated = getReanimated();

  if (!reanimated) {
    // Non-animated fallback when reanimated is not available
    if (!showLoading) return null;
    return (
      <View style={[styles.topContainer, { height: targetHeight }, style]} testID={testID}>
        <View style={[styles.topLoadingView, { height: targetHeight }]}>
          {spinnerIcon ?? <SpinnerIcon size={effectiveIconSize} color={spinnerColor} />}
        </View>
      </View>
    );
  }

  return (
    <AnimatedTopLoading
      showLoading={showLoading}
      targetHeight={targetHeight}
      effectiveIconSize={effectiveIconSize}
      spinnerColor={spinnerColor}
      spinnerIcon={spinnerIcon}
      style={style}
      testID={testID}
      reanimated={reanimated}
    />
  );
};

const SkeletonLoading: React.FC<SkeletonLoadingProps> = ({
  lines = 3,
  width = '100%',
  lineHeight = 16,
  style,
  testID,
}) => {
  const theme = useTheme();
  const skeletonColor = theme.colors.backgroundSecondary;

  const skeletonLines = useMemo(
    () =>
      Array.from({ length: lines }, (_, index) => (
        <View
          key={index}
          style={[
            styles.skeletonLine,
            {
              width: (typeof width === 'string' ? width : `${width}%`) as DimensionValue,
              height: lineHeight,
              backgroundColor: skeletonColor,
              marginBottom: index < lines - 1 ? 8 : 0,
            },
          ]}
        />
      )),
    [lines, width, lineHeight, skeletonColor],
  );

  return (
    <View style={[styles.skeletonContainer, style]} testID={testID}>
      {skeletonLines}
    </View>
  );
};

const InlineLoading: React.FC<InlineLoadingProps> = ({
  size = 'small',
  color,
  text,
  style,
  textStyle,
  spinnerIcon,
  testID,
}) => {
  const theme = useTheme();
  const sizeConfig = SIZE_CONFIG[size];
  const spinnerColor = color ?? theme.colors.primary;
  const textColor = theme.colors.textSecondary;

  return (
    <View style={[styles.inlineContainer, style]} testID={testID}>
      {spinnerIcon ?? <SpinnerIcon size={SIZE_CONFIG.small.spinner} color={spinnerColor} />}
      {text && (
        <Text
          style={[
            { color: textColor, fontSize: sizeConfig.text, marginLeft: 8 },
            textStyle,
          ]}
        >
          {text}
        </Text>
      )}
    </View>
  );
};

const LoadingComponent: React.FC<LoadingProps> = (props) => {
  const variant = props.variant ?? 'spinner';

  switch (variant) {
    case 'top':
      return <TopLoading {...(props as TopLoadingProps)} />;
    case 'skeleton':
      return <SkeletonLoading {...(props as SkeletonLoadingProps)} />;
    case 'inline':
      return <InlineLoading {...(props as InlineLoadingProps)} />;
    case 'spinner':
    default:
      return <SpinnerLoading {...(props as SpinnerLoadingProps)} />;
  }
};

export const Loading = memo(LoadingComponent);
Loading.displayName = 'Loading';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  text: {
    textAlign: 'center',
  },
  topContainer: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  topLoadingView: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  skeletonContainer: {
    width: '100%',
  },
  skeletonLine: {
    borderRadius: 4,
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
