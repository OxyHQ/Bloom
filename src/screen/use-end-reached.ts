import { useCallback, useEffect, useRef } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { runOnJS, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

/**
 * React Native `FlatList`'s own default: report the end while it is within two
 * viewports. `VirtualList` (both platforms) and `ScreenScrollView` share it, so a
 * page that switches between them paginates at the same distance.
 */
export const DEFAULT_END_REACHED_THRESHOLD = 2;

/** `sentFor` while nothing has been reported since the last re-arm. */
export const END_REACHED_ARMED = -1;

export interface EndReachedMetrics {
  /** Distance scrolled from the top. */
  offset: number;
  /** Visible length of the scroller. */
  viewport: number;
  /** Full scrollable content length. */
  content: number;
}

/**
 * One step of the end-reached state machine, shared by the UI-thread scroll
 * handler and the JS-thread layout checks so both answer identically.
 *
 * `sentFor` is the content length the end was last reported for, exactly like
 * `FlatList`'s `_sentEndForContentLength`: it fires once per approach, re-arms
 * when the user scrolls back out of the threshold, and re-fires while still near
 * the end only once the content has changed length (a page arrived and was
 * still too short to fill the viewport). Empty content never fires.
 */
export function stepEndReached(
  sentFor: number,
  { offset, viewport, content }: EndReachedMetrics,
  threshold: number,
): { fire: boolean; sentFor: number } {
  'worklet';
  if (content <= 0 || viewport <= 0) return { fire: false, sentFor };
  const distanceFromEnd = content - viewport - offset;
  if (distanceFromEnd >= threshold * viewport) return { fire: false, sentFor: END_REACHED_ARMED };
  if (sentFor === content) return { fire: false, sentFor };
  return { fire: true, sentFor: content };
}

/**
 * Native `onEndReached` for a plain (non-virtualized) scroller. The scroll
 * check runs on the UI thread and only hops to JS to report; layout and
 * content-size changes run the same check on JS, so content shorter than its
 * viewport — which never scrolls — still asks for the next page.
 */
export function useEndReached(onEndReached: (() => void) | undefined, threshold: number) {
  const enabled = onEndReached != null;
  const sentFor = useSharedValue(END_REACHED_ARMED);
  const offset = useSharedValue(0);
  const viewport = useRef(0);
  const content = useRef(0);
  // Latest callback, assigned after commit: the report always reaches the
  // handler the page rendered last, without re-creating the worklet.
  const latest = useRef(onEndReached);
  useEffect(() => {
    latest.current = onEndReached;
  }, [onEndReached]);
  const report = useCallback(() => latest.current?.(), []);

  const check = useCallback(() => {
    if (!enabled) return;
    const step = stepEndReached(
      sentFor.value,
      { offset: offset.value, viewport: viewport.current, content: content.current },
      threshold,
    );
    sentFor.value = step.sentFor;
    if (step.fire) report();
  }, [enabled, sentFor, offset, threshold, report]);

  const handler = useAnimatedScrollHandler(
    {
      onScroll: (event) => {
        offset.value = event.contentOffset.y;
        if (!enabled) return;
        const step = stepEndReached(
          sentFor.value,
          {
            offset: event.contentOffset.y,
            viewport: event.layoutMeasurement.height,
            content: event.contentSize.height,
          },
          threshold,
        );
        sentFor.value = step.sentFor;
        if (step.fire) runOnJS(report)();
      },
    },
    [enabled, threshold, sentFor, offset, report],
  );

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      viewport.current = event.nativeEvent.layout.height;
      check();
    },
    [check],
  );
  const onContentSizeChange = useCallback(
    (_width: number, height: number) => {
      content.current = height;
      check();
    },
    [check],
  );
  return { handler: enabled ? handler : null, onLayout, onContentSizeChange };
}
