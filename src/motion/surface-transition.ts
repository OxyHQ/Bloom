import type { SurfaceTransition } from './types';

const DEFAULT_EASING = [0.25, 0.1, 0.25, 1] as const;
/** Keeps identical CSS/Reanimated timing; invalid values preserve safe defaults. */
export function resolveSurfaceTransition(transition: SurfaceTransition | undefined) {
  const candidate = transition?.easing;
  const easing =
    candidate?.length === 4 &&
    candidate.every(Number.isFinite) &&
    candidate[0] >= 0 &&
    candidate[0] <= 1 &&
    candidate[2] >= 0 &&
    candidate[2] <= 1
      ? candidate
      : DEFAULT_EASING;
  return {
    duration: Number.isFinite(transition?.duration) ? Math.max(0, transition!.duration) : 300,
    easing,
    cssEasing: `cubic-bezier(${easing.join(', ')})`,
  };
}
