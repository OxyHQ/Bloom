import { useLayoutEffect, useRef, useState } from 'react';
import { useMeterRevealPolicy } from './use-meter-reveal-policy';
import type { MeterReveal } from './types';

/** Stage an initial empty paint before the CSS transition, including visible-on-mount. */
export function useMeterReveal(fraction: number, reveal?: MeterReveal) {
  const policy = useMeterRevealPolicy(fraction, reveal);
  const [painted, setPainted] = useState(reveal && policy.animate ? 0 : policy.fraction);
  const staged = useRef(false);
  useLayoutEffect(() => {
    if (!policy.animate || staged.current) {
      setPainted(policy.fraction);
      return;
    }
    let next = 0;
    const frame = requestAnimationFrame(() => {
      next = requestAnimationFrame(() => {
        staged.current = true;
        setPainted(policy.fraction);
      });
    });
    return () => {
      cancelAnimationFrame(frame);
      if (next) cancelAnimationFrame(next);
    };
  }, [policy.fraction, policy.animate]);
  return {
    fraction: policy.animate ? painted : policy.fraction,
    duration: policy.animate ? policy.duration : 0,
    delay: policy.animate ? policy.delay : 0,
    easing: `cubic-bezier(${policy.easing.join(',')})`,
  };
}
