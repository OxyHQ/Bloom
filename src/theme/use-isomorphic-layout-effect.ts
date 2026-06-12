import { useEffect, useLayoutEffect } from 'react';
import { Platform } from 'react-native';

/**
 * `useLayoutEffect` on web (and native — react-native polyfills it) but falls
 * back to `useEffect` during SSR to avoid the React warning. Bloom apps are
 * primarily Expo (no SSR), but Next.js consumers of the web bundle need this.
 */
export const useIsomorphicLayoutEffect =
  Platform.OS === 'web' && typeof document === 'undefined' ? useEffect : useLayoutEffect;
