/** Shared tonal surfaces for menus, select fields and tooltips. */
import { useMemo } from 'react';
import { resolveSurfaceLevel } from '../styles/surface-levels';

import { BUTTON_SHADOW } from '../button/shared';
import { resolveFieldRestBorder } from '../styles/field-border';
import { resolveLabelColors } from '../theme/label-colors';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';
import { useDesktopPlatform } from '../platform-surface/use-desktop-platform';

/** `--shadow-dropdown`, light and dark. */
export const MENU_SHADOW = {
  light: '0 1px 1px 0 rgba(0, 0, 0, 0.04), 0 4px 4px 0 rgba(0, 0, 0, 0.02)',
  dark: '0 1px 1px 0 rgba(0, 0, 0, 0.14), 0 4px 4px 0 rgba(0, 0, 0, 0.1)',
} as const;

/**
 * A desktop platform's menu shadow: a half-pixel hairline that draws the panel's
 * edge on any backdrop, over a soft drop that lifts it off the window. The
 * dropdown shadow above is all but invisible on a light window, where a menu
 * then read as part of what it covers.
 */
export const DESKTOP_MENU_SHADOW = {
  light: '0 0 0 0.5px rgba(0, 0, 0, 0.12), 0 6px 20px 0 rgba(0, 0, 0, 0.16)',
  dark: '0 0 0 0.5px rgba(0, 0, 0, 0.6), 0 8px 24px 0 rgba(0, 0, 0, 0.45)',
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
  /**
   * A desktop platform's row highlight: the accent fill, with its foreground
   * for everything drawn on the row (label, shortcut, check, chevron). Null off
   * a desktop platform, where `rowHighlight` is the highlight.
   */
  rowActive: { fill: string; text: string } | null;
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

/**
 * The menu palette. On a desktop platform (`desktop`) the highlight is the
 * accent (`rowActive`), the quiet text is the secondary label level, a disabled
 * row the tertiary one (`theme/label-colors.ts`), and the shadow is
 * `DESKTOP_MENU_SHADOW`; everything else is the same.
 */
export function resolveMenuPalette(theme: Theme, desktop: boolean = false): MenuPalette {
  const c = theme.colors;
  const surface = resolveSurfaceLevel(theme, 1);
  const mode = theme.isDark ? 'dark' : 'light';
  const labels = desktop ? resolveLabelColors(theme) : null;
  return {
    surface: surface.background,
    border: surface.border,
    shadow: desktop ? DESKTOP_MENU_SHADOW[mode] : MENU_SHADOW[mode],
    rowHighlight: c.backgroundSecondary,
    rowActive: desktop ? { fill: c.primary, text: c.primaryForeground } : null,
    text: surface.text,
    textSecondary: labels?.secondary ?? surface.textSecondary,
    textPlaceholder: labels?.tertiary ?? surface.textSecondary,
    textDisabled: labels?.tertiary ?? surface.textGraphical,
    destructive: c.errorSubtleForeground,
    trigger: {
      background: c.backgroundSecondary,
      hoverBackground: c.backgroundTertiary,
      border: resolveFieldRestBorder(theme),
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
  const desktop = useDesktopPlatform();
  return useMemo(() => resolveMenuPalette(theme, desktop), [theme, desktop]);
}
