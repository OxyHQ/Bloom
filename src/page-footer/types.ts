import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export interface PageFooterProps {
  /** Absolute inside a bounded frame (default), document-anchored on web,
   * in normal flow (`inline`), or in flow pinned to the scroll container's
   * bottom on web (`sticky`). Native sticky falls back to inline placement.
   * A Screen bottomBar slot owns placement for every position. */
  position?: 'absolute' | 'document' | 'inline' | 'sticky';
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
  /** Layout of the controls row; use matching padding longhands to override its insets. */
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
