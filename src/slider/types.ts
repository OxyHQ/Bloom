import type { StyleProp, ViewStyle } from 'react-native';

export interface SliderProps {
  /** Current value (controlled). */
  value: number;
  /** Fired continuously as the user drags / steps the thumb. */
  onValueChange: (value: number) => void;
  /** Fired once when the drag gesture ends. */
  onSlidingComplete?: (value: number) => void;
  /** Minimum value. Defaults to `0`. */
  min?: number;
  /** Maximum value. Defaults to `100`. */
  max?: number;
  /** Step granularity. Defaults to `1`. Use a fractional step for fine control. */
  step?: number;
  disabled?: boolean;
  /** Track thickness in px. Defaults to `4`. */
  trackHeight?: number;
  /** Thumb diameter in px. Defaults to `20`. */
  thumbSize?: number;
  /** Override the filled-track color. Defaults to the theme primary. */
  minimumTrackTintColor?: string;
  /** Override the unfilled-track color. Defaults to the theme border. */
  maximumTrackTintColor?: string;
  /** Override the thumb color. Defaults to the theme primary. */
  thumbTintColor?: string;
  style?: StyleProp<ViewStyle>;
  /**
   * The slider's accessible NAME — what the value applies to.
   *
   * `slider` takes its name from the author only, and a track with a thumb
   * renders no text, so this is the only route to one: without it the control
   * announces a number and no subject. The `aria-value*` props say how far
   * along it is, never what it is.
   *
   * Omitting it warns once in development; see `use-accessible-name-warning`.
   */
  accessibilityLabel?: string;
  testID?: string;
}
