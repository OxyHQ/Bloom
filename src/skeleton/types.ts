import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export interface SkeletonRegionProps {
  children?: ReactNode;
  /** Accessible loading description; defaults to the localized Loading message. */
  label?: string;
  testID?: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
}
