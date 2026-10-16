import type { StyleProp, ViewStyle } from 'react-native';

export interface SurfaceFadeProps {
  /** The edge that ends in the surface colour. Defaults to `bottom`. */
  edge?: 'bottom' | 'top' | 'start' | 'end';
  /**
   * How far the fade reaches from that edge: a fraction of the container
   * (`0.5`, the default) when 1 or less, else points.
   */
  size?: number;
  /** The colour to end in. Defaults to the surface it sits on (`useSurfaceFill()`). */
  color?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
