import type { CornerCurve } from '../shapes/corner-types';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle, ViewProps } from 'react-native';

export interface SurfaceProps extends Omit<ViewProps, 'style' | 'children'> {
  children?: ReactNode;
  /** Tint source. On the web opaque colours paint at 72% over the frosted backdrop; native keeps them opaque. Supplied alpha is preserved. */
  fill?: string;
  /** Disable the material edge when a control owns its own outline. Defaults to true. */
  rim?: boolean;
  /** Native material sheen. Defaults to true. */
  sheen?: boolean;
  /**
   * `'lens'` draws the surface with the native lens where the device has one (Android 13+) and keeps
   * the shared paint elsewhere. One floating surface over content (a panel, a dialog card), never a
   * surface that repeats in a scrolling list: the lens is drawn by the window, so it does not follow
   * a scroll view's overscroll stretch and each live lens has a cost. Defaults to `'surface'`.
   */
  material?: 'surface' | 'lens';
  /** Radius shared by host and paint. Explicit prop wins over style.borderRadius, then default 20. */
  radius?: number | 'concentric';
  /** Platform-adaptive corners shared by the host and material. */
  cornerCurve?: CornerCurve;
  style?: StyleProp<ViewStyle>;
  className?: string;
  accessibilityLabel?: string;
  testID?: string;
}
