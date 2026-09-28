import type { CornerCurve } from '../shapes/corner-types';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export interface GlassBlurTargetProviderProps {
  children?: ReactNode;
  /**
   * Style for the wrapping target view. Defaults to `flex: 1`, which is what an
   * app root wants; pass your own only if this is wrapping something smaller.
   */
  style?: StyleProp<ViewStyle>;
}

export interface GlassBlurWindowProps {
  children?: ReactNode;
}

/** Geometry is controlled by radius and cornerCurve; material owns clipping. */
type GlassStyle = Omit<ViewStyle, Extract<keyof ViewStyle, `border${string}Radius` | `border${string}Width` | 'borderCurve' | 'overflow'>> & Pick<ViewStyle, 'borderRadius'>;

export interface GlassIslandProps {
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
  style?: StyleProp<GlassStyle>;
  testID?: string;
}
