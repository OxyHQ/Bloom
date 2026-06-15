import type { StyleProp, ViewStyle } from 'react-native';

export interface FieldProps {
  /** The input/control this field wraps. */
  children: React.ReactNode;
  /** Field label, rendered above the control via Bloom's `Label`. */
  label?: React.ReactNode;
  /** Helper/description text rendered below the control. */
  description?: React.ReactNode;
  /**
   * Error message. When a non-empty string is provided the field renders in
   * its invalid state (error-colored message, replaces the description).
   */
  error?: string | null;
  /** Mark the field's label with a required asterisk. */
  required?: boolean;
  /** Disabled styling for the label/description. */
  disabled?: boolean;
  /**
   * `nativeID` wired to the label's `htmlFor` (web) so a label click focuses
   * the control. Set the same id on the child control's `nativeID`.
   */
  nativeID?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
