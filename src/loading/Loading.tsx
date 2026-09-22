/**
 * `Loading` — NATIVE: the `top` variant's motion on react-native-reanimated.
 *
 * Everything else about the family is shared (`LoadingBase`); this file holds
 * only what forks, and binds it. The `spinner` and `inline` variants, the size
 * table and the stylesheet are identical on both platforms.
 */
import React, { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { normalizeBloomSize } from '../appearance/legacy';
import { resolveBloomColors } from '../appearance/colors';
import { useBloomAppearance } from '../appearance';
import { animation } from '../styles/tokens';
import { useTheme } from '../theme/use-theme';
import { bindLoading, SIZE_CONFIG, styles } from './LoadingBase';
import { SpinnerIcon } from './SpinnerIcon';
import type { TopLoadingProps } from './types';

const TopLoading: React.FC<TopLoadingProps> = ({
  size: sizeProp,
  color,
  tone: toneProp,
  style,
  showLoading = true,
  iconSize,
  heightOffset = 0,
  spinnerIcon,
  testID,
}) => {
  const theme = useTheme();
  const {size, tone} = useBloomAppearance({size: normalizeBloomSize(sizeProp), tone: toneProp}, {size: 'md', tone: 'accent'});
  const sizeConfig = SIZE_CONFIG[size];
  const effectiveIconSize = iconSize ?? sizeConfig.spinner;
  const targetHeight = Math.max(0, effectiveIconSize + sizeConfig.spinner + heightOffset);
  const spinnerColor = color ?? resolveBloomColors(theme.colors, tone, 'solid').background;

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

export const { Loading } = bindLoading({ SpinnerIcon, TopLoading });
