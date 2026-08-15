import { useEffect, useRef, useState } from 'react';

/**
 * Returns a throttled version of the value that only updates at most once per `time` ms.
 */
export function useThrottledValue<T>(value: T, time: number) {
  const [throttledValue, setThrottledValue] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (value === throttledValue) {
      return;
    }

    if (timeoutRef.current !== null) {
      // A timeout is already pending; it will pick up the latest value via closure.
      return;
    }

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      setThrottledValue(value);
    }, time);

    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [value, time, throttledValue]);

  return throttledValue;
}
