/**
 * `Loading` — WEB: the `top` variant's motion on CSS transitions.
 *
 * The native fork statically imports react-native-reanimated, whose worklets
 * Babel plugin is native-only — importing it statically breaks every web
 * bundler, Vite, webpack and Metro-web alike. That is the whole reason this
 * family forks. Everything else is shared (`LoadingBase`): the `spinner` and
 * `inline` variants, the size table and the stylesheet.
 */
import React from 'react';
import { View } from 'react-native';

import { normalizeBloomSize } from '../appearance/legacy';
import { resolveBloomColors } from '../appearance/colors';
import { useBloomAppearance } from '../appearance';
import { animation } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { bindLoading, LoadingRoot, SIZE_CONFIG, styles } from './LoadingBase';
import { SpinnerIcon } from './SpinnerIcon.web';
import type { TopLoadingProps } from './types';

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
  size: sizeProp,
  color,
  tone: toneProp,
  style,
  showLoading = true,
  iconSize,
  heightOffset = 0,
  spinnerIcon,
  accessibilityLabel,
  testID,
}) => {
  const theme = useTheme();
  const {size, tone} = useBloomAppearance({size: normalizeBloomSize(sizeProp), tone: toneProp}, {size: 'md', tone: 'accent'});
  const sizeConfig = SIZE_CONFIG[size];
  const effectiveIconSize = iconSize ?? sizeConfig.spinner;
  const targetHeight = Math.max(0, effectiveIconSize + sizeConfig.spinner + heightOffset);
  const spinnerColor = color ?? resolveBloomColors(theme.colors, tone, 'solid').background;

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
        {/* Named only while it is showing: a collapsed bar is not a wait. */}
        <LoadingRoot accessibilityLabel={showLoading ? accessibilityLabel : undefined}>
          {spinnerIcon ?? <SpinnerIcon size={effectiveIconSize} color={spinnerColor} />}
        </LoadingRoot>
      </View>
    </View>
  );
};

export const { Loading } = bindLoading({ SpinnerIcon, TopLoading });
