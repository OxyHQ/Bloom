import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export interface PageFooterProps {
  /** Absolute inside a bounded frame (default), or pinned to the document
   * viewport while aligned to this footer's in-flow column on web. Native
   * always uses absolute positioning inside its bounded frame. */
  position?: 'absolute' | 'document';
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
  /**
   * Mirrored PageHeader gradient. Default always preserves existing behavior.
   * auto follows ScrollMetricsProvider: hidden at the bottom or for short /
   * unmeasured content, fading in over scrollThreshold of remaining content.
   */
  scrim?: 'auto' | 'always' | 'none';
  /** Distance from the bottom over which the automatic scrim fades. Default 20. */
  scrollThreshold?: number;
  /** Opaque gradient color; defaults to the containing surface's fill. */
  scrimColor?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
