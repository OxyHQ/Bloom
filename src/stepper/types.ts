import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

/** `small` pairs 32px buttons with body text; `medium` (default) 38px buttons with headline text. */
export type StepperSize = 'small' | 'medium';

export interface StepperProps {
  /** The current value. The stepper is fully controlled. */
  value: number;
  /** Called with the next value, already clamped to `min`..`max` and snapped to `step`. */
  onValueChange: (value: number) => void;
  /** Lowest value; the decrement button disables here. Default `0`. */
  min?: number;
  /** Highest value; the increment button disables here. Default: unbounded. */
  max?: number;
  /** Amount one press adds or removes. Default `1`. */
  step?: number;
  /** Disables both buttons and the keyboard. */
  disabled?: boolean;
  /** Default `medium`. */
  size?: StepperSize;
  /** How the value is drawn and announced (`aria-valuetext`), e.g. `(n) => \`${n}+\``. */
  formatValue?: (value: number) => string;
  /**
   * The NAME of what is being counted ("Adults"). Required: the control draws a
   * number and two glyphs, so nothing else can tell a screen reader which of
   * several counters this is.
   */
  /**
   * The control's accessible name.
   *
   * Optional only because an enclosing `Field`'s label can supply it — with
   * neither, the control announces nothing and warns once in development
   * (`hooks/use-accessible-name-warning.ts`).
   */
  accessibilityLabel?: string;
  /** Name of the `−` button. Default `"Decrease"`. */
  decrementLabel?: string;
  /** Name of the `+` button. Default `"Increase"`. */
  incrementLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface StepperRowProps extends Omit<StepperProps, 'accessibilityLabel' | 'style'> {
  /** The row's title ("Adults"); also the stepper's accessible name unless one is given. */
  title: ReactNode;
  /** A secondary line under the title ("Ages 13 or above"). */
  description?: ReactNode;
  /** Draws a hairline under the row, for stacked rows. Default `false`. */
  divider?: boolean;
  /** Overrides the stepper's name; required when `title` is not a string. */
  accessibilityLabel?: string;
  /** Style of the row container. */
  style?: StyleProp<ViewStyle>;
  /** Style of the stepper inside the row. */
  stepperStyle?: StyleProp<ViewStyle>;
}
