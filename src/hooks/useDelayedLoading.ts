import { useEffect, useState } from 'react';

/**
 * Returns true for the specified delay, then false.
 * Useful for preventing loading spinner flash on fast loads.
 */
export function useDelayedLoading(delay: number, initialState: boolean = true) {
  const [isLoading, setIsLoading] = useState(initialState);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (isLoading) timeout = setTimeout(() => setIsLoading(false), delay);

    return () => timeout && clearTimeout(timeout);
  }, [isLoading, delay]);

  return isLoading;
}
