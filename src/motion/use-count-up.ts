import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/** The count's default duration: 320ms, ease-out cubic. */
export const COUNT_UP_MS = 320;

/**
 * Counts the displayed number from its current value to `target` on an
 * ease-out curve, stepping in whole units — the chart cards' headline runs
 * through it whenever the total or the hovered category changes. A change
 * mid-count starts from the number on screen. Under reduced motion it snaps.
 */
export function useCountUp(target: number, duration = COUNT_UP_MS): number {
  const reducedMotion = usePrefersReducedMotion();
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    if (reducedMotion || typeof requestAnimationFrame !== 'function') {
      fromRef.current = target;
      setDisplay(target);
      return;
    }
    const start = Date.now();
    let raf = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const value = Math.round(from + (target - from) * easeOutCubic(t));
      fromRef.current = value;
      setDisplay(value);
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reducedMotion]);

  return reducedMotion ? target : display;
}

/**
 * {@link useCountUp} that keeps up to two decimals by counting in scaled
 * units, so fractional data such as `48.8` keeps its precision through the
 * whole-unit steps.
 */
export function useCountUpPrecise(value: number, duration = COUNT_UP_MS): number {
  const places = Number.isInteger(value)
    ? 0
    : Math.abs(value * 10 - Math.round(value * 10)) < 1e-6
      ? 1
      : 2;
  const scale = 10 ** places;
  return useCountUp(Math.round(value * scale), duration) / scale;
}
