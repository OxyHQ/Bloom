import type { StyleProp, TextStyle } from 'react-native';
import type { ButtonProps, ButtonIconComponent } from '../button/types';
import type { BloomSize } from '../appearance';

export type FabSize = BloomSize;

/** A prominent action. Screen/BottomBar own placement and scroll behavior. */
export interface FabProps extends Omit<ButtonProps, 'children' | 'icon' | 'leadingIcon' | 'trailingIcon' | 'leading' | 'trailing'> {
  icon?: ButtonIconComponent;
  label?: string;
  /** Glyph dimensions in points; defaults to the selected size's icon scale. */
  iconSize?: number;
  /** Parent-controlled label collapse; preserves the action and accessible name. */
  collapsed?: boolean;
  labelStyle?: StyleProp<TextStyle>;
}
