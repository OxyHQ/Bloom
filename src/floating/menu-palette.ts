/**
 * The menu recipe's COLOURS, resolved from Bloom's theme.
 *
 * Menus, the select and the tooltip are painted from a handful of semantic
 * tokens that all sit on a Tailwind neutral ramp. Bloom's theme carries one
 * colour per role, so each token is rebuilt through `button/shared.ts`'s ramps
 * — the same ramps `Button` and `ButtonGroup` paint from, so a menu opened
 * from a secondary button is the same white/neutral family as the button
 * itself.
 *
 *   Semantic token                      light            dark
 *   background/primary/default          card             neutral-800
 *   background/primary/hover            neutral-100      neutral-700 @60% over neutral-800
 *   background/primary/disabled         neutral-100      neutral-800
 *   border/button/default               neutral-200      neutral-700
 *   border/button/hover                 neutral-300      neutral-500
 *   dropdown-item-hover-background      neutral-100      neutral-700 @60% over neutral-800
 *   text-primary                        text             text
 *   text-secondary                      neutral-500      neutral-500
 *   text-tertiary                       neutral-400      neutral-600
 *   text-placeholder                    neutral-400      neutral-400
 *   text-disabled                       neutral-300      neutral-600 (*)
 *   text-error-primary                  red-500          red-400
 *   border-focus-ring                   accent-500       accent-500
 *   shadow-dropdown / shadow-xs         light and dark alphas
 *
 * (*) The dark `text-disabled` token is neutral-800 — the SAME colour as the
 * dark panel, so a disabled row is invisible. Bloom takes the dark
 * `text-tertiary` step instead, the colour a disabled button label uses.
 *
 * Resolved to literal colours and applied as INLINE style (or as custom
 * properties a web sheet reads), because none of these stops exists as a CSS
 * variable a class could name. A caller's `style` still overrides them.
 */
import { useMemo } from 'react';

import {
  BUTTON_SHADOW,
  colorRamp,
  DANGER_TABLE,
  mixColor,
  resolveButtonRamps,
} from '../button/shared';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';

/** `--shadow-dropdown`, light and dark. */
export const MENU_SHADOW = {
  light: '0 1px 1px 0 rgba(0, 0, 0, 0.04), 0 4px 4px 0 rgba(0, 0, 0, 0.02)',
  dark: '0 1px 1px 0 rgba(0, 0, 0, 0.14), 0 4px 4px 0 rgba(0, 0, 0, 0.1)',
} as const;

export interface MenuPalette {
  /** Panel and tooltip surface. */
  surface: string;
  /** Panel/tooltip hairline, separators. */
  border: string;
  /** `shadow-dropdown`. */
  shadow: string;
  /** Row highlight — hover, keyboard focus and the current selection. */
  rowHighlight: string;
  text: string;
  textSecondary: string;
  textPlaceholder: string;
  textDisabled: string;
  destructive: string;
  /** The select trigger — a bordered white field. */
  trigger: {
    background: string;
    hoverBackground: string;
    border: string;
    hoverBorder: string;
    disabledBackground: string;
    disabledForeground: string;
    shadow: string;
    ring: string;
    /** `ring-offset-2`'s gap colour — the page behind the control. */
    ringOffset: string;
  };
}

export function resolveMenuPalette(theme: Theme): MenuPalette {
  const c = theme.colors;
  const { accent, neutral: n } = resolveButtonRamps(theme);
  const red = colorRamp(c.negative, DANGER_TABLE);

  if (theme.isDark) {
    const hover = mixColor(n[800], n[700], 0.6);
    return {
      surface: n[800],
      border: n[700],
      shadow: MENU_SHADOW.dark,
      rowHighlight: hover,
      text: c.text,
      textSecondary: n[500],
      textPlaceholder: n[400],
      textDisabled: n[600],
      destructive: red[400],
      trigger: {
        background: n[800],
        hoverBackground: hover,
        border: n[700],
        hoverBorder: n[500],
        disabledBackground: n[800],
        disabledForeground: n[600],
        shadow: BUTTON_SHADOW.dark,
        ring: accent[500],
        // Tailwind's `ring-offset` gap is `#fff` by default; on a dark page the
        // gap takes the page colour instead of flashing white.
        ringOffset: c.background,
      },
    };
  }

  return {
    surface: c.card,
    border: n[200],
    shadow: MENU_SHADOW.light,
    rowHighlight: n[100],
    text: c.text,
    textSecondary: n[500],
    textPlaceholder: n[400],
    textDisabled: n[300],
    destructive: red[500],
    trigger: {
      background: c.card,
      hoverBackground: n[100],
      border: n[200],
      hoverBorder: n[300],
      disabledBackground: n[100],
      disabledForeground: n[400],
      shadow: BUTTON_SHADOW.light,
      ring: accent[500],
      // Tailwind's default `ring-offset` colour is white — the light surface.
      ringOffset: c.card,
    },
  };
}

export function useMenuPalette(): MenuPalette {
  const theme = useTheme();
  return useMemo(() => resolveMenuPalette(theme), [theme]);
}
