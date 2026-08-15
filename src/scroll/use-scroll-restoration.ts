/**
 * Native variant of the scroll-restoration primitive.
 *
 * React Navigation's native-stack keeps every screen MOUNTED while it is in the
 * stack, so a list's scroll position survives a push/pop for free — this file
 * must not interfere with that, and does not: nothing here runs on focus.
 *
 * What native does not survive is a KEY CHANGE: an in-screen tab or folder swap
 * that re-keys a list, and a screen that genuinely unmounts and remounts. The
 * effect below is therefore keyed on the storage key (plus `enabled`) rather
 * than on focus, which draws exactly that line with no bookkeeping: React
 * re-runs it when the key changes and leaves it alone when a push/pop merely
 * re-focuses the same screen showing the same content.
 *
 * Web bundlers select `./index.web` via the `"browser"` export condition in
 * `package.json`; native bundlers fall through to this file.
 */
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useScrollRestorationContext } from './context';
import { createScroller } from './scrollable.native';
import { deriveScrollKey } from './store';
import type {
  ScrollRestorationBinding,
  ScrollRestorationTarget,
  UseScrollRestorationOptions,
} from './types';

/**
 * Preserve and restore the scroll offset of `target` across content changes,
 * keyed by the content its screen is showing plus an optional `options.key`.
 *
 * Behaviour (native):
 * - Offsets are recorded from the returned `onScroll` binding, which the caller
 *   wires onto the list. There is no other way to observe a list's offset.
 * - When the storage key changes — a re-keyed list, a remount, or `enabled`
 *   turning on — the saved offset is applied, or 0 when the key was never seen.
 * - A push/pop that re-focuses the same screen scrolls nothing. The navigator
 *   already preserved the position, and re-applying it would at best be a
 *   no-op and at worst fight a list that has legitimately moved on.
 */
export function useScrollRestoration(
  target: ScrollRestorationTarget,
  options?: UseScrollRestorationOptions,
): ScrollRestorationBinding {
  const { store, adapter } = useScrollRestorationContext();
  const contentId = adapter.useScreenContentId();
  const enabled = options?.enabled ?? true;
  const scrollKey = deriveScrollKey(contentId, options?.key);

  // The key the live `onScroll` binding is allowed to record against. It is
  // assigned by the effect below only AFTER that effect's own write has landed,
  // and cleared by its cleanup — so the relayout the outgoing content emits
  // while a new key is already rendered is never attributed to the new key.
  const recordingKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || scrollKey === null) return undefined;

    const scroller = createScroller(target);
    let frame: number | null = null;

    // Restore and reset are ONE write: a miss reads 0, and 0 is exactly what a
    // list showing content never seen this session must be sent to rather than
    // left at the offset its predecessor had.
    const apply = (): void => {
      frame = null;
      scroller.setOffset(store.read(scrollKey));
      recordingKeyRef.current = scrollKey;
    };

    // Defer one frame. This effect fires in the same commit that rendered the
    // incoming rows, and a list cannot honour an offset before it has laid them
    // out — the write would be clamped to whatever height it has reached so
    // far, with no second chance (unlike web, native gets no scroll event to
    // re-apply from). One frame is all that is needed because `enabled` has
    // already guaranteed the rows are there; what remains is the layout pass.
    if (typeof requestAnimationFrame === 'function') {
      frame = requestAnimationFrame(apply);
    } else {
      // No frame scheduler (SSR, or a bare Node import of this barrel).
      // Applying immediately is still the correct write; only the wait is lost.
      apply();
    }

    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      recordingKeyRef.current = null;
    };
  }, [store, scrollKey, enabled, target]);

  const onScroll = useCallback<ScrollRestorationBinding['onScroll']>(
    (event) => {
      const key = recordingKeyRef.current;
      if (key === null) return;
      store.save(key, event.nativeEvent.contentOffset.y);
    },
    [store],
  );

  return useMemo(() => ({ onScroll }), [onScroll]);
}
