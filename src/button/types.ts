import type { ComponentType, ReactNode } from 'react';
import type { StyleProp, ViewStyle, TextStyle } from 'react-native';
import type { WebAriaProps } from '../styles/styled-primitives';
import type { BloomAppearance, BloomSize, BloomTone } from '../appearance/types';

export type ButtonSize = BloomSize;
export type ButtonIconComponent = ComponentType<{ width?: number; height?: number; fill?: string }>;
export interface ButtonProps {
  onPress?: () => void;
  children?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  size?: BloomSize;
  tone?: BloomTone;
  appearance?: BloomAppearance;
  /** An icon-only action. Labelled actions use leadingIcon/trailingIcon. */
  icon?: ButtonIconComponent;
  leadingIcon?: ButtonIconComponent;
  trailingIcon?: ButtonIconComponent;
  leading?: ReactNode;
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  loadingColor?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  hitSlop?: { top: number; bottom: number; left: number; right: number };
  testID?: string;
  className?: string;
  href?: string;
  target?: string;
  rel?: string;
  /** Web form behavior; activation remains onPress on every platform. */
  type?: 'button' | 'submit' | 'reset';
  asChild?: boolean;
  id?: string;
  name?: string;
  value?: string;
  'aria-expanded'?: boolean;
  'aria-haspopup'?: WebAriaProps['aria-haspopup'];
  title?: string;
  autoFocus?: boolean;
  tabIndex?: number;
}
export interface CloseButtonProps {
  onPress?: () => void;
  size?: BloomSize;
  disabled?: boolean;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
