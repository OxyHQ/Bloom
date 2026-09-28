import type { CornerCurve } from '../shapes/corner-types';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle, ViewProps } from 'react-native';

export interface SurfaceProps extends Omit<ViewProps, 'style' | 'children'> {
  children?: ReactNode;
  /** Solid (default) keeps the gradient and rim on an opaque fill; glass adds transparency and web refraction. */
  material?: 'glass' | 'solid';
  /** Explicit tint. Defaults to a surface above the actual parent. Solid composites alpha onto that parent; glass preserves it. */
  fill?: string;
  /** Radius shared by the layout box and its clipped paint. Defaults to 20. */
  radius?: number;
  /** Platform-adaptive corners shared by the host and material. */
  cornerCurve?: CornerCurve;
  style?: StyleProp<ViewStyle>;
  className?: string;
  accessibilityLabel?: string;
  testID?: string;
}
