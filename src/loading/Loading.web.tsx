import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, type DimensionValue } from 'react-native';

import type { WebCssStyle } from '../styles/web-view-style';

import { useTheme } from '../theme/use-theme';
import { animation } from '../styles/tokens';
import { SpinnerIcon } from './SpinnerIcon.web';
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
 * Web fork of the `top` variant.
 *
 * The native variant collapses/expands the container height and slides the
 * spinner in/out with `react-native-reanimated`. Reanimated can't ship to a
 * web bundle (its worklets Babel plugin has no web equivalent and importing it
 * statically breaks the bundler), so this fork drives the same motion with CSS
 * transitions — react-native-web emits `transition-*` style props to the DOM.
 * The element stays mounted across `showLoading` toggles so both directions
 * animate, exactly like the native `withTiming` on `height`, `opacity`, and
 * `translateY`.
 */
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

  const duration = animation.duration.slow;
  // `cubic-bezier(0.33, 1, 0.68, 1)` is the standard CSS approximation of
  // reanimated's `Easing.out(Easing.cubic)` used by the native variant.
  const easing = 'cubic-bezier(0.33, 1, 0.68, 1)';

  const containerTransition: WebCssStyle = {
    transitionProperty: 'height',
    transitionDuration: `${duration}ms`,
    transitionTimingFunction: easing,
  };

  const innerTransition: WebCssStyle = {
    transitionProperty: 'opacity, transform',
    transitionDuration: `${duration}ms`,
    transitionTimingFunction: easing,
  };

  return (
    <View
      style={[styles.topContainer, { height: showLoading ? targetHeight : 0 }, containerTransition]}
      testID={testID}
    >
      <View
        style={[
          styles.topLoadingView,
          { height: targetHeight },
          {
            opacity: showLoading ? 1 : 0,
            transform: [{ translateY: showLoading ? 0 : -targetHeight }],
          },
          innerTransition,
          style,
        ]}
      >
        {spinnerIcon ?? <SpinnerIcon size={effectiveIconSize} color={spinnerColor} />}
      </View>
    </View>
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
