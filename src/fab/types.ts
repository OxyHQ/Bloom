import type { StyleProp, TextStyle } from 'react-native';
import type { ButtonProps, ButtonIconComponent } from '../button/types';
import type { BloomSize } from '../appearance';
import type { FabShape } from './constants';

export type FabSize = BloomSize;

/** A prominent action. Screen/BottomBar own placement and scroll behavior. */
export interface FabProps
  extends Omit<
    ButtonProps,
    'size' | 'children' | 'icon' | 'leadingIcon' | 'trailingIcon' | 'leading' | 'trailing'
  > {
  size?: FabSize;
  /**
   * The silhouette: `circle` (the default), `rounded` (a rounded square) or `squircle` (a rounded
   * square with Apple's continuous corner). The glass, its press and a menu's morph follow it.
   */
  shape?: FabShape;
  icon?: ButtonIconComponent;
  label?: string;
  /** Glyph dimensions in points; defaults to the selected size's icon scale. */
  iconSize?: number;
  /** Parent-controlled label collapse; preserves the action and accessible name. */
  collapsed?: boolean;
  labelStyle?: StyleProp<TextStyle>;
}
