import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Returns a throttled version of the value that only updates at most once per `time` ms.
 */
export function useThrottledValue<T>(value: T, time: number) {
  const pendingValueRef = useRef(value);
  const [throttledValue, setThrottledValue] = useState(value);

  useEffect(() => {
    pendingValueRef.current = value;
  }, [value]);

  const handleTick = useCallback(() => {
    setThrottledValue(prev => {
      if (pendingValueRef.current !== prev) {
        return pendingValueRef.current;
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    const id = setInterval(handleTick, time);
    return () => {
      clearInterval(id);
    };
  }, [handleTick, time]);

  return throttledValue;
}
