/**
 * What both `order-status` components need to paint themselves, read RELATIVE
 * to the surface they were dropped on (`styles/surface-levels.ts`) rather than
 * from a ramp stop — a status strip is put inside a card as often as on a page,
 * and a connector picked by eye disappears on one of the two.
 *
 * Pure, so `OrderStatus.test.tsx` can walk presets and modes without rendering.
 */
import { Platform } from 'react-native';

import { hairlineOn, surfaceTextOn, type SurfaceTextPaint } from '../styles/surface-levels';
import type { Theme } from '../theme/types';

export const IS_WEB = Platform.OS === 'web';

export interface OrderStatusPaint extends SurfaceTextPaint {
  /** The connector between two steps that have not been travelled yet. */
  connector: string;
  /**
   * The ring of a marker that has not happened. `textGraphical` is the rung the
   * ladder sizes for exactly this — a line or a glyph rather than text — so it
   * clears 3:1 on whatever the component is sitting on.
   */
  upcomingRing: string;
}

export function resolveOrderStatusPaint(theme: Theme, surface: string): OrderStatusPaint {
  const text = surfaceTextOn(theme, surface);
  return {
    ...text,
    connector: hairlineOn(theme, surface),
    upcomingRing: text.textGraphical,
  };
}
