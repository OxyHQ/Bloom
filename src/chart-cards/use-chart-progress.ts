import { useEffect, useRef, useState } from 'react';
import { Easing } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

/** `animationDuration={450}` on every dashboard series. */
export const SERIES_ANIMATION_MS = 450;

/** recharts' default `animationEasing`, CSS `ease`. */
const EASE = Easing.bezier(0.25, 0.1, 0.25, 1);

/**
 * recharts' series animation clock. Returns `progress` (0 → 1 over 450ms,
 * CSS `ease`) and the values the series animates FROM:
 *
 * - on mount there is nothing to morph from, so `from` is `null` and the
 *   series REVEALS (lines and areas left to right, bars growing from the base);
 * - when the data changes, `from` holds the previous values and every point
 *   morphs to its new position, as recharts does with `prevPoints`.
 *
 * Keyed by the serialised values, so a re-render with equal data — every hover
 * — does not replay it. Under reduced motion the series is drawn in place.
 */
export function useChartProgress(values: readonly number[]): {
  progress: number;
  from: readonly number[] | null;
} {
  const reducedMotion = useReducedMotion();
  const key = values.join(',');
  const [progress, setProgress] = useState(reducedMotion ? 1 : 0);
  const shownRef = useRef<readonly number[] | null>(null);
  const [from, setFrom] = useState<readonly number[] | null>(null);

  useEffect(() => {
    const previous = shownRef.current;
    shownRef.current = values;
    if (reducedMotion || typeof requestAnimationFrame !== 'function') {
      setFrom(null);
      setProgress(1);
      return;
    }
    const morphFrom = previous && previous.length === values.length ? previous : null;
    setFrom(morphFrom);
    setProgress(0);
    const start = Date.now();
    let raf = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / SERIES_ANIMATION_MS);
      setProgress(EASE(t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the serialised values
  }, [key, reducedMotion]);

  return reducedMotion ? { progress: 1, from: null } : { progress, from };
}

/** `from → to` at `t`. */
export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}
