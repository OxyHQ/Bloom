import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export interface SurfaceProps {
  children?: ReactNode;
  /** Glass is translucent/refracted on web; solid paints an opaque theme card. */
  material?: 'glass' | 'solid';
  /** Resolved colour, including its alpha. Defaults to the neutral theme material. */
  fill?: string;
  /** Radius shared by the layout box and its clipped paint. Defaults to 20. */
  radius?: number;
  style?: StyleProp<ViewStyle>;
  className?: string;
  accessibilityLabel?: string;
  testID?: string;
}
