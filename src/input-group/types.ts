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
   * Group children. Place `InputGroup.Addon` elements before/after the input
   * (a Bloom `TextField.Input`, a `SearchInput`, or any control). The middle
   * child stretches to fill.
   */
  children: React.ReactNode;
  /** Invalid state — renders the error-colored border. */
  isInvalid?: boolean;
  /** Disabled styling. */
  disabled?: boolean;
  /** Size affects height + horizontal padding. Defaults to `'md'`. */
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
