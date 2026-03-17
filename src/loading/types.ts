import type { ReactNode } from 'react';
import type { ViewStyle, TextStyle } from 'react-native';

export type LoadingVariant = 'spinner' | 'top' | 'skeleton' | 'inline';
export type LoadingSize = 'small' | 'medium' | 'large';

interface BaseLoadingProps {
  /** Variant type */
  variant?: LoadingVariant;
  /** Size of the loading indicator */
  size?: LoadingSize;
  /** Custom color (defaults to theme primary) */
  color?: string;
  /** Custom container style */
  style?: ViewStyle;
  /** Whether loading is active (for animated variants) */
  showLoading?: boolean;
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

export interface SkeletonLoadingProps extends BaseLoadingProps {
  variant: 'skeleton';
  /** Number of skeleton lines */
  lines?: number;
  /** Width of skeleton (percentage or pixels) */
  width?: number | string;
  /** Height of skeleton lines */
  lineHeight?: number;
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
  | SkeletonLoadingProps
  | InlineLoadingProps;
