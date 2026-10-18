import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import {
  surfaceFillOn,
  useSurfaceFill,
  useSurfaceLevelValue,
  type SurfaceLevel,
} from '../styles/surface-levels';

/** Material is independent of depth: derive a new fill from the actual parent. */
export function useSurfaceLayer() {
  const theme = useTheme();
  const parentFill = useSurfaceFill();
  const parentLevel = useSurfaceLevelValue();
  return resolveSurfaceLayer(theme, parentFill, parentLevel);
}

/** Shared pure layer decision for card material consumers. */
export function resolveSurfaceLayer(
  theme: Theme,
  parentFill: string,
  parentLevel: SurfaceLevel = 0,
) {
  return {
    parentFill,
    parentLevel,
    level: Math.min(parentLevel + 1, 3) as SurfaceLevel,
    // Preserve the page's card role; nested surfaces always take a real step,
    // even after the descriptive level number has reached its last rung.
    fill:
      parentLevel === 0 && parentFill === theme.colors.background
        ? theme.colors.card
        : surfaceFillOn(theme, parentFill),
  };
}
