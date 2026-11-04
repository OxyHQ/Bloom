import { useKeyboardMetrics } from './use-keyboard-metrics';

/**
 * Whether the native software keyboard is up. Always false on the web, where
 * the browser resizes the visual viewport instead of covering the page.
 */
export function useKeyboardVisible(): boolean {
  return useKeyboardMetrics().visible;
}
