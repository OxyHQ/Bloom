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
  /**
   * Disables the label/description styling AND, for a control that reads the
   * field context, the control itself.
   *
   * It is a CONSTRAINT rather than a default: a control inside a disabled field
   * combines it with `||`, so nothing inside can re-enable itself.
   */
  disabled?: boolean;
  /**
   * The field holds SEVERAL controls — a radio set, a date's three boxes.
   *
   * It becomes a labelled `group` and publishes no control id, because one id
   * shared by three inputs is invalid HTML and one error described by three
   * inputs is announced three times. Each control keeps its own id and name.
   */
  multiple?: boolean;
  /**
   * The control's id, wired to the label's `htmlFor` on web so a label click
   * focuses it.
   *
   * Optional now: omitted, the field generates one from `useId` and hands it to
   * a control that reads `useFieldControl()`. Pass it when the id has to be a
   * particular string — an app's form library keyed by field name, or a control
   * that does not read the context and needs the id written on it by hand.
   */
  nativeID?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
