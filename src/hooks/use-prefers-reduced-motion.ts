import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

function initialPreference(): boolean {
  if (Platform.OS === 'web') {
    return typeof window === 'undefined' || !window.matchMedia
      ? true
      : window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  // Native exposes an async query. Keep motion still until the OS answers.
  return true;
}

/** Observe the OS preference without loading an animation runtime. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(initialPreference);
  useEffect(() => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined' || !window.matchMedia) return;
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      const update = () => setReduced(media.matches);
      update();
      media.addEventListener('change', update);
      return () => media.removeEventListener('change', update);
    }
    let active = true;
    let changed = false;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      changed = true;
      if (active) setReduced(value);
    });
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active && !changed) setReduced(value);
    }).catch(() => { /* Keep the conservative preference if the OS query fails. */ });
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return reduced;
}
