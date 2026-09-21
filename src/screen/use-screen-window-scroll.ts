import { useEffect } from 'react';
import { useReducedMotion, withSpring } from 'react-native-reanimated';
import { useScreen, type ScreenContextValue } from './context';
import { useScreenScroll } from './use-screen-scroll';
import type { ScreenScrollOptions } from './types';

/** Window-scrolling counterpart for document virtualizers; never creates a nested scroller. */
export function useScreenWindowScroll(options: ScreenScrollOptions = {}) {
  const binding = useScreenScroll(options);
  const screen = useScreen();
  useScreenWindowBinding(screen, options, binding.scrollerId);
  return binding;
}

/** Internal default listener yields to a registered list/virtualizer. */
export function useScreenWindowBinding(screen: ScreenContextValue, options: ScreenScrollOptions = {}, owner: string | null = null) {
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (!screen.active || options.active === false || typeof window === 'undefined') return;
    let previous = window.scrollY;
    const update = () => {
      const y = Math.max(0, window.scrollY);
      const delta = y - previous;
      previous = y;
      if (screen.activeScrollerId.value !== owner) return;
      screen.scrollY.value = y;
      if (options.restoration?.restorePending) return;
      const target = y < 24 ? 0 : delta > 3 ? 1 : delta < -3 ? 0 : screen.collapseTarget.value;
      if (target !== screen.collapseTarget.value) {
        screen.collapseTarget.value = target;
        screen.collapseProgress.value = reducedMotion ? target : withSpring(target, { duration: 380, dampingRatio: 1 });
      }
    };
    if (screen.activeScrollerId.value === owner) screen.scrollY.value = previous;
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [screen, options.active, options.restoration?.restorePending, reducedMotion, owner]);
}
