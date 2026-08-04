import type { ScrollableHandle, ScrollRestorationTarget } from './types';

/**
 * The write half of a scrollable, on native. There is no read half: native
 * offers no way to sample a list's offset from outside it, so offsets arrive
 * through the `onScroll` binding the hook returns instead.
 */
export interface NativeScroller {
  setOffset: (offset: number) => void;
}

function hasScrollToOffset(
  value: unknown,
): value is Required<Pick<ScrollableHandle, 'scrollToOffset'>> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ScrollableHandle).scrollToOffset === 'function'
  );
}

function hasScrollTo(
  value: unknown,
): value is Required<Pick<ScrollableHandle, 'scrollTo'>> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ScrollableHandle).scrollTo === 'function'
  );
}

/**
 * Build a {@link NativeScroller} for a target.
 *
 * `scrollToOffset` (`FlatList`, `FlashList`) is preferred over `scrollTo`
 * (`ScrollView`) because a list exposes both shapes on some versions and only
 * the former accounts for the list's own header. The `'window'` sentinel has no
 * native meaning — there is no document scroller — so it resolves to a no-op
 * rather than an error: a call site shared with web legitimately passes it.
 *
 * The handle is re-resolved on every write; it is never cached, because a ref
 * can be swapped or detached between the schedule and the write.
 */
export function createScroller(
  target: ScrollRestorationTarget,
): NativeScroller {
  if (target === 'window') {
    return { setOffset: () => undefined };
  }

  return {
    setOffset: (offset) => {
      const current = target.current;
      if (current == null) return;
      if (hasScrollToOffset(current)) {
        current.scrollToOffset({ offset, animated: false });
        return;
      }
      if (hasScrollTo(current)) {
        current.scrollTo({ y: offset, animated: false });
      }
    },
  };
}
