import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export interface BottomPromoProps {
  /** Centred headline. */
  title: ReactNode;
  /** Centred supporting line under the headline. */
  description?: ReactNode;
  /** Label of the full-width primary action. */
  actionLabel: string;
  /** Pressed when the action is activated. */
  onAction: () => void;
  /** Styles the outer block; placement belongs to the surrounding bottom slot. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
