/**
 * Public types for `@oxy.so/bloom/tab-pager`.
 *
 * This module names no router and no pager package: it is read by a consumer's
 * `tsc`, by Metro and by every web bundler alike. The expo-router binding and
 * the optional `react-native-pager-view` peer live in `./expo-router`.
 */
import type { SharedValue } from 'react-native-reanimated';
import type { BottomBarProps } from '../bottom-bar/types';
import type { TabBarItem } from '../tab-bar/types';

/** One root page of the app, in pager order. */
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
  /** The pages handed to the provider, in pager order. */
  pages: readonly TabPage[];
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
}

export type TabPagerBottomBarProps = Omit<
  BottomBarProps,
  'items' | 'value' | 'onValueChange' | 'activeProgress' | 'hideProgress'
> & {
  /**
   * Pressing the item of the page already in front. Conventionally "scroll to
   * the top", then "refresh"; without it the press does nothing.
   */
  onReselect?: (name: string) => void;
};
