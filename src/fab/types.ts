import type { ButtonProps } from '../button/types';

/** A prominent action. Its parent owns positioning and screen geometry. */
export interface FabProps extends Omit<ButtonProps, 'children' | 'leadingIcon' | 'trailingIcon' | 'leading' | 'trailing'> {
  label?: string;
}
