/**
 * Public types for `@oxy.so/bloom/tab-pager`.
 *
 * This module names no router and no pager package: it is read by a consumer's
 * `tsc`, by Metro and by every web bundler alike. The expo-router binding and
 * the optional `react-native-pager-view` peer live in `./expo-router`.
 */
import type { SharedValue } from 'react-native-reanimated';
import type { BottomBarProps } from '../bottom-bar/types';
import type { BloomIconComponent } from '../icons/icon-component';
import type { TabBarItem } from '../tab-bar/types';

/**
 * One place the app's navigation leads, declared once. `TabPagerProvider`
 * takes the app's list of them, and everything that navigates draws from it:
 * the pager's pages, the bottom bar's items and, under an `AppShell`, the
 * sidebar's rows, its selection and its compose action.
 */
export interface AppDestination {
  /**
   * Stable identity. For a page, the route's name inside the tabs group: the
   * navigator's own identifier.
   */
  name: string;
  /** The exact path. It is how a pathname is recognised as this destination. */
  href: string;
  /** What the bar item and the sidebar row say. */
  label?: string;
  /**
   * The glyph, as a component (`RiHome5Line`). The bar and the sidebar draw it
   * at their own size and tint; one that ignores `fill`, such as the reader's
   * own avatar, still takes `width`.
   */
  icon?: BloomIconComponent;
  /** The glyph while selected: the filled shape of an outline icon. */
  activeIcon?: BloomIconComponent;
  /** A count on the bar item and the sidebar row (unread notifications). */
  badge?: number;
  /**
   * A root page of the pager: kept mounted, reached by swiping, its route a
   * child of the tabs group. A destination with a bar item is always one.
   */
  page?: boolean;
  /**
   * Mount this page ahead of a visit — as a neighbour of the page in front, and
   * kept laid out while the bar can reach it — so a swipe or a tap never lands
   * on a blank screen. Off by default: a heavy page (a composer) or one that
   * holds hardware (a camera) mounts only when the reader lands on it.
   */
  preload?: boolean;
  /**
   * Draw an item in the bottom bar (which makes it a page). A page without one
   * is reached by swiping or by `selectTab`, and the bar fades away while it is
   * in front.
   */
  bar?: boolean;
  /** Draw a sidebar row. Defaults to whether it has a label and an icon. */
  sidebar?: boolean;
  /**
   * An action rather than a place (Settings opening a dialog): pressing the row
   * or item runs this instead of navigating.
   */
  onPress?: () => void;
  /** A second action on a long press (the account switcher on Profile). */
  onLongPress?: () => void;
}

/**
 * One root page of the app, in pager order.
 *
 * @deprecated Declare `AppDestination`s and pass them as `destinations`; a
 * destination with `bar` (or `page`) is a page.
 */
export interface TabPage {
  /** The route's name inside the tabs group: the navigator's own identifier. */
  name: string;
  /** The page's exact path. It is how a pathname is recognised as this page. */
  href: string;
  /**
   * Mount this page ahead of a visit — as a neighbour of the page in front, and
   * kept laid out while the bar can reach it — so a swipe or a tap never lands
   * on a blank screen. Off by default: a heavy page (a composer) or one that
   * holds hardware (a camera) mounts only when the reader lands on it.
   */
  preload?: boolean;
  /**
   * The item this page draws in the bottom bar. A page without one is reached
   * by swiping or by `selectTab`, and the bar fades away while it is in front.
   */
  bar?: Omit<TabBarItem, 'name'>;
}

/** What `useTabPager()` returns. */
export interface TabPagerState {
  /** The destinations that are pages, in pager order. */
  pages: readonly AppDestination[];
  /**
   * The page in front, or `null` when the route in front is not a page — a
   * detail route pushed over them.
   */
  activePage: string | null;
  /**
   * Where the bar's highlight is, in BAR item units, on the UI thread.
   * Fractional while a page is under the finger.
   */
  progress: SharedValue<number>;
  /**
   * How far the bar is gone: 0 over a page with a bar item (and over any pushed
   * route), 1 over a page without one, fractional under the finger.
   */
  chromeProgress: SharedValue<number>;
  /**
   * Bring a page to the front. Anything pushed over the pages is dismissed
   * first, so the page is what the reader sees.
   */
  selectTab: (name: string) => void;
  /**
   * Bring `to` to the front and forget `from`, so neither Back nor the pager
   * returns to it — for a page whose work is finished, like a published
   * composer. On web the browser entry is replaced.
   */
  leaveTab: (from: string, to: string) => void;
  /**
   * What pressing a destination does, wherever it is drawn: its `onPress` if it
   * is an action; the provider's `onReselect` if it is already in front; a page
   * through the pager; anything else by navigating to its `href`.
   */
  selectDestination: (name: string) => void;
}

export type TabPagerBottomBarProps = Omit<
  BottomBarProps,
  'items' | 'value' | 'onValueChange' | 'activeProgress' | 'hideProgress'
> & {
  /** @deprecated Pass `onReselect` to `TabPagerProvider`; the sidebar shares it. */
  onReselect?: (name: string) => void;
};
