import type { BloomSize } from '../appearance';
import type { StyleProp, ViewStyle } from 'react-native';

export interface InputGroupAddonProps {
  /** Addon content (icon, text, `Button`, `Kbd`, etc.). */
  children: React.ReactNode;
  /**
   * Visually separate the addon from the input with a hairline divider on the
   * inner edge. Defaults to `false` (addons that are buttons usually want
   * this `true`; plain text/icons usually don't).
   */
  divider?: boolean;
  /**
   * Remove the default horizontal padding (useful when the addon is an
   * interactive control that brings its own hit area / padding).
   */
  noPadding?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface InputGroupProps {
  /**
   * Group children. Place `InputGroupAddon` elements before/after the input
   * (a Bloom `TextFieldInput`, a `Search`, or any control). The middle
   * child stretches to fill.
   */
  children: React.ReactNode;
  /** Invalid state — renders the error-colored border. */
  invalid?: boolean;
  /** Disabled styling. */
  disabled?: boolean;
  /**
   * `sm` is the `small` input (32 tall), `md` the `medium` (36, the
   * default), `lg` extends the ramp (44).
   */
  size?: BloomSize;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
