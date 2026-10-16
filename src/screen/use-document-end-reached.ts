import { useCallback, useEffect, useRef, useState } from 'react';
import type { ViewStyle } from 'react-native';

/**
 * Where the end marker sits: the bottom edge of the content it measures,
 * absolutely positioned so it takes no room in the flow and is never spaced by
 * a container's `gap`.
 */
export const END_SENTINEL_STYLE: ViewStyle = {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  height: 1,
};

interface DocumentEndReachedOptions {
  onEndReached: (() => void) | undefined;
  /** Viewport-relative distance from the end, as in `FlatList`. */
  threshold: number;
  /** False keeps the observer off (no handler, no content yet). */
  enabled: boolean;
  /**
   * Changing it re-arms the trigger and re-checks at once — the rows' count for
   * a list, the content height for a page. A page that arrives and still leaves
   * the end in range therefore asks for the next one, as `FlatList` does when
   * its content length changes.
   */
  rearmKey: unknown;
}

/**
 * `onEndReached` for content that scrolls the DOCUMENT (web): an end marker
 * observed against the viewport, its bottom margin extended by `threshold`
 * viewports. It fires once per approach; leaving the range re-arms it, and so
 * does `rearmKey` changing. Returns the ref for the end marker.
 *
 * A no-op wherever `IntersectionObserver` does not exist (native, SSR).
 */
export function useDocumentEndReached({
  onEndReached,
  threshold,
  enabled,
  rearmKey,
}: DocumentEndReachedOptions) {
  const [node, setNode] = useState<Element | null>(null);
  const ref = useCallback((value: unknown) => {
    setNode(typeof Element !== 'undefined' && value instanceof Element ? value : null);
  }, []);
  // Latest handler, assigned after commit: a new closure over the page's fetch
  // state must not tear down the observer, which would report again at once.
  const latest = useRef(onEndReached);
  useEffect(() => {
    latest.current = onEndReached;
  }, [onEndReached]);
  const active = enabled && onEndReached != null;
  // biome-ignore lint/correctness/useExhaustiveDependencies: `rearmKey` is the trigger — a fresh observer re-arms and reports the marker's current state.
  useEffect(() => {
    if (!active || !node || typeof IntersectionObserver === 'undefined') return;
    let armed = true;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) return;
        if (!entry.isIntersecting) {
          armed = true;
          return;
        }
        if (!armed) return;
        armed = false;
        latest.current?.();
      },
      { rootMargin: `0px 0px ${Math.max(0, threshold) * 100}% 0px` },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [active, node, threshold, rearmKey]);
  return ref;
}
