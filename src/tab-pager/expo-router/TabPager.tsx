import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useEvent, useHandler, type SharedValue } from 'react-native-reanimated';
import { Screen } from 'react-native-screens';
import { animateMotion } from '../../motion/recipes';
import { valueAtPage, type PageModel } from '../pages';
import {
  loadPagerView,
  warnPagerViewUnavailable,
  type PageScrollState,
  type PagerViewHandle,
  type PagerViewLikeProps,
} from './pager-view-module';

export interface TabPagerProps {
  model: PageModel;
  /** The tabs navigator's state. Pages reach their route BY NAME: expo-router sorts its routes. */
  state: { index: number; routes: readonly { key: string; name: string }[] };
  descriptors: Record<string, { render: () => ReactNode }>;
  progress: SharedValue<number>;
  chromeProgress: SharedValue<number>;
  /** A page the reader landed on by swiping. */
  onCommit: (name: string) => void;
}

type PageScrollEvent = { position: number; offset: number };

let animatedPagerView: ComponentType<PagerViewLikeProps> | null | undefined;
function loadAnimatedPagerView() {
  if (animatedPagerView === undefined) {
    const view = loadPagerView();
    animatedPagerView = view
      ? (Animated.createAnimatedComponent(
          view as never,
        ) as unknown as ComponentType<PagerViewLikeProps>)
      : null;
  }
  return animatedPagerView;
}

/**
 * `onPageScroll` on the UI thread. The pager's scroll event is a DIRECT event,
 * so reanimated subscribes to it by name: no JS frame between the finger and
 * the highlight.
 */
function usePageScrollHandler(handler: (event: PageScrollEvent) => void, deps: unknown[]) {
  const { doDependenciesDiffer } = useHandler({ onPageScroll: handler }, deps);
  return useEvent<PageScrollEvent>(
    (event) => {
      'worklet';
      handler(event);
    },
    ['onPageScroll'],
    doDependenciesDiffer,
  );
}

/**
 * The root pages side by side, paged by the platform's own pager (ViewPager2,
 * `UIPageViewController`): the components whose whole job is deciding mid-touch
 * whether a drag belongs to the pager or to a child that also scrolls.
 *
 * PAGES ARE POSITIONAL. The pager addresses children by index, so a page not
 * yet admitted renders an empty view, never `null` — a missing child would
 * shift every page after it.
 *
 * A TAP CUTS. `setPageWithoutAnimation`: an animated `setPage` scrolls through
 * every page in between (measured ~680ms a tap on a Pixel 10 Pro). With no
 * scroll there is no `onPageScroll`, so the highlight is sprung from here for
 * a jump.
 *
 * Without `react-native-pager-view` the same pages render as a tap-only stack.
 */
export function TabPager({
  model,
  state,
  descriptors,
  progress,
  chromeProgress,
  onCommit,
}: TabPagerProps) {
  const PagerView = loadAnimatedPagerView();
  const pagerRef = useRef<PagerViewHandle>(null);
  const { pages, barPositions, chromeHidden } = model;
  const routeByName = useMemo(
    () => new Map(state.routes.map((route) => [route.name, route])),
    [state.routes],
  );
  const focusedPage = Math.max(0, model.indexOf(state.routes[state.index]?.name ?? ''));

  // The page the PAGER believes it is on. A swipe commits a route, the route
  // drives the pager, the pager reports the page again: this ref is what keeps
  // the two directions from echoing.
  const pageRef = useRef(focusedPage);
  // Routes allowed to render: the focused one, and preloading neighbours.
  const [loaded, setLoaded] = useState<ReadonlySet<string>>(
    () => new Set([state.routes[state.index]?.key].filter(Boolean) as string[]),
  );
  // Where the pager has come to REST. Neighbours are measured from here, not
  // from `focusedPage`, so a tap renders only its destination on that frame.
  const [settledPage, setSettledPage] = useState(focusedPage);

  useEffect(() => {
    if (!PagerView) warnPagerViewUnavailable();
  }, [PagerView]);

  const keyForPage = useCallback(
    (page: number) => routeByName.get(pages[page]?.name ?? '')?.key,
    [routeByName, pages],
  );
  const admit = useCallback((keys: (string | undefined)[]) => {
    setLoaded((current) => {
      let next: Set<string> | null = null;
      for (const key of keys) {
        if (!key || current.has(key)) continue;
        next ??= new Set(current);
        next.add(key);
      }
      return next ?? current;
    });
  }, []);
  const neighbourKeys = useCallback(
    (page: number) =>
      [page - 1, page + 1]
        .filter((index) => pages[index]?.preload === true)
        .map((index) => keyForPage(index)),
    [pages, keyForPage],
  );

  const onPageScroll = usePageScrollHandler(
    (event) => {
      'worklet';
      const position = event.position + event.offset;
      progress.value = valueAtPage(barPositions, position);
      chromeProgress.value = valueAtPage(chromeHidden, position);
    },
    [progress, chromeProgress, barPositions, chromeHidden],
  );

  // ROUTE → PAGER: a tap, a deep link, a back gesture. The bar's presence
  // needs nothing here: the provider settles it on every route landing.
  useEffect(() => {
    if (focusedPage === pageRef.current) return;
    pageRef.current = focusedPage;
    admit([keyForPage(focusedPage)]);
    pagerRef.current?.setPageWithoutAnimation(focusedPage);
    if (!PagerView) setSettledPage(focusedPage);
    animateMotion(progress, barPositions[focusedPage] ?? 0, 'select');
  }, [focusedPage, keyForPage, admit, PagerView, progress, barPositions]);

  // Warm the neighbours of the resting page on the frame AFTER it settled,
  // never on the frame that is already rendering the destination.
  useEffect(() => {
    const frame = requestAnimationFrame(() => admit(neighbourKeys(settledPage)));
    return () => cancelAnimationFrame(frame);
  }, [settledPage, admit, neighbourKeys]);

  const onPageScrollStateChanged = useCallback(
    (event: { nativeEvent: { pageScrollState: PageScrollState } }) => {
      const scrollState = event.nativeEvent.pageScrollState;
      if (scrollState === 'settling') return;
      // A finger may bring either neighbour into view within the frame.
      if (scrollState === 'dragging') admit(neighbourKeys(pageRef.current));
      setSettledPage(pageRef.current);
    },
    [admit, neighbourKeys],
  );

  // PAGER → ROUTE: a released swipe, or our own `setPage` (a no-op by the ref).
  const onPageSelected = useCallback(
    (event: { nativeEvent: { position: number } }) => {
      const next = event.nativeEvent.position;
      const page = pages[next];
      if (next === pageRef.current || !page) return;
      pageRef.current = next;
      admit([keyForPage(next)]);
      onCommit(page.name);
    },
    [pages, onCommit, admit, keyForPage],
  );

  const children = pages.map((page, index) => {
    const route = routeByName.get(page.name);
    const descriptor = route ? descriptors[route.key] : undefined;
    const focused = index === focusedPage;
    return (
      <View
        key={page.name}
        collapsable={false}
        style={[styles.page, !PagerView && !focused && styles.hidden]}
      >
        {route && descriptor && loaded.has(route.key) ? (
          // 2 drives the page in front; 1 keeps a page laid out and painted so
          // it is real under the finger or one tap away (every preloading bar
          // page, and the resting page's neighbours); 0 parks the rest.
          // Leaving 0 re-renders a frozen tree, so it is kept off the tap path.
          <Screen
            enabled
            activityState={
              focused ? 2 : (page.bar && page.preload) || Math.abs(index - settledPage) <= 1 ? 1 : 0
            }
            style={styles.page}
          >
            {descriptor.render()}
          </Screen>
        ) : null}
      </View>
    );
  });

  if (!PagerView) return <View style={styles.page}>{children}</View>;
  return (
    <PagerView
      ref={pagerRef}
      style={styles.page}
      initialPage={focusedPage}
      // One page either side: exactly what neighbour admission maintains.
      offscreenPageLimit={1}
      // An overdrag at either end is a horizontal gesture stolen from a child.
      overdrag={false}
      onPageScroll={onPageScroll}
      onPageSelected={onPageSelected}
      onPageScrollStateChanged={onPageScrollStateChanged}
    >
      {children}
    </PagerView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  hidden: { display: 'none' },
});
