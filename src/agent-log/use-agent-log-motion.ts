import { useReducedMotion } from 'react-native-reanimated';

/** Reads the system reduced-motion setting once for a whole log. */
export function useAgentLogMotion(): boolean {
  return useReducedMotion() ?? false;
}
