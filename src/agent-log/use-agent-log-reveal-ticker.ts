import { useEffect, useRef, useState } from 'react';

import type { AgentLogRevealTickerOptions } from './types';

/**
 * Paces a log, one unit per tick, and fires `onComplete` once the last one
 * lands; returns how many units are revealed. Timing is one interval rather than
 * a per-unit duration: real agent steps do not take equal time, and pretending
 * otherwise is what makes a progress UI feel fake — so pass `revealed` and drive
 * it from real events as soon as you have them.
 */
export function useAgentLogRevealTicker({
  total,
  run = true,
  stepInterval = 850,
  startDelay = 320,
  revealed: controlled,
  delayFor,
  onComplete,
}: AgentLogRevealTickerOptions): number {
  const isControlled = controlled !== undefined;
  const [ticked, setTicked] = useState(0);
  const revealed = isControlled ? Math.max(0, Math.min(controlled, total)) : ticked;

  useEffect(() => {
    if (isControlled || !run || revealed >= total) return;
    const delay = delayFor ? delayFor(revealed) : revealed === 0 ? startDelay : stepInterval;
    const id = setTimeout(() => setTicked((n) => n + 1), delay);
    return () => clearTimeout(id);
  }, [isControlled, run, revealed, total, startDelay, stepInterval, delayFor]);

  // Guarded by a ref rather than an effect dependency, so an inline
  // `onComplete` closure re-running the effect cannot fire it twice.
  const firedRef = useRef(false);

  useEffect(() => {
    if (total === 0 || revealed < total) {
      firedRef.current = false;
      return;
    }
    if (firedRef.current) return;
    firedRef.current = true;
    onComplete?.();
  }, [revealed, total, onComplete]);

  return revealed;
}
