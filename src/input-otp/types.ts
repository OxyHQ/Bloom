import type { ViewStyleProp } from '../styles';

export interface InputOtpProps extends ViewStyleProp {
  /** Number of digit boxes, default `6`. */
  length?: number;
  /** Controlled value. Non-digits are dropped and longer strings truncated to `length`. */
  value?: string;
  /** Initial value when uncontrolled. */
  defaultValue?: string;
  /** Every change, with the cleaned code. */
  onChange?: (value: string) => void;
  /** Fires once the last box is filled. */
  onComplete?: (value: string) => void;
  /** Paint every box invalid. */
  isInvalid?: boolean;
  /** Disable every box. `disabled` is an alias. */
  isDisabled?: boolean;
  disabled?: boolean;
  /** Renders a gap between groups, e.g. `3` gives 000 000. */
  groupEvery?: number;
  /** Focus the first box on mount. */
  autoFocus?: boolean;
  /** The group's accessible name, default `"One-time code"`. */
  accessibilityLabel?: string;
  testID?: string;
}
