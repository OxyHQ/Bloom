import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export interface PageFooterProps {
  /** Optional content before the actions, for example a selection summary. */
  children?: ReactNode;
  /** Controls grouped by the caller; inherits the surrounding Bloom size. */
  actions?: ReactNode;
  /**
   * Distance from the containing frame's bottom. Defaults to the occupied
   * bottom edge (for example AppShell's measured bottom bar). Pass 0 when the
   * frame already ends above navigation, or the footer is in a desktop pane.
   */
  bottomInset?: number;
  /**
   * Include the bottom safe area when no bottom edge is occupied. Defaults to
   * true on native, false on web. Disable when the containing shell owns it.
   */
  safeArea?: boolean;
  /** The PageHeader gradient, mirrored upward. Default always. */
  scrim?: 'always' | 'none';
  /** Opaque gradient color; defaults to the containing surface's fill. */
  scrimColor?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
