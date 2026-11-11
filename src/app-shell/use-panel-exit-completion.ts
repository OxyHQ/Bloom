import { useCallback, useLayoutEffect, useRef, type RefObject } from 'react';
import { panelExitTransitions } from './panel-transitions';

/** Observe an actual exit only; never retain application content or run a clock. */
export function usePanelExitCompletion({
  present,
  floating,
  css,
  reducedMotion,
  owner,
  onExitComplete,
}: {
  present: boolean;
  floating: boolean;
  css: boolean;
  reducedMotion: boolean;
  owner: RefObject<unknown>;
  onExitComplete?: () => void;
}) {
  const callback = useRef(onExitComplete);
  callback.current = onExitComplete;
  const previous = useRef({ present, floating });
  const serial = useRef(0);
  const pending = useRef<{ generation: number; complete: () => void; floating: boolean } | null>(
    null,
  );
  const sheetClosed = useRef(false);
  if (present) sheetClosed.current = false;
  const finish = useCallback((generation: number) => {
    if (pending.current?.generation !== generation) return;
    const complete = pending.current.complete;
    pending.current = null;
    complete();
  }, []);
  useLayoutEffect(() => {
    if (present) {
      previous.current = { present, floating };
      pending.current = null;
      serial.current += 1;
      return;
    }
    const wasPresent = previous.current.present;
    const wasFloating = previous.current.floating;
    previous.current = { present, floating };
    if (!callback.current || (!wasPresent && pending.current === null)) return;
    if (!pending.current)
      pending.current = {
        generation: ++serial.current,
        complete: callback.current,
        floating: wasFloating,
      };
    const { generation } = pending.current;
    // A breakpoint removed the outgoing presentation. The replacement was
    // never opened and therefore has no exit animation to report.
    if (pending.current.floating !== floating) {
      finish(generation);
      return;
    }
    if (floating) {
      // A gesture can finish the Dialog before its onOpenChange state commits.
      if (sheetClosed.current) finish(generation);
      return;
    }
    // Native reports the end of its existing worklet animation.
    if (!css) return;
    let disposed = false;
    const settled = () => {
      if (disposed || pending.current?.generation !== generation) return;
      const node = owner.current as HTMLElement | null;
      const transitions = reducedMotion || !node ? [] : panelExitTransitions(node);
      if (!transitions.length) finish(generation);
      else
        void Promise.allSettled(transitions.map((animation) => animation.finished)).then(settled);
    };
    settled();
    return () => {
      disposed = true;
    };
  }, [present, floating, css, reducedMotion, owner, finish]);
  useLayoutEffect(
    () => () => {
      pending.current = null;
    },
    [],
  );
  const captureNativeCompletion = useCallback(() => {
    const generation = pending.current?.generation;
    return generation === undefined ? undefined : () => finish(generation);
  }, [finish]);
  const completeFloating = useCallback(() => {
    sheetClosed.current = true;
    if (pending.current !== null) finish(pending.current.generation);
  }, [finish]);
  return { captureNativeCompletion, completeFloating };
}
