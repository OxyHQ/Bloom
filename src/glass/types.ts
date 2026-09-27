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
