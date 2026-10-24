import { animateMotion } from '../motion/recipes';
import { useEffect } from 'react';
import { useReducedMotion } from 'react-native-reanimated';
import { useScreen, type ScreenContextValue } from './context';
import { useRegisterScreenScroller, type ScreenScroller } from './reselect';
import { useScreenScroll } from './use-screen-scroll';
import type { ScreenScrollOptions } from './types';

const DOCUMENT_SCROLLER: ScreenScroller = {
  offset: () => window.scrollY,
  scrollToOffset: (offset) => window.scrollTo({ top: offset, behavior: 'smooth' }),
};

/** Window-scrolling counterpart for document virtualizers; never creates a nested scroller. */
export function useScreenWindowScroll(options: ScreenScrollOptions = {}) {
  const binding = useScreenScroll(options);
  const screen = useScreen();
  useScreenWindowBinding(screen, options, binding.scrollerId);
  return binding;
}

/** Internal default listener yields to a registered list/virtualizer. */
export function useScreenWindowBinding(
  screen: ScreenContextValue,
  options: ScreenScrollOptions = {},
  owner: string | null = null,
) {
  const reducedMotion = useReducedMotion();
  const bound = screen.active && options.active !== false && typeof window !== 'undefined';
  // The document answers a reselect when no list inside the page does.
  useRegisterScreenScroller(bound ? DOCUMENT_SCROLLER : null, bound, true);
  useEffect(() => {
    if (!bound) return;
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
        animateMotion(screen.collapseProgress, target, 'expand', reducedMotion);
      }
    };
    if (screen.activeScrollerId.value === owner) screen.scrollY.value = previous;
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [bound, screen, options.restoration?.restorePending, reducedMotion, owner]);
}
