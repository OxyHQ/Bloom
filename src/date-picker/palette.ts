import { BUTTON_SHADOW, resolveButtonRamps } from '../button/shared';
import type { Theme } from '../theme/types';

/**
 * Date-picker tokens, resolved through the ramps `Button` builds from Bloom's
 * theme.
 *
 *                     light         dark
 *   popup surface     neutral-100   neutral-900
 *   month panel       card          neutral-800
 *   title, day        text          text
 *   weekday, chevron  neutral-500   neutral-500
 *   disabled day      neutral-400   neutral-600
 *   day / nav hover   neutral-200   neutral-800
 *   range band        accent-100    accent-950
 *   range edge        accent-300    accent-800
 *   focus ring        accent-500    accent-500
 *   chip border       neutral-200   neutral-700
 *   chip focused      neutral-400   neutral-600
 *   pill / preset on  neutral-200   neutral-800
 */
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
  const { accent, neutral: n } = resolveButtonRamps(theme);
  const c = theme.colors;
  return theme.isDark
    ? {
        popup: n[900],
        panel: n[800],
        text: c.text,
        secondaryText: n[500],
        disabledText: n[600],
        hover: n[800],
        rangeBand: accent[950],
        rangeEdge: accent[800],
        ring: accent[500],
        chipBorder: n[700],
        chipBorderFocused: n[600],
        tertiary: n[800],
        shadowXs: BUTTON_SHADOW.dark,
        shadowDropdown: '0 1px 1px 0 rgb(0 0 0 / 0.14), 0 4px 4px 0 rgb(0 0 0 / 0.10)',
      }
    : {
        popup: n[100],
        panel: c.card,
        text: c.text,
        secondaryText: n[500],
        disabledText: n[400],
        hover: n[200],
        rangeBand: accent[100],
        rangeEdge: accent[300],
        ring: accent[500],
        chipBorder: n[200],
        chipBorderFocused: n[400],
        tertiary: n[200],
        shadowXs: BUTTON_SHADOW.light,
        shadowDropdown: '0 1px 1px 0 rgb(0 0 0 / 0.04), 0 4px 4px 0 rgb(0 0 0 / 0.02)',
      };
}

