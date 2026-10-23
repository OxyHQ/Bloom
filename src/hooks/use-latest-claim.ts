import { useCallback, useRef, useState } from 'react';

/** Make a claim; the returned function releases it. */
export type Claim<T> = (value: T) => () => void;

/**
 * The value of the most recent live claim, and the function that makes one. A
 * screen claims while it is active and releases on cleanup; the latest remaining
 * claim wins, so a screen underneath is restored when the one above it leaves.
 * `undefined` while nothing is claimed.
 *
 * Shared by the colour preset a screen gives its shell (`app-shell`) and the
 * status bar content a dark screen asks for (`theme/SystemStatusBar`).
 */
export function useLatestClaim<T>(): [value: T | undefined, claim: Claim<T>] {
  const [value, setValue] = useState<T>();
  const claims = useRef(new Map<symbol, T>());
  const claim = useCallback<Claim<T>>((next) => {
    const key = Symbol('claim');
    claims.current.set(key, next);
    setValue(next);
    return () => {
      claims.current.delete(key);
      const remaining = [...claims.current.values()];
      setValue(remaining[remaining.length - 1]);
    };
  }, []);
  return [value, claim];
}
