/**
 * Ported from expo-glass-tabs v0.1.1 — src/progressive-blur.tsx
 * (MIT © 2026 David Mokos). See the top-level NOTICE.
 *
 * The falloff math both forks share, so the native stack and the web mask
 * describe the SAME curve and a bar looks the same on a phone and in a browser.
 */
import { withAlpha } from '../theme/color-utils';

/**
 * Per-layer heights of the native blur stack, as a fraction of the box.
 *
 * iOS has no public variable-blur API, so the native fork stacks many thin
 * `BlurView`s with a tiny per-layer intensity: each layer's edge adds only an
 * imperceptible step, so the falloff reads as continuous. Coverage at a given
 * depth is the number of layers still tall enough to reach it — 10 at the
 * anchored edge, ~5 at the midpoint, 1 at the far edge.
 */
export const LAYER_HEIGHTS = [
  '100%',
  '88%',
  '76%',
  '64%',
  '54%',
  '44%',
  '36%',
  '28%',
  '22%',
  '16%',
] as const;

/**
 * px of CSS blur per unit of `intensity` on web.
 *
 * The web fork replaces the whole stack with ONE `backdrop-filter`, so the
 * radius has to stand in for the accumulated effect of ten layers rather than
 * one: the default `intensity` of 5 lands on a 20px radius, which reads like
 * the native stack at the anchored edge. Stacking ten real blurs in a browser
 * would cost ten composited backdrop passes for the same picture.
 */
export const WEB_BLUR_PER_INTENSITY = 4;

/** CSS gradient direction keyword for a blur anchored at `direction`. */
function towards(direction: 'top' | 'bottom'): 'top' | 'bottom' {
  return direction === 'top' ? 'bottom' : 'top';
}

/**
 * The soft tint layered over the blur. It smooths the tail and keeps overlaid
 * content legible; upstream hardcoded black, which only worked on a dark theme,
 * so it is derived from the theme's page background here instead.
 */
export function buildTailGradient(background: string, direction: 'top' | 'bottom'): string {
  const to = towards(direction);
  return (
    `linear-gradient(to ${to}, ` +
    `${withAlpha(background, 0.7)} 0%, ` +
    `${withAlpha(background, 0.32)} 42%, ` +
    `${withAlpha(background, 0.08)} 68%, ` +
    `${withAlpha(background, 0)} 88%)`
  );
}

/**
 * Alpha ramp the web fork masks its single blur with — the only way to fade a
 * `backdrop-filter`. The stops trace the native stack's layer coverage (full at
 * the anchored edge, ~half at the midpoint) and then close all the way to zero,
 * which the stack cannot do: its tallest layer spans the whole box, leaving a
 * faint blur step at the far edge.
 */
export function buildMaskGradient(direction: 'top' | 'bottom'): string {
  const to = towards(direction);
  return (
    `linear-gradient(to ${to}, ` +
    `rgba(0, 0, 0, 1) 0%, ` +
    `rgba(0, 0, 0, 0.9) 20%, ` +
    `rgba(0, 0, 0, 0.5) 50%, ` +
    `rgba(0, 0, 0, 0.2) 80%, ` +
    `rgba(0, 0, 0, 0) 100%)`
  );
}
