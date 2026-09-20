import { BUTTON_SHADOW } from '../button/shared';
import type { Theme } from '../theme/types';

/** Surface and text slots read canonical theme roles; fixed shadow geometry is unchanged. */
export interface CalendarPalette {
  popup: string;
  panel: string;
  text: string;
  secondaryText: string;
  disabledText: string;
  hover: string;
  rangeBand: string;
  rangeEdge: string;
  ring: string;
  chipBorder: string;
  chipBorderFocused: string;
  tertiary: string;
  /** Tailwind `shadow-xs`, with a dark override in dark mode. */
  shadowXs: string;
  /** `shadow-dropdown`. */
  shadowDropdown: string;
}

export function resolveCalendarPalette(theme: Theme): CalendarPalette {
  const c = theme.colors;
  return {
    popup: c.backgroundSecondary, panel: c.card, text: c.text,
    secondaryText: c.textSecondary, disabledText: c.textTertiary,
    hover: c.backgroundTertiary, rangeBand: c.primarySubtle,
    rangeEdge: c.primarySubtle, ring: c.primary,
    chipBorder: c.border, chipBorderFocused: c.primary, tertiary: c.backgroundTertiary,
    shadowXs: theme.isDark ? BUTTON_SHADOW.dark : BUTTON_SHADOW.light,
    shadowDropdown: theme.isDark ? '0 1px 1px 0 rgb(0 0 0 / 0.14), 0 4px 4px 0 rgb(0 0 0 / 0.10)' : '0 1px 1px 0 rgb(0 0 0 / 0.04), 0 4px 4px 0 rgb(0 0 0 / 0.02)',
  };
}

