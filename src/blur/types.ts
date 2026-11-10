import type { CornerCurve } from '../shapes/corner-types';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export interface BlurTargetProviderProps {
  children?: ReactNode;
  /**
   * Style for the wrapping target view. Defaults to `flex: 1`, which is what an
   * app root wants; pass your own only if this is wrapping something smaller.
   */
  style?: StyleProp<ViewStyle>;
}

export interface BlurWindowProps {
  children?: ReactNode;
}

/** Geometry is controlled by radius and cornerCurve; material owns clipping. */
type IslandStyle = Omit<
  ViewStyle,
  Extract<
    keyof ViewStyle,
    `border${string}Radius` | `border${string}Width` | 'borderCurve' | 'overflow'
  >
> &
  Pick<ViewStyle, 'borderRadius'>;

export interface BlurIslandProps {
  children?: ReactNode;
  /**
   * Corner radius. A full pill by default — an island is a capsule, and a
   * capsule of icon-only controls is what makes the row read as separated
   * groups rather than as one bar.
   */
  radius?: number;
  /** Curve for non-capsule islands. */
  cornerCurve?: CornerCurve;
  /**
   * `'group'` when the island holds several RELATED actions the consumer has
   * declared as one group. Omitted for a single control in its own capsule: a
   * group of one is noise for a screen reader, and the control already names
   * itself.
   */
  role?: 'group';
  /** Names the group. Required by `role="group"` to be worth announcing. */
  accessibilityLabel?: string;
  /** Forwarded to the material. Controls the shared sheen gradient. */
  sheen?: boolean;
  /**
   * `'lens'` (default) draws the island with the native lens where the device has one (Android 13+);
   * elsewhere, and with `'surface'`, it keeps the shared surface material. An island that scrolls with
   * its content should be `'surface'`: the lens is drawn by the window, not by the scroll view.
   */
  material?: 'lens' | 'surface';
  style?: StyleProp<IslandStyle>;
  testID?: string;
}
