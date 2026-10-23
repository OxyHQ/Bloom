import { createContext, useContext, useMemo } from 'react';
import type { TabBarItem } from '../tab-bar/types';
import type { PageModel } from './pages';
import type { TabPagerState } from './types';

/**
 * What a mounted tabs navigator takes over from the provider.
 *
 * The provider sits ABOVE the navigator because the bar does — it renders over
 * pushed routes too — and because on web there is no navigator at all. The
 * navigator registers itself when it mounts; while it is registered, its pager
 * is the one writer of `progress` and the provider stops springing it.
 */
export interface TabCommitter {
  /** Switch page through the navigator's own move: no history entry per swipe. */
  commit: (name: string) => void;
  /** Switch page and drop `from` from the navigator's back history. */
  leave: (from: string, to: string) => void;
}

/**
 * Everything but the page in front. It changes only with the pages' structure,
 * so the tabs layout — whose navigator hook is costly to re-run — reads this and
 * nothing else; `selectTab` reads the page in front when it is called.
 */
export interface TabPagerContextValue extends Omit<TabPagerState, 'activePage'> {
  model: PageModel;
  registerCommitter: (committer: TabCommitter | null) => void;
}

export const TabPagerContext = createContext<TabPagerContextValue | null>(null);

/** The page in front, apart from the rest: it changes on every navigation. */
export interface TabPagerActive {
  /** The page in front as a PAGE index, or -1. */
  activeIndex: number;
  activePage: string | null;
}

export const TabPagerActiveContext = createContext<TabPagerActive>({
  activeIndex: -1,
  activePage: null,
});

/**
 * The bar's items, apart from the rest: labels and icons (an unread badge, an
 * avatar) change far more often than the pages do, and only the bar draws them.
 */
export const TabPagerItemsContext = createContext<TabBarItem[]>([]);

export function useTabPagerContext(): TabPagerContextValue {
  const value = useContext(TabPagerContext);
  if (!value) throw new Error('useTabPager must be used within a TabPagerProvider');
  return value;
}

/** The app's root pages: which one is in front, and how to move between them. */
export function useTabPager(): TabPagerState {
  const { pages, progress, chromeProgress, selectTab, leaveTab } = useTabPagerContext();
  const { activePage } = useContext(TabPagerActiveContext);
  return useMemo(
    () => ({ pages, activePage, progress, chromeProgress, selectTab, leaveTab }),
    [pages, activePage, progress, chromeProgress, selectTab, leaveTab],
  );
}
