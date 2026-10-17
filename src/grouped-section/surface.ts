import { resolveCardFill } from '../card/use-card-fill';
import { resolveSurfaceLayer } from '../surface/use-surface-layer';
import type { SurfaceLevel } from '../styles/surface-levels';
import type { Theme } from '../theme/types';
import type { GroupedSectionVariant } from './types';

export const GROUPED_SECTION_TEST_ID = 'settings-list-group';

/** Same neutral backing as Card/UsageCard; explicit variants retain their legacy fills. */
export function groupedSectionSurface(
  theme: Theme,
  ambientFill: string,
  variant?: GroupedSectionVariant,
  parentLevel: SurfaceLevel = 0,
): string {
  if (variant === 'filled') return theme.colors.backgroundSecondary;
  if (variant === 'plain') return theme.colors.card;
  return resolveCardFill(resolveSurfaceLayer(theme, ambientFill, parentLevel));
}
