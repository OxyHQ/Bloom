import type { BloomTone } from '../appearance';
import type { BloomSizeInput } from '../appearance/legacy';
import type { ReactNode } from 'react';
import type { ViewStyle, TextStyle } from 'react-native';

export type LoadingVariant = 'spinner' | 'top' | 'inline';
export type LoadingSize = BloomSizeInput;

interface BaseLoadingProps {
  /** Variant type */
  variant?: LoadingVariant;
  /** Size of the loading indicator */
  size?: LoadingSize;
  /** Custom color (defaults to theme primary) */
  color?: string;
  tone?: BloomTone;
  /** NativeWind className for spinner color (e.g. "text-primary"). Overrides color prop. */
  className?: string;
  /** Custom container style */
  style?: ViewStyle;
  /** Whether loading is active (for animated variants) */
  showLoading?: boolean;
  /**
   * Names the indicator and makes it an indeterminate `progressbar` to
   * assistive technology (`role="progressbar"` with `aria-label` and
   * `aria-busy` on web; the same role, label and busy state natively). A
   * spinner draws no words, so nothing else can say what is loading.
   *
   * Opt-in: without it the indicator carries no role, as before — which is
   * right when it sits INSIDE a named progressbar already (an upload overlay),
   * where a second one would announce the same wait twice.
   */
  accessibilityLabel?: string;
  testID?: string;
}

export interface SpinnerLoadingProps extends BaseLoadingProps {
  variant?: 'spinner';
  /** Optional text to display below spinner */
  text?: string;
  /** Custom style for the text */
  textStyle?: TextStyle;
  /** Whether to show text */
  showText?: boolean;
  /** Custom icon size (overrides size prop) */
  iconSize?: number;
  /** Custom spinner icon (defaults to ActivityIndicator) */
  spinnerIcon?: ReactNode;
}

export interface TopLoadingProps extends BaseLoadingProps {
  variant: 'top';
  /** Custom icon size */
  iconSize?: number;
  /** Custom container height offset */
  heightOffset?: number;
  /** Custom spinner icon (defaults to ActivityIndicator) */
  spinnerIcon?: ReactNode;
}

export interface InlineLoadingProps extends BaseLoadingProps {
  variant: 'inline';
  /** Text to show next to spinner */
  text?: string;
  /** Custom style for the text */
  textStyle?: TextStyle;
  /** Custom spinner icon (defaults to ActivityIndicator) */
  spinnerIcon?: ReactNode;
}

export type LoadingProps =
  | SpinnerLoadingProps
  | TopLoadingProps
  | InlineLoadingProps;
