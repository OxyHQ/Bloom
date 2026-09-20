/**
 * What the price rows paint, read RELATIVE to the surface they were dropped on
 * (`styles/surface-levels.ts`) — a breakdown sits inside a checkout card as
 * often as on a page, and a rule or a quiet caption picked by eye disappears on
 * one of the two.
 *
 * Pure, so `PriceSummary.test.tsx` can walk presets and modes without rendering.
 */
import { hairlineOn, surfaceTextOn, type SurfaceTextPaint } from '../styles/surface-levels';
import { resolveAccentColors } from '../theme/accent-colors';
import type { Theme } from '../theme/types';

export interface PricePaint extends SurfaceTextPaint {
  /** The rule above the total, and any divider between groups of lines. */
  rule: string;
  /**
   * A discount's amount. The tone's SUBTLE foreground, which is the member the
   * palette sizes to be legible as text on a surface — the solid fill is sized
   * to carry a white label and is too loud to read as a number.
   */
  discount: string;
}

export function resolvePricePaint(theme: Theme, surface: string): PricePaint {
  return {
    ...surfaceTextOn(theme, surface),
    rule: hairlineOn(theme, surface),
    discount: resolveAccentColors(theme.colors, 'success', 'subtle').foreground,
  };
}
