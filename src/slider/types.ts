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
  /** Track thickness in px. Defaults to `6`. */
  trackHeight?: number;
  /** Thumb diameter in px. Defaults to `20`. */
  thumbSize?: number;
  /** Override the filled-track colour (a flat fill). Defaults to the accent gradient. */
  minimumTrackTintColor?: string;
  /** Override the unfilled-track colour. Defaults to the neutral-200 rail. */
  maximumTrackTintColor?: string;
  /** Override the thumb's inner dot colour. Defaults to the accent gradient. */
  thumbTintColor?: string;
  /**
   * A visible label above the track. It also serves as the accessible name
   * when `accessibilityLabel` is not given.
   */
  label?: string;
  /**
   * Show the exact value in a persistent bubble above the thumb. Defaults to
   * `true`; the bubble reserves 32px above the track.
   */
  showTooltip?: boolean;
  /** Formats the value shown in the bubble. Defaults to `String(value)`. */
  formatValue?: (value: number) => string;
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

export interface RangeSliderProps
  extends Omit<SliderProps, 'value' | 'onValueChange' | 'onSlidingComplete' | 'formatValue'> {
  /** The lower and upper values (controlled). The thumbs cannot pass each other. */
  value: [number, number];
  /** Fired continuously as either thumb is dragged or stepped. */
  onValueChange: (value: [number, number]) => void;
  /** Fired once when a drag gesture ends. */
  onSlidingComplete?: (value: [number, number]) => void;
  /** Formats the value in each thumb's bubble; `index` is 0 (lower) or 1 (upper). */
  formatValue?: (value: number, index: number) => string;
  /** Accessible names for the lower and upper thumbs. Default `['Minimum', 'Maximum']`. */
  thumbLabels?: [string, string];
}
