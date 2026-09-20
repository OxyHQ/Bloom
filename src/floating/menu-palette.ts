/** Shared tonal surfaces for menus, select fields and tooltips. */
import { useMemo } from 'react';
import { resolveSurfaceLevel } from '../styles/surface-levels';

import { BUTTON_SHADOW } from '../button/shared';
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
  /** The select trigger — a bordered tonal field. */
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
  const surface = resolveSurfaceLevel(theme, 1);
  const mode = theme.isDark ? 'dark' : 'light';
  return {
    surface: surface.background,
    border: surface.border,
    shadow: MENU_SHADOW[mode],
    rowHighlight: c.backgroundSecondary,
    text: surface.text,
    textSecondary: surface.textSecondary,
    textPlaceholder: surface.textSecondary,
    textDisabled: surface.textGraphical,
    destructive: c.errorSubtleForeground,
    trigger: {
      background: c.backgroundSecondary,
      hoverBackground: c.backgroundTertiary,
      border: c.borderLight,
      hoverBorder: c.border,
      disabledBackground: c.backgroundSecondary,
      disabledForeground: c.textTertiary,
      shadow: BUTTON_SHADOW[mode],
      ring: c.primary,
      ringOffset: c.background,
    },
  };
}

export function useMenuPalette(): MenuPalette {
  const theme = useTheme();
  return useMemo(() => resolveMenuPalette(theme), [theme]);
}
