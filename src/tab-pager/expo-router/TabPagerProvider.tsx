import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { animateMotion } from '../../motion/recipes';
import { useRouter, usePathname, type Href } from '../../panel-routing/expo-router';
import {
  TabPagerActiveContext,
  TabPagerChromeContext,
  TabPagerContext,
  type TabCommitter,
  type TabPagerActive,
  type TabPagerChrome,
  type TabPagerContextValue,
} from '../context';
import {
  barItemsOf,
  createPageModel,
  destinationsOfPages,
  pagesOf,
  pagesStructure,
  sidebarItemsOf,
} from '../pages';
import type { AppDestination, TabPage } from '../types';

export type TabPagerProviderProps = {
  /**
   * Pressing the destination already in front, from the bar or the sidebar.
   * Defaults to the `AppShell`'s reselect: the screen in front back to its
   * top, and a reload when it is already there (`useScreenReselectHandler`).
   */
  onReselect?: (name: string) => void;
  /**
   * An opaque viewer/session identity. Change it when retained pages change
   * authority, even if the current path and navigation history stay the same.
   * A predictive gesture from the old scope is cancelled, never committed.
   */
  navigationScopeKey?: string;
  children: ReactNode;
} & (
  | {
      /**
       * Every place the app's navigation leads, declared once: the pages in
       * pager order, and the sidebar's rows in this same order.
       */
      destinations: readonly AppDestination[];
      pages?: never;
    }
  | {
      /** @deprecated Pass `destinations`. */
      pages: readonly TabPage[];
      destinations?: never;
    }
);

/**
 * The one authority on the app's navigation: which destination and which root
 * page is in front, where the bar's highlight sits, and what pressing a
 * destination does. Mount it above the `AppShell`: the shell composes its
 * sidebar and bottom bar from it, the tabs layout pages through it, and the bar
 * renders over pushed routes too.
 *
 * The highlight moves when the reader ACTS, not when the incoming screen has
 * finished rendering: a tap springs it at once, and with the pager mounted the
 * finger drives it. On web, where there is no navigator, a tap navigates by
 * href and every page's route chunk is warmed up front.
 */
export function TabPagerProvider({
  destinations: declared,
  pages: legacyPages,
  onReselect,
  navigationScopeKey,
  children,
}: TabPagerProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const destinations = useMemo(
    () => declared ?? destinationsOfPages(legacyPages ?? []),
    [declared, legacyPages],
  );
  const pages = useMemo(() => pagesOf(destinations), [destinations]);
  const structure = pagesStructure(pages);
  // Keyed on the structure, not the array: labels and icons change with a
  // badge, and nothing but the chrome should re-render for that.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `structure` is what the model reads from `pages`.
  const model = useMemo(() => createPageModel(pages), [structure]);
  const chrome = useMemo<TabPagerChrome>(
    () => ({
      destinations,
      barItems: barItemsOf(pages),
      sidebarItems: sidebarItemsOf(destinations),
    }),
    [pages, destinations],
  );
  // Read when pressed, so pressing never re-creates what holds the callback.
  const destinationsRef = useRef(destinations);
  destinationsRef.current = destinations;
  const onReselectRef = useRef(onReselect);
  onReselectRef.current = onReselect;
  const shellReselectRef = useRef<(() => void) | null>(null);
  const registerReselect = useCallback((reselect: () => void) => {
    shellReselectRef.current = reselect;
    return () => {
      if (shellReselectRef.current === reselect) shellReselectRef.current = null;
    };
  }, []);

  const activeIndex = model.indexForPathname(pathname);
  const activeDestination = pathname
    ? (destinations.find((destination) => destination.href === pathname)?.name ?? null)
    : null;
  const activeDestinationRef = useRef(activeDestination);
  activeDestinationRef.current = activeDestination;
  const activeBar = model.barIndexOf(activeIndex);
  const chromeTarget = activeIndex >= 0 ? (model.chromeHidden[activeIndex] ?? 0) : 0;
  const progress = useSharedValue(model.barPositions[activeIndex] ?? 0);
  const chromeProgress = useSharedValue(chromeTarget);
  const committerRef = useRef<TabCommitter | null>(null);
  // Read when a page is selected, not a dependency of `selectTab`: everything
  // that holds `selectTab` — the tabs layout above all — would otherwise
  // re-render on every navigation.
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  const registerCommitter = useCallback((committer: TabCommitter | null) => {
    committerRef.current = committer;
  }, []);

  // The highlight follows a navigation nobody here performed — a deep link, a
  // browser Back — while no pager is writing it. -1 is never written: it is a
  // real position outside the pill, and a pushed route's "no selection" is the
  // bar's `value`, which fades the capsule where it stands.
  useEffect(() => {
    if (committerRef.current || activeBar < 0) return;
    animateMotion(progress, activeBar, 'select');
  }, [activeBar, progress]);

  // The bar's presence settles on the route in front whoever put it there,
  // pager or not: a route pushed over a page without a bar item is not that
  // page, and keeps the bar.
  useEffect(() => {
    animateMotion(chromeProgress, chromeTarget, 'select');
  }, [chromeTarget, chromeProgress]);

  // Web: each route is an async chunk with no navigator keeping it alive, so
  // the first visit to a page would wait on a fetch. Native has every page
  // mounted under the pager already.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    for (const page of model.pages) router.prefetch(page.href as Href);
  }, [model, router]);

  const selectTab = useCallback(
    (name: string) => {
      const index = model.indexOf(name);
      const page = model.pages[index];
      if (!page) return;
      const committer = committerRef.current;
      // No navigator (web): the route is the whole operation. Nothing is
      // dismissed here — on web that history is the browser's, and a
      // `dismissAll` queued beside a `navigate` resolves against the tree the
      // pop just changed, bouncing the reader straight back.
      if (!committer) {
        const bar = model.barIndexOf(index);
        if (bar >= 0) animateMotion(progress, bar, 'select');
        router.navigate(page.href as Href);
        return;
      }
      // With a navigator, switching changes what sits UNDER a pushed route, so
      // the push is dismissed first — and only when something is pushed:
      // `canDismiss()` is true for ordinary stack history as well.
      if (activeIndexRef.current < 0 && router.canDismiss()) router.dismissAll();
      committer.commit(name);
    },
    [model, progress, router],
  );

  const leaveTab = useCallback(
    (from: string, to: string) => {
      const target = model.pages[model.indexOf(to)];
      if (!target || model.indexOf(from) < 0) return;
      const committer = committerRef.current;
      if (committer) committer.leave(from, to);
      else router.replace(target.href as Href);
    },
    [model, router],
  );

  const selectDestination = useCallback(
    (name: string) => {
      const destination = destinationsRef.current.find((candidate) => candidate.name === name);
      if (!destination) return;
      if (destination.onPress) {
        destination.onPress();
        return;
      }
      if (name === activeDestinationRef.current) {
        if (onReselectRef.current) onReselectRef.current(name);
        else shellReselectRef.current?.();
        return;
      }
      if (model.indexOf(name) >= 0) selectTab(name);
      else router.navigate(destination.href as Href);
    },
    [model, router, selectTab],
  );

  const value = useMemo<TabPagerContextValue>(
    () => ({
      pages: model.pages,
      model,
      navigationScopeKey,
      progress,
      chromeProgress,
      selectTab,
      leaveTab,
      selectDestination,
      registerCommitter,
      registerReselect,
    }),
    [
      model,
      navigationScopeKey,
      progress,
      chromeProgress,
      selectTab,
      leaveTab,
      selectDestination,
      registerCommitter,
      registerReselect,
    ],
  );
  const active = useMemo<TabPagerActive>(
    () => ({ activeIndex, activePage: model.pages[activeIndex]?.name ?? null, activeDestination }),
    [model, activeIndex, activeDestination],
  );

  return (
    <TabPagerContext.Provider value={value}>
      <TabPagerActiveContext.Provider value={active}>
        <TabPagerChromeContext.Provider value={chrome}>{children}</TabPagerChromeContext.Provider>
      </TabPagerActiveContext.Provider>
    </TabPagerContext.Provider>
  );
}
