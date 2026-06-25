import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

export interface BenefitRowProps {
  /**
   * Leading icon — rendered inside a rounded `fill-secondary` square. Pass a
   * Bloom icon element (e.g. `<Icons.Lock size="sm" />`) or any node.
   */
  icon: ReactNode;
  /**
   * Caption text. Provide either `label` or `children` (string or nodes).
   * Rendered as `text-secondary` at the `caption` type role.
   */
  label?: string;
  /** Caption content as children (alternative to `label`). */
  children?: ReactNode;
  /** Accessibility label for the row (defaults to the text content). */
  accessibilityLabel?: string;
  /** NativeWind className passthrough on the row container. */
  className?: string;
  /** Style passthrough on the row container. */
  style?: StyleProp<ViewStyle>;
  /** Style passthrough on the caption text. */
  textStyle?: StyleProp<TextStyle>;
}

export interface BenefitListProps {
  /** `BenefitRow`s (or any nodes) stacked with consistent spacing. */
  children: ReactNode;
  /** Accessibility label for the card. */
  accessibilityLabel?: string;
  /** NativeWind className passthrough on the card container. */
  className?: string;
  /** Style passthrough on the card container. */
  style?: StyleProp<ViewStyle>;
}
