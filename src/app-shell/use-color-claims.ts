import { useCallback, useRef, useState } from 'react';
import type { AppColorName } from '../theme/color-presets';

export type ColorClaim = (preset: AppColorName) => () => void;

/**
 * The colour preset of the most recent live claim, and the function that makes
 * one. A screen claims its preset while it is active and releases it on cleanup;
 * the latest remaining claim wins, so a screen underneath is restored when the
 * one above it leaves.
 */
export function useColorClaims(): [preset: AppColorName | undefined, claim: ColorClaim] {
  const [preset, setPreset] = useState<AppColorName>();
  const claims = useRef(new Map<symbol, AppColorName>());
  const claim = useCallback<ColorClaim>((next) => {
    const key = Symbol('color-claim');
    claims.current.set(key, next);
    setPreset(next);
    return () => {
      claims.current.delete(key);
      const remaining = [...claims.current.values()];
      setPreset(remaining[remaining.length - 1]);
    };
  }, []);
  return [preset, claim];
}
