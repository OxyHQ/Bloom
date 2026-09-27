import type { ViewStyleProp } from '../styles';

/**
 * What a box accepts. `numeric` (the default) keeps digits only;
 * `alphanumeric` upper-cases and keeps `A`–`Z` and `0`–`9`.
 */
export type InputOtpType = 'numeric' | 'alphanumeric';

export interface InputOtpProps extends ViewStyleProp {
  /** Number of boxes, default `6`. */
  length?: number;
  /**
   * `numeric` (default): digits only, number pad. `alphanumeric`: letters and
   * digits, upper-cased, on a letters keyboard with auto-capitalisation.
   * Anything else — a dash, a space — is dropped either way, so a pasted
   * `ABCDE-12345` fills ten boxes.
   */
  type?: InputOtpType;
  /** Controlled value. Characters the `type` does not accept are dropped and longer strings truncated to `length`. */
  value?: string;
  /** Initial value when uncontrolled. */
  defaultValue?: string;
  /** Every change, with the cleaned code. */
  onChange?: (value: string) => void;
  /** Fires once the last box is filled. */
  onComplete?: (value: string) => void;
  /** Paint every box invalid. */
  invalid?: boolean;
  isInvalid?: boolean;
  /** Disable every box. `disabled` is an alias. */
  isDisabled?: boolean;
  disabled?: boolean;
  /** Renders a gap between groups, e.g. `3` gives 000 000. */
  groupEvery?: number;
  /** Focus the first box on mount. */
  autoFocus?: boolean;
  /**
   * The group's accessible name.
   *
   * Inside a `Field` the field's label supplies it. `"One-time code"` is the
   * last resort when neither is given — a default here would outrank the
   * field's label, which is the one thing on screen the user can read.
   */
  accessibilityLabel?: string;
  testID?: string;
}
