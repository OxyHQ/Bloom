/**
 * Ported from expo-glass-tabs v0.1.1 — src/progressive-blur.tsx
 * (MIT © 2026 David Mokos). See the top-level NOTICE.
 *
 * Shared prop contract for both forks. It lives in its own module so the web
 * fork can declare it without importing the native entry (`./index` resolves to
 * `index.web.tsx` itself on a web-platform Metro build), and so `TabBarBase`
 * can type its injected `Blur` component without importing either fork.
 */
import type { ViewProps } from 'react-native';

export type ProgressiveBlurProps = ViewProps & {
  /**
   * Blur strength at the anchored edge. Follows `expo-blur`'s 0–100 scale and
   * is applied PER LAYER on native (see the native fork); the web fork maps it
   * onto the single CSS blur radius that approximates the same stack.
   */
  intensity?: number;
  /** Which edge the blur is anchored to (strongest there, fading away). */
  direction?: 'top' | 'bottom';
};
