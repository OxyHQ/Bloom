import type { StyleProp, TextStyle } from 'react-native';

export interface LabelProps {
  /** Label text. */
  children: React.ReactNode;
  /**
   * Native ID of the control this label describes. On web, also wires up
   * `htmlFor` so clicking the label focuses the associated input.
   */
  nativeID?: string;
  /**
   * Web-only convenience: the `id` of the form control this label is for.
   * Defaults to `nativeID` when omitted. Ignored on native.
   */
  htmlFor?: string;
  /**
   * Render a required marker (an asterisk in the theme's negative color)
   * after the label text. Defaults to `false`.
   */
  required?: boolean;
  /** Visually subdued label (e.g. for optional fields). Defaults to `false`. */
  disabled?: boolean;
  /** Typography size token. Defaults to `'sm'`. */
  size?: 'xs' | 'sm' | 'md';
  style?: StyleProp<TextStyle>;
  testID?: string;
}
