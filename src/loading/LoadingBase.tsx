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
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

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

/**
 * The indicator's root: an indeterminate, NAMED `progressbar` when the caller
 * gave `accessibilityLabel`, a plain view (today's behaviour) when not.
 *
 * Flat `aria-*` because react-native-web drops `accessibilityState` /
 * `accessibilityValue`; React Native folds them back. `aria-valuenow` is
 * deliberately absent (`undefined`): that is what makes a progressbar
 * INDETERMINATE in ARIA, and a spinner has no amount done to report. The role
 * is a literal on its own branch so `aria-state-source-census.test.ts` can read
 * it; a computed role would be invisible to it.
 */
export function LoadingRoot({
  accessibilityLabel,
  style,
  testID,
  children,
}: {
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children: React.ReactNode;
}) {
  if (accessibilityLabel) {
    return (
      <View
        role="progressbar"
        accessible
        accessibilityLabel={accessibilityLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={undefined}
        aria-busy
        style={style}
        testID={testID}
      >
        {children}
      </View>
    );
  }
  // Nothing to carry (the `top` variant's inner slot): no extra node at all.
  if (style === undefined && testID === undefined) return <>{children}</>;
  return (
    <View style={style} testID={testID}>
      {children}
    </View>
  );
}

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
    accessibilityLabel,
    testID,
  }) => {
    const theme = useTheme();
    const {size, tone} = useBloomAppearance({size: normalizeBloomSize(sizeProp), tone: toneProp}, {size: 'md', tone: 'accent'});
    const sizeConfig = SIZE_CONFIG[size];
    const effectiveIconSize = iconSize ?? sizeConfig.spinner;
    const spinnerColor = className ? 'currentColor' : (color ?? resolveBloomColors(theme.colors, tone, 'solid').background);
    const textColor = color ?? theme.colors.textSecondary;

    return (
      <LoadingRoot accessibilityLabel={accessibilityLabel} style={[styles.container, style]} testID={testID}>
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
      </LoadingRoot>
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
    accessibilityLabel,
    testID,
  }) => {
    const theme = useTheme();
    const {size, tone} = useBloomAppearance({size: normalizeBloomSize(sizeProp), tone: toneProp}, {size: 'md', tone: 'accent'});
    const sizeConfig = SIZE_CONFIG[size];
    const spinnerColor = color ?? resolveBloomColors(theme.colors, tone, 'solid').background;
    const textColor = theme.colors.textSecondary;

    return (
      <LoadingRoot accessibilityLabel={accessibilityLabel} style={[styles.inlineContainer, style]} testID={testID}>
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
      </LoadingRoot>
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
