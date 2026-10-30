import type { CornerCurve } from '../shapes/corner-types';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle, ViewProps } from 'react-native';

export interface SurfaceProps extends Omit<ViewProps, 'style' | 'children'> {
  children?: ReactNode;
  /** Tint source. On the web opaque colours paint at 72% over the frosted backdrop; native keeps them opaque. Supplied alpha is preserved. */
  fill?: string;
  /** Radius shared by host and paint. Explicit prop wins over style.borderRadius, then default 20. */
  radius?: number | 'concentric';
  /** Platform-adaptive corners shared by the host and material. */
  cornerCurve?: CornerCurve;
  style?: StyleProp<ViewStyle>;
  className?: string;
  accessibilityLabel?: string;
  testID?: string;
}
