import { useCallback, useEffect, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import { clamp01, IS_WEB } from './shared';
import type { MediaHeaderScrollOptions } from './types';

/** The bar's progress for a scroll offset: 0 before `start`, 1 from `end`. */
export function mediaHeaderScrollProgress(offset: number, start: number, end: number): number {
  if (end <= start) return offset >= start ? 1 : 0;
  return clamp01((offset - start) / (end - start));
}

/**
 * Scroll progress for `StickyMediaTopBar`.
 *
 * ```tsx
 * const { progress, onScroll } = useMediaHeaderScroll({ start: 240 });
 * <ScrollView onScroll={onScroll} scrollEventThrottle={16}>…</ScrollView>
 * <StickyMediaTopBar progress={progress} … />
 * ```
 *
 * On web a page that scrolls the DOCUMENT passes `window: true` and wires no
 * handler — the hook listens to `window` scroll itself. `start` is normally
 * the header's height minus the bar's.
 */
export function useMediaHeaderScroll({
  start = 200,
  end,
  window: followWindow = false,
}: MediaHeaderScrollOptions = {}): {
  progress: number;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
} {
  const stop = end ?? start + 80;
  const [progress, setProgress] = useState(0);

  const update = useCallback(
    (offset: number) => {
      const next = mediaHeaderScrollProgress(offset, start, stop);
      setProgress((prev) => (Math.abs(prev - next) < 0.01 && next !== 0 && next !== 1 ? prev : next));
    },
    [start, stop],
  );

  useEffect(() => {
    if (!followWindow || !IS_WEB || typeof globalThis.window === 'undefined') return undefined;
    const win = globalThis.window;
    const onWindowScroll = () => update(win.scrollY);
    onWindowScroll();
    win.addEventListener('scroll', onWindowScroll, { passive: true });
    return () => win.removeEventListener('scroll', onWindowScroll);
  }, [followWindow, update]);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => update(event.nativeEvent.contentOffset.y),
    [update],
  );

  return { progress, onScroll };
}
