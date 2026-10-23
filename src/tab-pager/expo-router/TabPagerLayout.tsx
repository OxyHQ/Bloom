import { useCallback, useEffect, useMemo } from 'react';
import { useTabsWithTriggers } from 'expo-router/ui';
import type { Href } from '../../panel-routing/expo-router';
import { useTabPagerContext } from '../context';
import { stateLeavingTab } from './leave-tab';
import { TabPager } from './TabPager';

/**
 * The tabs group's layout: one navigator over the provider's pages, paged side
 * by side. Default-export it from the group's `_layout.tsx`.
 *
 * The pages stay mounted under the pager, so switching neither remounts a
 * screen nor loses its scroll. Back retraces the pages actually visited
 * (`backBehavior: 'history'`), as in every tabbed app.
 */
export function TabPagerLayout() {
  const { model, progress, chromeProgress, selectTab, registerCommitter } = useTabPagerContext();
  const { pages } = model;

  const triggers = useMemo(
    () =>
      pages.map((page) => ({
        type: 'internal' as const,
        name: page.name,
        href: page.href as Href,
      })),
    [pages],
  );
  const { state, descriptors, navigation, NavigationContent } = useTabsWithTriggers({
    triggers,
    backBehavior: 'history',
  });

  // Expo Router creates a tab's route on its first visit; the pager renders
  // each page from its route, so an unvisited page would be blank under the
  // finger. `preload` adds the route without focusing it or touching history.
  useEffect(() => {
    for (const page of pages) {
      if (!state.routes.some((route) => route.name === page.name)) navigation.preload(page.name);
    }
  }, [pages, navigation, state.routes]);

  const commit = useCallback((name: string) => navigation.navigate(name), [navigation]);
  // One state change: a `RESET` to the history without the page being left.
  const leave = useCallback(
    (from: string, to: string) => {
      const current = navigation.getState();
      const next = stateLeavingTab(current, from, to);
      navigation.dispatch(
        next
          ? { type: 'RESET', payload: next, target: current.key }
          : { type: 'NAVIGATE', payload: { name: to }, target: current.key },
      );
    },
    [navigation],
  );

  useEffect(() => {
    registerCommitter({ commit, leave });
    return () => registerCommitter(null);
  }, [commit, leave, registerCommitter]);

  if (process.env.NODE_ENV !== 'production') {
    const missing = pages.filter((page) => !state.routeNames.includes(page.name));
    if (missing.length > 0) {
      console.warn(
        `[Bloom] The tab pager's navigator has no route for ${missing
          .map((page) => `"${page.name}"`)
          .join(', ')}: each page needs a route file of that name in the tabs group.`,
      );
    }
  }

  return (
    <NavigationContent>
      <TabPager
        model={model}
        state={state}
        descriptors={descriptors}
        progress={progress}
        chromeProgress={chromeProgress}
        // A swipe takes the same path as a tap, including dismissing a push.
        onCommit={selectTab}
      />
    </NavigationContent>
  );
}
