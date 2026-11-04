import { useEffect, useState } from 'react';

/**
 * `visible`, held back until it has stayed true for `delay` ms: a pointer that only passes over a
 * trigger opens nothing. Closing is immediate, and a delay of 0 is `visible` itself.
 */
export function useDelayedVisibility(visible: boolean, delay: number): boolean {
  const [elapsed, setElapsed] = useState(false);
  if (!visible && elapsed) setElapsed(false);
  useEffect(() => {
    if (!visible || delay <= 0) return;
    const timer = setTimeout(() => setElapsed(true), delay);
    return () => clearTimeout(timer);
  }, [visible, delay]);
  return visible && (delay <= 0 || elapsed);
}
