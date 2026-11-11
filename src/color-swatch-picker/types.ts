import type { StyleProp, ViewStyle } from 'react-native';

export interface ColorSwatchPickerProps {
  /** The picker's name (Brand colour): what a screen reader says of the whole. */
  label: string;
  /** The chosen colour, one of `colors` (any CSS colour string, compared as written). */
  value: string;
  /** A press of a swatch, or Space or Return on the focused one, chooses it. */
  onValueChange: (color: string) => void;
  /** The swatches, in order. Each is a CSS colour string and is its own value. */
  colors: readonly string[];
  /**
   * What a screen reader says of a swatch, by colour (`{ '#ef4444': 'Red' }`).
   * A colour without an entry is named by its own string.
   */
  names?: Readonly<Record<string, string>>;
  /** Swatch diameter in points. Default 40. */
  size?: number;
  disabled?: boolean;
  /** Layout of the row (it wraps; default gap 8). */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
