import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import type { TabBarItem } from '../tab-bar/types';

export interface BottomBarProps {
  items: TabBarItem[];
  value: string;
  onValueChange: (value: string) => void;
  /** Optional continuous selection supplied by a swipe pager, in item-index space. */
  activeProgress?: SharedValue<number>;
  /** Long press on a destination (for example an account switcher). */
  onValueLongPress?: (value: string) => void;
  /** Static action sibling; outside the navigation scrub detector. */
  action?: ReactNode;
  /** Auto places the action above navigation when side-by-side targets would be cramped. */
  actionPlacement?: 'auto' | 'beside' | 'above';
  /**
   * `hide` fades the accessory on scroll (default), `visible` retains it.
   * `dock` keeps one editable action: above expanded navigation, beside the
   * active destination when minimized. It stays mounted with the keyboard.
   */
  actionBehavior?: 'hide' | 'visible' | 'dock';
  /** Keep the same action mounted while navigation is absent (for example on desktop). */
  navigationVisibility?: 'always' | 'compact' | 'never';
  minimizeProgress?: SharedValue<number>;
  /**
   * The bar's presence, 0 (shown) to 1 (gone), on the UI thread. The bar fades
   * and slides off its edge continuously, so a swipe onto a page without a bar
   * item takes the bar away under the finger; past halfway it leaves hit
   * testing and the accessibility tree.
   */
  hideProgress?: SharedValue<number>;
  /** Optional screen-edge blur band; disabled by default. */
  blur?: boolean;
  maxWidth?: number;
  /** Horizontal breathing room shared by navigation and action. Default 12. */
  horizontalInset?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
