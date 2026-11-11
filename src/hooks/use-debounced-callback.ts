import { useCallback, useEffect, useRef } from 'react';

export interface DebouncedCallback<Args extends unknown[]> {
  /** Schedules the call; a newer `run` inside `delay` replaces the pending one. */
  run: (...args: Args) => void;
  /** Runs the pending call now (nothing is pending: nothing happens). */
  flush: () => void;
  /** Drops the pending call. */
  cancel: () => void;
}

export interface DebouncedCallbackOptions {
  /**
   * What an unmount does with a call still waiting: `false` (default) drops it,
   * `true` runs it — an autosave must not lose the last keystrokes when the
   * editor closes inside the delay.
   */
  flushOnUnmount?: boolean;
}

/**
 * A debounced `callback`: the latest `run` within `delay` ms wins, and only it
 * fires. Where {@link useDebouncedValue} debounces a VALUE a render reads, this
 * debounces an ACTION — an autosave, a search request, a resize persist — and
 * adds `flush` (commit what is pending right now, on blur or submit) and
 * `cancel`. `run`, `flush` and `cancel` keep one identity for the component's
 * life (`run` only changes with `delay`), and the call always uses the LATEST
 * `callback`, so a closure over fresh state is never stale.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number,
  options: DebouncedCallbackOptions = {},
): DebouncedCallback<Args> {
  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<Args | null>(null);
  const flushOnUnmountRef = useRef(options.flushOnUnmount === true);
  callbackRef.current = callback;
  flushOnUnmountRef.current = options.flushOnUnmount === true;

  const cancel = useCallback(() => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = null;
    pendingRef.current = null;
  }, []);

  const flush = useCallback(() => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = null;
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (pending) callbackRef.current(...pending);
  }, []);

  const run = useCallback(
    (...args: Args) => {
      pendingRef.current = args;
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, delay);
    },
    [delay, flush],
  );

  useEffect(
    () => () => {
      if (flushOnUnmountRef.current) flush();
      else cancel();
    },
    [flush, cancel],
  );

  return { run, flush, cancel };
}
