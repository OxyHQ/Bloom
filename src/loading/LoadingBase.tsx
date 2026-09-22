/**
 * Everything `Loading` does that is the SAME on both platforms.
 *
 * The family forks for one reason: the `top` variant's motion. Native drives
 * it with react-native-reanimated, whose worklets Babel plugin has no web
 * equivalent — a static import of it breaks every web bundler, Vite, webpack
 * and Metro-web alike — so web drives the same motion with CSS transitions.
 * That is the whole of the difference. The `spinner` and `inline` variants,
 * the size table, the variant dispatch and the stylesheet were byte-identical
 * copies in both forks.
 *
 * So the two platform pieces are INJECTED rather than imported: `SpinnerIcon`
 * (itself forked) and `TopLoading`. `bindLoading` is called once at module
 * scope by each fork, never per render, so the component identities are
 * stable — the same discipline as `bindAgentChat` and `bindAiChat`.
 *
 * NEUTRAL by construction: nothing this module reaches is platform-forked, so
 * it resolves the same way in Metro, Vite, webpack, SSR and jest. (jest
 * resolves no platform extensions at all, so logic that moved into a
 * `.native.*` file would lose its coverage in silence.)
 */
import { normalizeBloomSize } from '../appearance/legacy';
import { resolveBloomColors } from '../appearance/colors';
import { useBloomAppearance } from '../appearance';
import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { useTheme } from '../theme/use-theme';
import type {
  LoadingProps,
  SpinnerLoadingProps,
  TopLoadingProps,
  InlineLoadingProps,
} from './types';

/** Spinner diameter and label size per `size` token. Read by all three variants. */
export const SIZE_CONFIG = {
  xs: { spinner: 16, text: 12 },
  sm: { spinner: 20, text: 13 },
  md: { spinner: 24, text: 15 },
  lg: { spinner: 44, text: 16 },
} as const;

/** The two platform pieces a fork supplies. */
export interface LoadingPlatform {
  /** Forked: react-native-svg on native, a DOM `<svg>` on web. */
  SpinnerIcon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
  /** Forked: the `top` variant, the only one whose motion differs. */
  TopLoading: React.FC<TopLoadingProps>;
}

export function bindLoading({ SpinnerIcon, TopLoading }: LoadingPlatform) {
  const SpinnerLoading: React.FC<SpinnerLoadingProps> = ({
    size: sizeProp,
    color,
    tone: toneProp,
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
    const {size, tone} = useBloomAppearance({size: normalizeBloomSize(sizeProp), tone: toneProp}, {size: 'md', tone: 'accent'});
    const sizeConfig = SIZE_CONFIG[size];
    const effectiveIconSize = iconSize ?? sizeConfig.spinner;
    const spinnerColor = className ? 'currentColor' : (color ?? resolveBloomColors(theme.colors, tone, 'solid').background);
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

  const InlineLoading: React.FC<InlineLoadingProps> = ({
    size: sizeProp,
    color,
    tone: toneProp,
    text,
    style,
    textStyle,
    spinnerIcon,
    testID,
  }) => {
    const theme = useTheme();
    const {size, tone} = useBloomAppearance({size: normalizeBloomSize(sizeProp), tone: toneProp}, {size: 'md', tone: 'accent'});
    const sizeConfig = SIZE_CONFIG[size];
    const spinnerColor = color ?? resolveBloomColors(theme.colors, tone, 'solid').background;
    const textColor = theme.colors.textSecondary;

    return (
      <View style={[styles.inlineContainer, style]} testID={testID}>
        {spinnerIcon ?? <SpinnerIcon size={sizeConfig.spinner} color={spinnerColor} />}
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

  const Loading = memo(LoadingComponent);
  Loading.displayName = 'Loading';
  return { Loading };
}

export const styles = StyleSheet.create({
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
