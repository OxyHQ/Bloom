import { resolveAccentColors } from '../theme/accent-colors';
import type { Theme } from '../theme/types';
import type { SwipeRowAction, SwipeRowPaint } from './types';

/**
 * The pane colours read off the theme.
 *
 * Nothing here picks a ramp stop. `accent` and `negative` are the SOLID pairs a
 * filled control already uses, so a delete pane is the same red as a
 * destructive button; `neutral` is the SUBTLE default pair, which is the one
 * fill in the palette that reads as "a surface behind the row" rather than as a
 * second control competing with the one the reader dragged away.
 */
export function resolveSwipeRowPaint(theme: Theme): SwipeRowPaint {
  const neutral = resolveAccentColors(theme.colors, 'default', 'subtle');
  const accent = resolveAccentColors(theme.colors, 'primary', 'solid');
  const negative = resolveAccentColors(theme.colors, 'error', 'solid');
  return {
    neutral: neutral.background,
    onNeutral: neutral.foreground,
    accent: accent.background,
    onAccent: accent.foreground,
    negative: negative.background,
    onNegative: negative.foreground,
  };
}

/** The pair one action's tone paints with. Pure. */
export function swipeActionPaint(
  action: SwipeRowAction,
  paint: SwipeRowPaint,
): { background: string; foreground: string } {
  switch (action.tone) {
    case 'negative':
      return { background: paint.negative, foreground: paint.onNegative };
    case 'accent':
      return { background: paint.accent, foreground: paint.onAccent };
    default:
      return { background: paint.neutral, foreground: paint.onNeutral };
  }
}
