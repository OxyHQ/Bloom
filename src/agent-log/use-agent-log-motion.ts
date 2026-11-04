import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';

/** Reads the system reduced-motion setting once for a whole log. */
export function useAgentLogMotion(): boolean {
  return usePrefersReducedMotion() ?? false;
}
