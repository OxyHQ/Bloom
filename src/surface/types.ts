import type { CornerCurve } from '../shapes/corner-types';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle, ViewProps } from 'react-native';

export interface SurfaceProps extends Omit<ViewProps, 'style' | 'children'> {
  children?: ReactNode;
  /** Tint source. Opaque colours use 90% opacity; supplied alpha is preserved. */
  fill?: string;
  /** Radius shared by host and paint. Explicit prop wins over style.borderRadius, then default 20. */
  radius?: number;
  /** Platform-adaptive corners shared by the host and material. */
  cornerCurve?: CornerCurve;
  style?: StyleProp<ViewStyle>;
  className?: string;
  accessibilityLabel?: string;
  testID?: string;
}
