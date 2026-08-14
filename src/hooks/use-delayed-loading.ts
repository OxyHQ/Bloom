import { useEffect, useState } from 'react';

/**
 * Returns true for the specified delay, then false.
 * Useful for preventing loading spinner flash on fast loads.
 */
export function useDelayedLoading(delay: number, initialState: boolean = true) {
  const [isLoading, setIsLoading] = useState(initialState);

  useEffect(() => {
    if (!isLoading) return;

    const timeout = setTimeout(() => setIsLoading(false), delay);

    return () => {
      clearTimeout(timeout);
    };
  }, [isLoading, delay]);

  return isLoading;
}
