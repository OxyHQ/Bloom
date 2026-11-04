import type { ThemeColors } from '../types';

/**
 * Native: no prepaint, so the theme's colours are the paint. No context read and
 * no hook; `use-paint-colors.ts` is the web side.
 */
export function usePaintColors(colors: ThemeColors | undefined): ThemeColors | undefined {
  return colors;
}
