import type { ScrollableHandle, ScrollRestorationTarget } from './types';

/**
 * A normalized read/write interface over whatever the caller registered, so
 * the hook does not branch on target shape. All methods are safe no-ops when
 * the underlying element is not yet (or no longer) attached.
 */
export interface ResolvedScroller {
  getOffset: () => number;
  setOffset: (offset: number) => void;
  /**
   * The largest offset the container can currently hold — `scrollHeight -
   * clientHeight`, clamped at 0. Answers two questions the save path needs:
   * whether a 0 read is real (`maxOffset > 0`) and whether an offset is sitting
   * exactly at the bottom, which is the signature of a browser clamp.
   *
   * React Navigation's web stack collapses a hidden background screen so its
   * content height drops to the viewport height; while collapsed the container
   * cannot be scrolled and its `scrollTop` is forced to 0. The hook uses this
   * to ignore a spurious 0 read coming from a collapsed container rather than
   * persisting it over a previously-saved good offset.
   *
   * The DOCUMENT collapses the same way, so the `'window'` sentinel answers the
   * same question honestly rather than hardcoding `true`. It used to, on the
   * premise that the navigator never collapses the document — false under a
   * tabbed navigator, where every tab stays MOUNTED and non-focused ones are
   * `display: none` (expo-router's `ui/TabSlot`, and react-native-screens' web
   * `Screen` at `activityState === 0`). Measured in Chrome 150: switching from
   * a tall tab to a short one drops `documentElement.scrollHeight` from 8040 to
   * the 800px viewport, forces `scrollY` to 0 and dispatches two `scroll`
   * events — which the outgoing tab's still-attached listener would otherwise
   * persist as 0 over its real offset, because blur is emitted from an effect
   * that has not run yet.
   */
  getMaxOffset: () => number;
}

function isElement(value: unknown): value is HTMLElement {
  return typeof HTMLElement !== 'undefined' && value instanceof HTMLElement;
}

function hasGetScrollableNode(
  value: unknown,
): value is Required<Pick<ScrollableHandle, 'getScrollableNode'>> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ScrollableHandle).getScrollableNode === 'function'
  );
}

/**
 * Resolve the live DOM element a target currently points at, or `null`.
 *
 * RNW scroll components expose `getScrollableNode()`; plain refs may hold the
 * DOM node directly. We never cache the node because RNW can swap it across
 * renders — we re-resolve on every read/write.
 */
function resolveElement(target: ScrollRestorationTarget): HTMLElement | null {
  if (target === 'window') return null;

  const current = (target as { current: unknown }).current;
  if (current == null) return null;

  if (isElement(current)) return current;

  if (hasGetScrollableNode(current)) {
    const node = current.getScrollableNode();
    if (isElement(node)) return node;
  }

  return null;
}

/**
 * Build a {@link ResolvedScroller} for a target. The window sentinel reads and
 * writes the document scroller; everything else operates on the resolved
 * element's `scrollTop`.
 */
export function createScroller(target: ScrollRestorationTarget): ResolvedScroller {
  if (target === 'window') {
    return {
      getOffset: () => (typeof window === 'undefined' ? 0 : window.scrollY),
      setOffset: (offset) => {
        if (typeof window !== 'undefined') window.scrollTo(0, offset);
      },
      getMaxOffset: () => {
        if (typeof window === 'undefined' || typeof document === 'undefined') {
          return 0;
        }
        return Math.max(
          0,
          document.documentElement.scrollHeight - window.innerHeight,
        );
      },
    };
  }

  return {
    getOffset: () => {
      const element = resolveElement(target);
      return element ? element.scrollTop : 0;
    },
    setOffset: (offset) => {
      const element = resolveElement(target);
      if (element) element.scrollTop = offset;
    },
    getMaxOffset: () => {
      const element = resolveElement(target);
      if (!element) return 0;
      return Math.max(0, element.scrollHeight - element.clientHeight);
    },
  };
}
