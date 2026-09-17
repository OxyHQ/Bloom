import type { ComponentType, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { BloomIconComponent } from '../icons/icon-component';

/** An icon COMPONENT; the bar sizes (24) and colours it. Bloom's icons fit. */
/** @deprecated Use `BloomIconComponent` from `@oxy.so/bloom/icons`; this is an alias of it. */
export type CategoryBarIcon = BloomIconComponent;

export interface CategoryBarItem {
  /** Stable identity, and what `value`/`onValueChange` speak. */
  key: string;
  /** The small label under the icon; also the tab's accessible name. */
  label: string;
  icon: CategoryBarIcon;
}

export interface CategoryBarProps {
  items: readonly CategoryBarItem[];
  /** The selected item's `key`. `undefined` selects nothing. */
  value?: string;
  /** Called with the pressed item's `key` (also when it is already selected). */
  onValueChange?: (key: string) => void;
  /**
   * Content pinned to the right of the scrolling strip — a Filters button, a
   * switch row. It never scrolls.
   */
  trailing?: ReactNode;
  /** Names the tablist ("Categories"). */
  accessibilityLabel: string;
  /** Space between items. Default `32`. */
  gap?: number;
  /**
   * The colour the web edge fades blend into — the surface behind the bar.
   * Default the page background.
   */
  fadeColor?: string;
  /** The web left arrow's name. Default `"Previous categories"`. */
  previousLabel?: string;
  /** The web right arrow's name. Default `"Next categories"`. */
  nextLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Items get `<testID>-item-<key>`, the arrows `<testID>-previous` / `<testID>-next`. */
  testID?: string;
}
