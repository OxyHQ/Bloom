import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { useTabsWithTriggers } from 'expo-router/ui';
import { useIsFocused, type Href } from '../../panel-routing/expo-router';
import { hasBackOwner, subscribeBackOwnership } from '../../overlay/back-ownership';
import { hasActiveOverlays, subscribeActiveOverlays } from '../../overlay/stack';
import { useTabPagerContext } from '../context';
import { stateLeavingTab } from './leave-tab';
import { TabPager } from './TabPager';
import { TabPagesHost } from './TabPagesHost';
import { tabBackPreview } from './back-preview';
import { supportsPredictiveNavigation } from './predictive-navigation';
import { isPredictiveBackAvailable } from './PredictiveBackHost';

const isBackBlocked = () => hasBackOwner() || hasActiveOverlays();
function subscribeBackBlocked(notify: () => void) {
  const releaseBack = subscribeBackOwnership(notify);
  const releaseOverlay = subscribeActiveOverlays(notify);
  return () => {
    releaseBack();
    releaseOverlay();
  };
}

/**
 * The tabs group's layout: one navigator over the provider's pages, paged side
 * by side. Default-export it from the group's `_layout.tsx`.
 *
 * The pages stay mounted under the pager, so switching neither remounts a
 * screen nor loses its scroll. Back retraces the pages actually visited
 * (`backBehavior: 'history'`), as in every tabbed app.
 */
export function TabPagerLayout() {
  const { model, progress, chromeProgress, selectTab, registerCommitter, navigationScopeKey } =
    useTabPagerContext();
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
  const focused = useIsFocused();
  const nativeBackAvailable =
    isPredictiveBackAvailable() && supportsPredictiveNavigation(navigation);
  const blocked = useSyncExternalStore(subscribeBackBlocked, isBackBlocked, () => false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: a navigator RESET replaces its native ownership key even if the helpers object is retained.
  useEffect(() => {
    if (!nativeBackAvailable || blocked || !supportsPredictiveNavigation(navigation)) return;
    const registration = navigation.registerNativeBackNavigation();
    return () => registration.remove();
  }, [navigation, state.key, nativeBackAvailable, blocked]);
  // A pure render-time state adjustment gives each committed owner/state a
  // revision. React discards the intermediate render; memo retries never read
  // or advance an external counter.
  const [snapshot, setSnapshot] = useState({
    state,
    navigationScopeKey,
    focused,
    blocked,
    revision: 0,
  });
  if (
    snapshot.state !== state ||
    snapshot.navigationScopeKey !== navigationScopeKey ||
    snapshot.focused !== focused ||
    snapshot.blocked !== blocked
  ) {
    setSnapshot({ state, navigationScopeKey, focused, blocked, revision: snapshot.revision + 1 });
  }
  const backPreview = useMemo(() => {
    const preview = tabBackPreview(state);
    return preview
      ? { ...preview, sessionKey: `${snapshot.revision}:${preview.sessionKey}` }
      : null;
  }, [state, snapshot.revision]);
  const lastGesture = useRef(0);
  const pendingResult = useRef<{ remove(): void } | null>(null);
  // remove() cancels a queued guarded action as well as its observer. A viewer
  // switch with unchanged route keys must never execute the previous scope's Back.
  // biome-ignore lint/correctness/useExhaustiveDependencies: each owner/state revision invalidates work queued by the previous committed owner.
  useLayoutEffect(() => () => pendingResult.current?.remove(), [snapshot.revision]);
  const commitBackPreview = useCallback(
    (sessionKey: string, gestureId: number, reject: () => void) => {
      if (
        !nativeBackAvailable ||
        !supportsPredictiveNavigation(navigation) ||
        !navigation.isFocused() ||
        isBackBlocked() ||
        gestureId <= lastGesture.current
      )
        return false;
      lastGesture.current = gestureId;
      const current = navigation.getState();
      if (current !== state || backPreview?.sessionKey !== sessionKey) return false;
      pendingResult.current?.remove();
      pendingResult.current = navigation.dispatchWithResult(
        {
          type: 'GO_BACK',
          source: current.routes[current.index]?.key,
          target: current.key,
        },
        { expectedState: current },
        ({ status }) => {
          if (status !== 'handled') reject();
        },
      );
      return true;
    },
    [navigation, state, backPreview, nativeBackAvailable],
  );

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
      <TabPagesHost>
        <TabPager
          model={model}
          state={state}
          descriptors={descriptors}
          progress={progress}
          chromeProgress={chromeProgress}
          // A swipe takes the same path as a tap, including dismissing a push.
          onCommit={selectTab}
          backPreview={backPreview}
          predictiveBackEnabled={nativeBackAvailable && focused && !blocked}
          onBackPreviewCommit={commitBackPreview}
        />
      </TabPagesHost>
    </NavigationContent>
  );
}
