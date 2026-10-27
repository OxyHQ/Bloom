import { useCallback, useEffect, useRef, useState } from 'react';
import { autoHideBarMode, type AutoHideBarMode } from './auto-hide-bar-motion';

export interface AutoHideBarModeOptions {
  collapsed: boolean;
  peek: boolean;
  peekDelay: number;
  unpeekDelay: number;
  onReveal?: () => void;
}

export interface AutoHideBarModeControls {
  mode: AutoHideBarMode;
  /** The pointer reached the collapsed strip: peek after `peekDelay`. */
  stripHoverIn: () => void;
  stripHoverOut: () => void;
  /** The pointer is on the (peeked) bar: it stays. */
  barHoverIn: () => void;
  /** The pointer left the peeked bar: collapse again after `unpeekDelay`. */
  barHoverOut: () => void;
  /** The strip was pressed: drop any peek and ask the owner to show the bar. */
  reveal: () => void;
}

/**
 * The bar's own state on top of the owner's `collapsed`: the owner says
 * whether the bar is wanted; hovering only ever peeks it, and a press asks the
 * owner to bring it back (`onReveal`). One pending timer at a time.
 */
export function useAutoHideBarMode({
  collapsed,
  peek,
  peekDelay,
  unpeekDelay,
  onReveal,
}: AutoHideBarModeOptions): AutoHideBarModeControls {
  const [peeking, setPeeking] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const live = useRef({ collapsed, peeking, peek, peekDelay, unpeekDelay, onReveal });
  live.current = { collapsed, peeking, peek, peekDelay, unpeekDelay, onReveal };

  const cancel = useCallback(() => {
    if (timer.current !== undefined) clearTimeout(timer.current);
    timer.current = undefined;
  }, []);
  const later = useCallback(
    (next: boolean, delay: number) => {
      cancel();
      if (delay <= 0) {
        setPeeking(next);
        return;
      }
      timer.current = setTimeout(() => {
        timer.current = undefined;
        setPeeking(next);
      }, delay);
    },
    [cancel],
  );

  if (!collapsed && peeking) setPeeking(false);
  useEffect(() => {
    if (!collapsed || !peek) cancel();
    if (!peek) setPeeking(false);
  }, [collapsed, peek, cancel]);
  useEffect(() => cancel, [cancel]);

  const stripHoverIn = useCallback(() => {
    const now = live.current;
    if (now.collapsed && now.peek && !now.peeking) later(true, now.peekDelay);
  }, [later]);
  const stripHoverOut = useCallback(() => {
    if (!live.current.peeking) cancel();
  }, [cancel]);
  const barHoverIn = useCallback(() => {
    if (live.current.peeking) cancel();
  }, [cancel]);
  const barHoverOut = useCallback(() => {
    const now = live.current;
    if (now.peeking) later(false, now.unpeekDelay);
  }, [later]);
  const reveal = useCallback(() => {
    cancel();
    setPeeking(false);
    live.current.onReveal?.();
  }, [cancel]);

  return {
    mode: autoHideBarMode(collapsed, peek && peeking),
    stripHoverIn,
    stripHoverOut,
    barHoverIn,
    barHoverOut,
    reveal,
  };
}
