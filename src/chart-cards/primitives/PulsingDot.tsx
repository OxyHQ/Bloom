import React, { useEffect, useState } from 'react';
import { Circle, G } from 'react-native-svg';
import { useReducedMotion } from 'react-native-reanimated';

/** One halo cycle: `dur="1.4s"`. */
export const PULSE_MS = 1400;
const HALO_FROM_R = 5;
const HALO_TO_R = 13;
const HALO_FROM_OPACITY = 0.35;

export interface PulsingDotProps {
  cx: number;
  cy: number;
  color: string;
  /** The card colour, for the 3px ring. */
  ring: string;
  testID?: string;
}

/**
 * `PulsingDot` (line and combo chart cards): a solid r 5 dot with a
 * 3px card-coloured ring over a halo that grows r 5 → 13 while fading 35% → 0,
 * linearly, every 1.4s, forever. SMIL `<animate>` would be the natural way to
 * drive the halo, but react-native-svg does not implement it, so a frame
 * clock does it here on both platforms — only this component re-renders.
 * Under reduced motion the halo holds its resting state (r 5 at 30%, the
 * element's static attributes).
 */
export function PulsingDot({ cx, cy, color, ring, testID }: PulsingDotProps) {
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<number | null>(null);

  useEffect(() => {
    if (reducedMotion || typeof requestAnimationFrame !== 'function') {
      setPhase(null);
      return;
    }
    const start = Date.now();
    let raf = 0;
    const tick = () => {
      setPhase(((Date.now() - start) % PULSE_MS) / PULSE_MS);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion]);

  const r = phase === null ? HALO_FROM_R : HALO_FROM_R + (HALO_TO_R - HALO_FROM_R) * phase;
  const opacity = phase === null ? 0.3 : HALO_FROM_OPACITY * (1 - phase);

  return (
    <G testID={testID}>
      <Circle cx={cx} cy={cy} r={r} fill={color} opacity={opacity} />
      <Circle cx={cx} cy={cy} r={5} fill={color} stroke={ring} strokeWidth={3} />
    </G>
  );
}
