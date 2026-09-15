import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

/** One destination in a {@link RailProps.items} list. */
export interface RailItem {
  /** Stable identity for the item, matched against `RailProps.activeId`. */
  id: string;
  /** Text under the icon. */
  label: string;
  /**
   * The glyph, as any node. Bloom owns no icon set here — a consumer's own
   * icon component (or a Bloom `Icons.*` element) is passed in directly, the
   * same convention `TabBarItem.icon` uses.
   */
  icon: ReactNode;
  /**
   * Optional node rendered instead of `icon` while this item is active.
   * Without it the item renders `icon` in both states.
   *
   * The escape hatch for an icon set whose selected state is a different
   * SHAPE or COLOR rather than something `Rail` could tint on its behalf —
   * same convention as `TabBarItem.activeIcon`, resolved directly against
   * `activeId` here rather than crossfading, since `Rail` has no shared
   * highlight animation to drive.
   */
  activeIcon?: ReactNode;
}

export interface RailProps {
  /** The destinations to render, top to bottom. */
  items: RailItem[];
  /**
   * `id` of the active item. An id naming no item (including `undefined`)
   * leaves nothing selected — every item renders in its inactive state.
   */
  activeId?: string;
  /** Called with an item's `id` when it is pressed. */
  onSelect: (id: string) => void;
  /**
   * Width of the rail, in px. Defaults to `80`, a comfortable column for an
   * icon-plus-label item.
   */
  width?: number;
  /** Container style override, merged after the rail's own positioning. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
