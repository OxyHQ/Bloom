import { useEffect } from 'react';
import { useReducedMotion, withSpring } from 'react-native-reanimated';
import { useScreen } from './context';
import { useScreenScroll } from './use-screen-scroll';
import type { ScreenScrollOptions } from './types';

/** Window-scrolling counterpart for document virtualizers; never creates a nested scroller. */
export function useScreenWindowScroll(options: ScreenScrollOptions = {}) {
  const binding = useScreenScroll(options);
  const screen = useScreen();
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (!screen.active || options.active === false || typeof window === 'undefined') return;
    const owner = screen.activeScrollerId.value;
    let previous = window.scrollY;
    const update = () => {
      if (screen.activeScrollerId.value !== owner) return;
      const y = Math.max(0, window.scrollY);
      const delta = y - previous;
      previous = y;
      screen.scrollY.value = y;
      if (options.restoration?.restorePending) return;
      const target = y < 24 ? 0 : delta > 3 ? 1 : delta < -3 ? 0 : screen.collapseTarget.value;
      if (target !== screen.collapseTarget.value) {
        screen.collapseTarget.value = target;
        screen.collapseProgress.value = reducedMotion ? target : withSpring(target, { duration: 380, dampingRatio: 1 });
      }
    };
    screen.scrollY.value = previous;
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [screen, options.active, options.restoration?.restorePending, reducedMotion]);
  return binding;
}
