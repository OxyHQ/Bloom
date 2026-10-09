import { useState } from 'react';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import type { MeterReveal } from './types';

/** Shared reveal policy. Visibility never replaces the public data value. */
export function useMeterRevealPolicy(fraction: number, reveal?: MeterReveal) {
  const reduced = usePrefersReducedMotion();
  const [entered, setEntered] = useState(false);
  if (reveal?.visible && !entered) setEntered(true);
  const visible = !reveal || reduced || reveal.visible || (!!reveal.once && entered);
  const duration = Math.max(0, Number.isFinite(reveal?.duration) ? reveal!.duration! : 300);
  const delay = Math.max(0, Number.isFinite(reveal?.delay) ? reveal!.delay! : 0);
  const easing = reveal?.easing ?? [.25, .1, .25, 1] as const;
  if (easing.some((value) => !Number.isFinite(value)) || easing[0] < 0 || easing[0] > 1 || easing[2] < 0 || easing[2] > 1) {
    throw new Error('Bloom Meter reveal easing requires finite cubic-bezier coordinates with x values in 0..1.');
  }
  return { fraction: visible ? fraction : 0, animate: !!reveal && visible && !reduced && duration > 0, duration, delay, easing };
}

