import { Platform } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import type { WebCssStyle } from '../../styles/web-view-style';

/**
 * A CSS transition for a react-native-web node, or `null` on native (RN has no
 * such style key) and under reduced motion. The chart chrome eases its
 * hover feedback — dimming, swatch colour, pill background — with Tailwind's
 * `ease-out`, `cubic-bezier(0, 0, 0.2, 1)`.
 */
export function useWebTransition(property: string, durationMs: number): WebCssStyle | null {
  const reducedMotion = useReducedMotion();
  if (Platform.OS !== 'web' || reducedMotion) return null;
  return {
    transitionProperty: property,
    transitionDuration: `${durationMs}ms`,
    transitionTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
  };
}
