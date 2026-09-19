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
   *
   * `null` means there is NO single control to point at — a label naming a
   * GROUP of them, which is `Field`'s `multiple` case. Without a way to say
   * that, the `nativeID` fallback makes the label its own target: a
   * `<label for>` pointing at the label, which focuses nothing and which
   * nothing reports.
   */
  htmlFor?: string | null;
  /**
   * Render a required marker (an asterisk in the theme's negative color)
   * after the label text. Defaults to `false`.
   */
  required?: boolean;
  /** Visually subdued label (e.g. for optional fields). Defaults to `false`. */
  disabled?: boolean;
  /**
   * Type-ramp step: `xs` body-2-medium, `sm` body-medium
   * (the default), `md` headline-medium.
   */
  size?: 'xs' | 'sm' | 'md';
  style?: StyleProp<TextStyle>;
  testID?: string;
}
