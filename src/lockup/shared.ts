import type { TypeScaleVariant } from '../typography/scale';
import type { LockupSize } from './types';

/**
 * The geometry of each size, in one place so `Lockup` and `LockupSkeleton`
 * cannot drift apart.
 *
 *            icon  gap  pad   title              subtitle            caption
 *   sm        48   12    8   body-medium        body-2-regular      caption-1-regular
 *   md        64   14   10   headline-medium    body-2-regular      caption-1-regular
 *   lg       128   20    0   title-1-bold ×2    headline-regular    body-2-regular
 *
 * `pad` is the row's vertical padding; the divider sits in it, at the bottom.
 * The action of `sm` / `md` is centred on the row, `lg`'s is 12 under its text.
 */
export interface LockupMetrics {
  icon: number;
  gap: number;
  padding: number;
  title: TypeScaleVariant;
  subtitle: TypeScaleVariant;
  caption: TypeScaleVariant;
  titleLines: number;
  /** Line heights of the three text styles, for the skeleton's bars. */
  lineHeights: readonly [number, number, number];
}

export const LOCKUP_METRICS: Record<LockupSize, LockupMetrics> = {
  sm: {
    icon: 48,
    gap: 12,
    padding: 8,
    title: 'body-medium',
    subtitle: 'body-2-regular',
    caption: 'caption-1-regular',
    titleLines: 1,
    lineHeights: [20, 18, 16],
  },
  md: {
    icon: 64,
    gap: 14,
    padding: 10,
    title: 'headline-medium',
    subtitle: 'body-2-regular',
    caption: 'caption-1-regular',
    titleLines: 1,
    lineHeights: [22, 18, 16],
  },
  lg: {
    icon: 128,
    gap: 20,
    padding: 0,
    title: 'title-1-bold',
    subtitle: 'headline-regular',
    caption: 'body-2-regular',
    titleLines: 2,
    lineHeights: [34, 22, 18],
  },
};

/** The column a `rank` is centred in, so every row's text starts at the same edge. */
export const LOCKUP_RANK_WIDTH = 24;

/** How far the press target shrinks while held (`PressableScale`). */
export const LOCKUP_PRESS_SCALE = 0.98;

export const LOCKUP_STYLE_ID = 'bloom-lockup-web-css';
export const LOCKUP_LINK = '[data-bloom-lockup-link]';
