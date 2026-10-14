import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';
import { resolveSurfaceTransition } from '../motion/surface-transition';
import type { SurfaceTransition } from '../motion/types';
import { animation } from '../styles/tokens';

export const DEFAULT_COLLAPSIBLE_TRANSITION: SurfaceTransition = {
  duration: 300,
  easing: [0.42, 0, 0.58, 1],
};

/**
 * `open`, held shut for the first commit when the content should `appear`: it then opens on the
 * next frame through the same motion as any other opening. Without `appear` it is `open` itself.
 */
export function useAppearingOpen(open: boolean, appear: boolean) {
  const [armed, setArmed] = useState(!appear);
  useEffect(() => {
    if (appear) setArmed(true);
  }, [appear]);
  return open && armed;
}

/** Shared measured-reveal motion; Accordion retains its existing springs. */
export function useCollapsibleMotion(
  open: boolean,
  transition: SurfaceTransition | 'spring',
  kind: 'trigger' | 'content' = 'content',
  useNativeDriver = false,
) {
  const reduced = usePrefersReducedMotion();
  const progress = useRef(new Animated.Value(open ? 1 : 0)).current;
  const [hidden, setHidden] = useState(!open);
  if (open && hidden) setHidden(false);
  // Open and at rest: the frame stops clipping and measuring, so content that grows or overflows
  // (a shadow, a ring, text still streaming in) is never cut.
  const [settled, setSettled] = useState(open);
  const resolved = resolveSurfaceTransition(transition === 'spring' ? undefined : transition);
  const duration = transition === 'spring' ? undefined : resolved.duration;
  const [x1, y1, x2, y2] = resolved.easing;
  const easing = useMemo(() => Easing.bezier(x1, y1, x2, y2), [x1, y1, x2, y2]);
  useLayoutEffect(() => {
    let cancelled = false;
    progress.stopAnimation();
    const toValue = open ? 1 : 0;
    setSettled(false);
    if (reduced || duration === 0) {
      progress.setValue(toValue);
      setHidden(!open);
      setSettled(open);
      return;
    }
    const motion =
      duration === undefined
        ? Animated.spring(progress, {
            toValue,
            useNativeDriver,
            ...animation.spring[kind === 'trigger' ? 'snappy' : 'gentle'],
          })
        : Animated.timing(progress, {
            toValue,
            useNativeDriver,
            duration,
            easing,
          });
    motion.start((result) => {
      if (!cancelled && result?.finished !== false) {
        setHidden(!open);
        setSettled(open);
      }
    });
    return () => {
      cancelled = true;
      motion.stop();
    };
  }, [open, progress, reduced, duration, easing, kind, useNativeDriver]);
  return { progress, hidden, settled };
}
