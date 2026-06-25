import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export interface ConnectionDotsProps {
  /**
   * Left-hand content — typically a logo or avatar of the first party in a
   * link/consent flow. Rendered as-is.
   */
  left: ReactNode;
  /**
   * Right-hand content — typically a logo or avatar of the second party.
   * Rendered as-is.
   */
  right: ReactNode;
  /**
   * Number of ellipsis dots animating between the two slots.
   * @default 6
   */
  dotCount?: number;
  /**
   * Diameter of each dot in px.
   * @default 6
   */
  dotSize?: number;
  /**
   * Accessibility label for the whole connection band. Read by screen readers in
   * place of the (decorative) dots.
   * @default 'Connecting'
   */
  accessibilityLabel?: string;
  /** NativeWind className passthrough on the outer row. */
  className?: string;
  /** Style passthrough on the outer row. */
  style?: StyleProp<ViewStyle>;
  /**
   * Force-disable the shimmer regardless of the OS reduced-motion setting.
   * (When omitted, the component reads the platform reduced-motion preference
   * and renders the dots statically when it is on.)
   */
  reducedMotion?: boolean;
}
