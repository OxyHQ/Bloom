import { useEffect, useRef, useState } from 'react';
import { Easing } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

/** Tailwind `ease-out`, `cubic-bezier(0, 0, 0.2, 1)`. */
export const TAILWIND_EASE_OUT = Easing.bezier(0, 0, 0.2, 1);

/**
 * A CSS transition for numbers that are not CSS — SVG `opacity`,
 * `stroke-opacity` and colour-mix amounts, which react-native-svg cannot
 * transition on either platform. Every change of `targets` eases from what is
 * on screen now to the new values over `durationMs` (matching a CSS
 * `transition-[stroke-opacity] duration-200 ease-out`); a change mid-flight
 * restarts from the in-between values, as a CSS transition does. The first
 * render, a change of length and reduced motion all snap.
 */
export function useEasedValues(
  targets: readonly number[],
  durationMs: number,
  easing: (t: number) => number = TAILWIND_EASE_OUT,
): readonly number[] {
  const reducedMotion = useReducedMotion();
  const key = targets.join(',');
  const [shown, setShown] = useState<readonly number[]>(targets);
  const shownRef = useRef<readonly number[]>(targets);

  useEffect(() => {
    const from = shownRef.current;
    const snap = () => {
      shownRef.current = targets;
      setShown(targets);
    };
    if (reducedMotion || typeof requestAnimationFrame !== 'function' || from.length !== targets.length) {
      snap();
      return;
    }
    if (from.every((v, i) => v === targets[i])) {
      if (shownRef.current !== targets) snap();
      return;
    }
    const start = Date.now();
    let raf = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / durationMs);
      const e = easing(t);
      const next = targets.map((to, i) => from[i]! + (to - from[i]!) * e);
      shownRef.current = next;
      setShown(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the serialised targets
  }, [key, reducedMotion, durationMs]);

  if (reducedMotion || shown.length !== targets.length) return targets;
  return shown;
}
