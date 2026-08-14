import React, { memo, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, type DimensionValue } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../theme/use-theme';
import { animation } from '../styles/tokens';
import { SpinnerIcon } from './SpinnerIcon';
import type {
  LoadingProps,
  SpinnerLoadingProps,
  TopLoadingProps,
  InlineLoadingProps,
} from './types';

const SIZE_CONFIG = {
  small: { spinner: 20, text: 13 },
  medium: { spinner: 24, text: 15 },
  large: { spinner: 44, text: 16 },
} as const;

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

  const height = useSharedValue(showLoading ? targetHeight : 0);
  const opacity = useSharedValue(showLoading ? 1 : 0);
  const translateY = useSharedValue(showLoading ? 0 : -targetHeight);

  useEffect(() => {
    const timingConfig = { duration: animation.duration.slow, easing: Easing.out(Easing.cubic) };
    height.value = withTiming(showLoading ? targetHeight : 0, timingConfig);
    opacity.value = withTiming(showLoading ? 1 : 0, timingConfig);
    translateY.value = withTiming(showLoading ? 0 : -targetHeight, timingConfig);
    // Easing, withTiming: module-level constants from a static import, stable.
    // height/opacity/translateY: shared value objects, stable references.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLoading, targetHeight]);

  // Shared values MUST be in the deps arrays: on web without the worklets Babel
  // plugin, useAnimatedStyle does not auto-track shared-value reads and would
  // freeze at frame 1. Native (plugin present) auto-tracks and ignores the deps.
  const containerAnimated = useAnimatedStyle(() => ({
    height: height.value,
  }), [height]);

  const innerAnimated = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }), [opacity, translateY]);

  return (
    <Animated.View style={[styles.topContainer, containerAnimated]} testID={testID}>
      <Animated.View style={[styles.topLoadingView, { height: targetHeight }, innerAnimated, style]}>
        {spinnerIcon ?? <SpinnerIcon size={effectiveIconSize} color={spinnerColor} />}
      </Animated.View>
    </Animated.View>
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
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
