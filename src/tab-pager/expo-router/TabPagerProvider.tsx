import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { animateMotion } from '../../motion/recipes';
import { useRouter, usePathname, type Href } from '../../panel-routing/expo-router';
import {
  TabPagerContext,
  TabPagerItemsContext,
  type TabCommitter,
  type TabPagerContextValue,
} from '../context';
import { barItemsOf, createPageModel, pagesStructure } from '../pages';
import type { TabPage } from '../types';

export interface TabPagerProviderProps {
  /** The app's root pages, in pager order. */
  pages: readonly TabPage[];
  children: ReactNode;
}

/**
 * The one authority on which root page is in front and where the bar's
 * highlight sits. Mount it above the `AppShell`: the bar and the tabs layout
 * both read it, and the bar renders over pushed routes too.
 *
 * The highlight moves when the reader ACTS, not when the incoming screen has
 * finished rendering: a tap springs it at once, and with the pager mounted the
 * finger drives it. On web, where there is no navigator, a tap navigates by
 * href and every page's route chunk is warmed up front.
 */
export function TabPagerProvider({ pages, children }: TabPagerProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const structure = pagesStructure(pages);
  // Keyed on the structure, not the array: labels and icons change with a
  // badge, and nothing but the bar should re-render for that.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `structure` is what the model reads from `pages`.
  const model = useMemo(() => createPageModel(pages), [structure]);
  const items = useMemo(() => barItemsOf(pages), [pages]);

  const activeIndex = model.indexForPathname(pathname);
  const activeBar = model.barIndexOf(activeIndex);
  const chromeTarget = activeIndex >= 0 ? (model.chromeHidden[activeIndex] ?? 0) : 0;
  const progress = useSharedValue(model.barPositions[activeIndex] ?? 0);
  const chromeProgress = useSharedValue(chromeTarget);
  const committerRef = useRef<TabCommitter | null>(null);

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
      if (activeIndex < 0 && router.canDismiss()) router.dismissAll();
      committer.commit(name);
    },
    [model, progress, activeIndex, router],
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

  const value = useMemo<TabPagerContextValue>(
    () => ({
      pages: model.pages,
      model,
      activeIndex,
      activePage: model.pages[activeIndex]?.name ?? null,
      progress,
      chromeProgress,
      selectTab,
      leaveTab,
      registerCommitter,
    }),
    [model, activeIndex, progress, chromeProgress, selectTab, leaveTab, registerCommitter],
  );

  return (
    <TabPagerContext.Provider value={value}>
      <TabPagerItemsContext.Provider value={items}>{children}</TabPagerItemsContext.Provider>
    </TabPagerContext.Provider>
  );
}
