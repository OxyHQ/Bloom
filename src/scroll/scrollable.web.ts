import type { ScrollableHandle, ScrollRestorationTarget } from './types';

/**
 * A normalized read/write interface over whatever the caller registered, so
 * the hook does not branch on target shape. Both methods are no-ops when the
 * underlying element is not yet (or no longer) attached.
 */
export interface ResolvedScroller {
  getOffset: () => number;
  setOffset: (offset: number) => void;
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
  };
}
