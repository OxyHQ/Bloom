import { useEffect, useState } from 'react';

/**
 * The value as it was once it stopped changing for `delay` ms — what a search
 * keys a request on, so typing "Gran Vía" asks once instead of eight times.
 * Unlike `useThrottledValue`, which updates DURING a burst, this waits for the
 * burst to end.
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
