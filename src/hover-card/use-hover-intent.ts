import { useCallback, useEffect, useMemo, useRef } from 'react';

/**
 * Delayed open/close for a hover surface. One timer, so a pending open and a
 * pending close can never both fire: every call replaces what was scheduled.
 *
 * `setOpen` is only called when the value would CHANGE — a controlled
 * `onOpenChange` is not told "false" every time the pointer brushes past a
 * trigger whose card never opened.
 */
export function useHoverIntent(
  open: boolean,
  setOpen: (open: boolean) => void,
  openDelay: number,
  closeDelay: number,
) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ open, setOpen });
  latest.current = { open, setOpen };

  const hold = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const schedule = useCallback(
    (next: boolean, delay: number) => {
      hold();
      const apply = () => {
        timer.current = null;
        if (latest.current.open !== next) latest.current.setOpen(next);
      };
      if (delay <= 0) apply();
      else timer.current = setTimeout(apply, delay);
    },
    [hold],
  );

  const show = useCallback(() => schedule(true, openDelay), [schedule, openDelay]);
  const hide = useCallback(() => schedule(false, closeDelay), [schedule, closeDelay]);

  useEffect(() => hold, [hold]);

  return useMemo(() => ({ show, hide, hold }), [show, hide, hold]);
}
