/**
 * Coalesce a MEASUREMENT to at most one per animation frame.
 *
 * Every anchored surface listens to `scroll` in the CAPTURE phase, because a
 * scroll inside any ancestor moves the trigger too. That is the right listener
 * and the wrong cadence: a scroll gesture dispatches a stream of events, a
 * nested scroller dispatches one per container, and each of them used to force a
 * synchronous layout read (`getBoundingClientRect`, `offsetWidth`) and a state
 * update. Nothing can be painted between two events in the same frame, so every
 * read but the last was work for a frame that never existed.
 *
 * The scheduler is TRAILING and it is deliberate: the run happens on the frame
 * boundary, which is the last moment before the browser paints and therefore the
 * most recent position the surface can be given. A leading call would place the
 * panel against the box the page had BEFORE the frame's scrolling was applied.
 *
 * The returned callback is stable for the component's whole life, which is the
 * second half of the cost: a listener effect that depends on the measurement
 * closure is torn down and re-registered every time the thing it measures moves.
 * `run` is read through a ref, so the newest closure is always the one that runs
 * without the identity of the scheduler ever changing.
 *
 * With no frame clock at all — SSR, and jest's default `node` environment — the
 * call runs SYNCHRONOUSLY. Degrading to the previous behaviour is right where
 * degrading to nothing would leave a surface that never follows its anchor.
 *
 * A trailing scheduler outlives the event that armed it, so it comes with a
 * CANCEL. A surface that closes in the gap between a scroll and that scroll's
 * frame would otherwise be measured — and re-published — after it was told to
 * clear itself. Callers drop the frame from the COMMIT phase (the layout effect
 * that clears the box), not from a passive cleanup: animation frames run before
 * the paint that passive effects are flushed after, so a cancel scheduled after
 * the paint can be one frame too late. Unmount is handled here. Both functions
 * are stable for the component's whole life, so an effect can depend on the pair
 * without being re-registered.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';

export function useFrameThrottle(run: () => void): [schedule: () => void, cancel: () => void] {
  const latest = useRef(run);
  const frame = useRef<number | null>(null);

  // A layout effect, not a render-body assignment: the ref is committed state,
  // and it has to be updated in the same phase the measuring layout effects run
  // in so a listener can never see a closure from a render that was thrown away.
  useLayoutEffect(() => {
    latest.current = run;
  });

  const cancel = useCallback(() => {
    if (frame.current !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(frame.current);
    }
    frame.current = null;
  }, []);

  useEffect(() => cancel, [cancel]);

  const schedule = useCallback(() => {
    if (typeof requestAnimationFrame !== 'function') {
      latest.current();
      return;
    }
    // Already scheduled: this frame's run will read the current state anyway, so
    // a second one measures the same box twice.
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      // Cleared BEFORE the run, so a measurement that schedules another one (a
      // scroll still under way) is not swallowed.
      frame.current = null;
      latest.current();
    });
  }, []);

  return useMemo(() => [schedule, cancel], [schedule, cancel]);
}
