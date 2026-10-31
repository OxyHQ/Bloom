import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import { findNodeHandle, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useEvent,
  useHandler,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Screen } from 'react-native-screens';
import { animateMotion } from '../../motion/recipes';
import { ScreenActivity } from '../../screen/ScreenActivity';
import { valueAtPage, type PageModel } from '../pages';
import type { ViewRef } from '../../styles/native-refs';
import type { TabBackPreview } from './back-preview';
import { PredictiveBackHost, isPredictiveBackAvailable } from './PredictiveBackHost';
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
  backPreview?: TabBackPreview | null;
  predictiveBackEnabled?: boolean;
  onBackPreviewCommit?: (sessionKey: string, gestureId: number, reject: () => void) => boolean;
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
 * A TAP TRANSITIONS WITHOUT TRAVELLING. To the page next door it slides, as a
 * swipe would: that neighbour is already laid out, and `onPageScroll` drives
 * the highlight. Further away it fades through (Material's bottom-navigation
 * transition): the page in front fades out, the pager cuts, the destination
 * fades in from a slight scale. An animated `setPage` there would scroll
 * through every page in between, unmounted and blank (measured ~680ms a tap on
 * a Pixel 10 Pro), so the highlight is sprung from here instead. Reduced
 * motion cuts.
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
  backPreview,
  predictiveBackEnabled = false,
  onBackPreviewCommit,
}: TabPagerProps) {
  const PagerView = loadAnimatedPagerView();
  const pagerRef = useRef<PagerViewHandle>(null);
  const { pages, barPositions, chromeHidden } = model;
  const routeByName = useMemo(
    () => new Map(state.routes.map((route) => [route.name, route])),
    [state.routes],
  );
  const focusedPage = Math.max(0, model.indexOf(state.routes[state.index]?.name ?? ''));
  const previewPage =
    backPreview && isPredictiveBackAvailable() ? model.indexOf(backPreview.to) : -1;
  const [destinationTag, setDestinationTag] = useState(0);
  const destinationRef = useCallback((view: ViewRef | null) => {
    setDestinationTag(view ? (findNodeHandle(view) ?? 0) : 0);
  }, []);
  const predictiveCommitPage = useRef<number | null>(null);
  const lastNativeGesture = useRef(0);
  const pendingGestureId = useRef<number | null>(null);
  const [settledGestureId, setSettledGestureId] = useState(0);
  const [pendingGesture, setPendingGesture] = useState<{
    gestureId: number;
    sessionKey: string;
    destinationTag: number;
    page: number;
    state: TabPagerProps['state'];
  } | null>(null);
  const settleGesture = useCallback((gestureId: number) => {
    setSettledGestureId((current) => Math.max(current, gestureId));
    setPendingGesture((pending) => (pending?.gestureId === gestureId ? null : pending));
    if (pendingGestureId.current === gestureId) {
      predictiveCommitPage.current = null;
      pendingGestureId.current = null;
    }
  }, []);
  useEffect(() => {
    if (!pendingGesture) return;
    if (
      !predictiveBackEnabled ||
      (state === pendingGesture.state && backPreview?.sessionKey !== pendingGesture.sessionKey) ||
      (state !== pendingGesture.state && focusedPage !== pendingGesture.page)
    ) {
      settleGesture(pendingGesture.gestureId);
    }
  }, [
    pendingGesture,
    predictiveBackEnabled,
    state,
    focusedPage,
    settleGesture,
    backPreview?.sessionKey,
  ]);

  // The page the PAGER believes it is on. A swipe commits a route, the route
  // drives the pager, the pager reports the page again: this ref is what keeps
  // the two directions from echoing.
  const pageRef = useRef(focusedPage);
  const reducedMotion = useReducedMotion();
  // The fade-through's visibility of the pager, 1 at rest.
  const fade = useSharedValue(1);
  const fadeStyle = useAnimatedStyle(
    () => ({
      opacity: fade.value,
      transform: [{ scale: FADE_THROUGH_SCALE + (1 - FADE_THROUGH_SCALE) * fade.value }],
    }),
    [fade],
  );
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
  const cutTo = useCallback((page: number) => {
    pagerRef.current?.setPageWithoutAnimation(page);
  }, []);
  // Commit the already-previewed destination before paint, without the normal
  // tap animation or visiting pages between two nonadjacent history entries.
  useLayoutEffect(() => {
    if (predictiveCommitPage.current !== focusedPage) return;
    predictiveCommitPage.current = null;
    pageRef.current = focusedPage;
    cutTo(focusedPage);
    setSettledPage(focusedPage);
    progress.value = barPositions[focusedPage] ?? 0;
    chromeProgress.value = chromeHidden[focusedPage] ?? 0;
  }, [focusedPage, cutTo, progress, chromeProgress, barPositions, chromeHidden]);
  useEffect(() => {
    if (previewPage >= 0) admit([keyForPage(previewPage)]);
  }, [previewPage, admit, keyForPage]);
  useEffect(() => {
    const from = pageRef.current;
    if (focusedPage === from) return;
    pageRef.current = focusedPage;
    admit([keyForPage(focusedPage)]);
    if (!PagerView) {
      setSettledPage(focusedPage);
    } else if (!reducedMotion && Math.abs(focusedPage - from) === 1) {
      pagerRef.current?.setPage(focusedPage);
      return;
    } else if (!reducedMotion) {
      fade.value = withTiming(0, FADE_OUT, (finished) => {
        if (!finished) return;
        runOnJS(cutTo)(focusedPage);
        fade.value = withTiming(1, FADE_IN);
      });
    } else {
      cutTo(focusedPage);
    }
    animateMotion(progress, barPositions[focusedPage] ?? 0, 'select');
  }, [
    focusedPage,
    keyForPage,
    admit,
    PagerView,
    reducedMotion,
    fade,
    cutTo,
    progress,
    barPositions,
  ]);

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
      if (pendingGesture?.page === next) settleGesture(pendingGesture.gestureId);
      const page = pages[next];
      if (next === pageRef.current || !page) return;
      pageRef.current = next;
      admit([keyForPage(next)]);
      onCommit(page.name);
    },
    [pages, onCommit, admit, keyForPage, pendingGesture, settleGesture],
  );

  const children = pages.map((page, index) => {
    const route = routeByName.get(page.name);
    const descriptor = route ? descriptors[route.key] : undefined;
    const focused = index === focusedPage;
    return (
      <View
        key={page.name}
        ref={index === previewPage ? destinationRef : undefined}
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
              focused
                ? 2
                : index === previewPage ||
                    (page.bar && page.preload) ||
                    Math.abs(index - settledPage) <= 1
                  ? 1
                  : 0
            }
            style={styles.page}
          >
            <ScreenActivity active={focused}>{descriptor.render()}</ScreenActivity>
          </Screen>
        ) : null}
      </View>
    );
  });

  if (!PagerView) return <View style={styles.page}>{children}</View>;
  return (
    <PredictiveBackHost
      style={styles.page}
      enabled={predictiveBackEnabled && (pendingGesture !== null || previewPage >= 0)}
      destinationTag={pendingGesture?.destinationTag ?? destinationTag}
      sessionKey={pendingGesture?.sessionKey ?? backPreview?.sessionKey ?? ''}
      settledGestureId={settledGestureId}
      onBackCommitted={({ nativeEvent }) => {
        if (nativeEvent.gestureId <= lastNativeGesture.current) return;
        lastNativeGesture.current = nativeEvent.gestureId;
        if (
          !predictiveBackEnabled ||
          !backPreview ||
          nativeEvent.sessionKey !== backPreview.sessionKey
        ) {
          settleGesture(nativeEvent.gestureId);
          return;
        }
        predictiveCommitPage.current = previewPage;
        pendingGestureId.current = nativeEvent.gestureId;
        setPendingGesture({ ...nativeEvent, destinationTag, page: previewPage, state });
        if (
          !onBackPreviewCommit?.(nativeEvent.sessionKey, nativeEvent.gestureId, () =>
            settleGesture(nativeEvent.gestureId),
          )
        ) {
          settleGesture(nativeEvent.gestureId);
        }
      }}
    >
      <Animated.View style={[styles.page, fadeStyle]}>
        <PagerView
          ref={pagerRef}
          style={styles.page}
          initialPage={focusedPage}
          // One page either side: exactly what neighbour admission maintains.
          offscreenPageLimit={Math.max(
            1,
            previewPage >= 0 ? Math.abs(previewPage - focusedPage) : 1,
          )}
          // An overdrag at either end is a horizontal gesture stolen from a child.
          overdrag={false}
          onPageScroll={onPageScroll}
          onPageSelected={onPageSelected}
          onPageScrollStateChanged={onPageScrollStateChanged}
        >
          {children}
        </PagerView>
      </Animated.View>
    </PredictiveBackHost>
  );
}

/** Material's fade-through: out fast, in from a slight scale. */
const FADE_THROUGH_SCALE = 0.96;
const FADE_OUT = { duration: 90, easing: Easing.in(Easing.quad) };
const FADE_IN = { duration: 210, easing: Easing.out(Easing.cubic) };

const styles = StyleSheet.create({
  page: { flex: 1 },
  hidden: { display: 'none' },
});
