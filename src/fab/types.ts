import type { ReactNode } from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import type { ButtonProps } from '../button/types';
import type { BloomSize } from '../appearance';

export type FabVariant = 'primary' | 'secondary' | 'tertiary' | 'surface';
export type FabSize = 'small' | 'medium' | 'large';
export type FabPlacement = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'static';
export type FabMinimizeBehavior = 'none' | 'hide' | 'collapse';

/** A prominent action. Screen/BottomBar own placement unless explicitly supplied. */
export interface FabProps extends Omit<ButtonProps, 'children' | 'leadingIcon' | 'trailingIcon' | 'leading' | 'trailing' | 'size' | 'variant'> {
  label?: string;
  /** Glyph dimensions in points; defaults to the selected size’s icon scale. */
  iconSize?: number;
  /** Animate the extended label away while retaining the action and accessible name. */
  collapsed?: boolean;
  children?: ReactNode;
  size?: BloomSize | FabSize | number;
  /** Existing color preset. Explicit tone takes precedence. */
  variant?: FabVariant;
  placement?: FabPlacement;
  offset?: number;
  minimizeBehavior?: FabMinimizeBehavior;
  labelStyle?: StyleProp<TextStyle>;
  zIndex?: number;
  accessibilityHint?: string;
}
