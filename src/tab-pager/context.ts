import { createContext, useContext, useMemo } from 'react';
import type { SidebarNavItem } from '../sidebar/types';
import type { TabBarItem } from '../tab-bar/types';
import type { PageModel } from './pages';
import type { AppDestination, TabPagerActions, TabPagerState } from './types';

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
  /** Invalidates native navigation previews when the viewer/session changes. */
  navigationScopeKey?: string;
  registerCommitter: (committer: TabCommitter | null) => void;
  /**
   * What reselecting means when the provider is given no `onReselect`: an
   * `AppShell` below registers its screens' reselect (back to the top, then a
   * reload).
   */
  registerReselect: (reselect: () => void) => () => void;
}

export const TabPagerContext = createContext<TabPagerContextValue | null>(null);

/** The page in front, apart from the rest: it changes on every navigation. */
export interface TabPagerActive {
  /** The page in front as a PAGE index, or -1. */
  activeIndex: number;
  activePage: string | null;
  /** The destination in front, page or not, or `null` on any other route. */
  activeDestination: string | null;
}

export const TabPagerActiveContext = createContext<TabPagerActive>({
  activeIndex: -1,
  activePage: null,
  activeDestination: null,
});

/**
 * What the bar and the sidebar draw, apart from the rest: labels and icons (an
 * unread badge, an avatar) change far more often than the pages do, and only
 * the navigation chrome draws them.
 */
export interface TabPagerChrome {
  destinations: readonly AppDestination[];
  barItems: TabBarItem[];
  sidebarItems: SidebarNavItem[];
}

export const TabPagerChromeContext = createContext<TabPagerChrome>({
  destinations: [],
  barItems: [],
  sidebarItems: [],
});

export function useTabPagerContext(): TabPagerContextValue {
  const value = useContext(TabPagerContext);
  if (!value) throw new Error('useTabPager must be used within a TabPagerProvider');
  return value;
}

/**
 * The app's root pages and how to move between them, without the page in
 * front. It changes only with the pages' structure, so a component that only
 * moves (a shell's primary action, a header's button, a page's own exit) does
 * not re-render on every navigation, a pushed post included.
 */
export function useTabPagerActions(): TabPagerActions {
  const { pages, progress, chromeProgress, selectTab, leaveTab, selectDestination } =
    useTabPagerContext();
  return useMemo(
    () => ({ pages, progress, chromeProgress, selectTab, leaveTab, selectDestination }),
    [pages, progress, chromeProgress, selectTab, leaveTab, selectDestination],
  );
}

/**
 * The app's root pages: which one is in front, and how to move between them.
 * It re-renders on every navigation; read `useTabPagerActions()` when the page
 * in front is not drawn.
 */
export function useTabPager(): TabPagerState {
  const actions = useTabPagerActions();
  const { activePage } = useContext(TabPagerActiveContext);
  return useMemo(() => ({ ...actions, activePage }), [actions, activePage]);
}
