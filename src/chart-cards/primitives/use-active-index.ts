import { useControllableState } from '../../hooks/use-controllable-state';
import { useCallback, useRef } from 'react';

/**
 * The hovered / pressed category (or slice, stage, node…) of a chart card:
 * controlled when `controlled` is not `undefined` (`null` = none), tracked
 * internally otherwise. `onChange` fires only on an actual change, so a
 * pointer moving within one category does not spam it. An index outside
 * `0..count-1` reads as `null`.
 */
export function useActiveIndex(
  count: number,
  controlled: number | null | undefined,
  onChange: ((index: number | null) => void) | undefined,
): [number | null, (index: number | null) => void] {
  const [value, setValue] = useControllableState<number | null>({
    value: controlled,
    defaultValue: null,
    onChange,
  });
  const lastRef = useRef(value);
  lastRef.current = value;
  const set = useCallback(
    (index: number | null) => {
      if (index === lastRef.current) return;
      lastRef.current = index;
      setValue(index);
    },
    [setValue],
  );
  return [value !== null && value >= 0 && value < count ? value : null, set];
}
