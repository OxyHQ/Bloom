import { useMemo } from 'react';

import { resolveButtonRamps } from '../button/shared';
import { resolveMenuPalette } from '../floating/menu-palette';
import type { Theme } from '../theme/types';
import { useTheme } from '../theme/use-theme';

/**
 * The stay-search colours, resolved from the theme through the same ramps
 * `Button` and the menus paint from.
 *
 *   role                         light              dark
 *   bar surface                  card               neutral-800
 *   bar surface, a segment open  neutral-100        neutral-900
 *   bar / panel hairline         neutral-200        neutral-700
 *   segment hover (bar at rest)  neutral-100        neutral-700 @60%
 *   segment hover (bar open)     neutral-200        neutral-800
 *   open segment (raised pill)   card               neutral-700
 *   separator                    neutral-200        neutral-700
 *   icon tile                    neutral-100        neutral-700
 *   panel surface / shadow       the menu palette's surface / border / shadow
 */
export interface StaySearchPalette {
  barSurface: string;
  barSurfaceOpen: string;
  border: string;
  barShadow: string;
  segmentHover: string;
  segmentHoverOpen: string;
  segmentActive: string;
  segmentActiveShadow: string;
  separator: string;
  text: string;
  textSecondary: string;
  placeholder: string;
  tile: string;
  rowHighlight: string;
  panelSurface: string;
  panelBorder: string;
  panelShadow: string;
}

/** The bar's soft lift, light and dark. */
export const STAY_SEARCH_BAR_SHADOW = {
  light: '0 1px 2px 0 rgba(0, 0, 0, 0.04), 0 4px 12px 0 rgba(0, 0, 0, 0.06)',
  dark: '0 1px 2px 0 rgba(0, 0, 0, 0.2), 0 4px 12px 0 rgba(0, 0, 0, 0.24)',
} as const;

/** The raised open segment, light and dark. */
export const STAY_SEARCH_SEGMENT_SHADOW = {
  light: '0 2px 8px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  dark: '0 2px 8px 0 rgba(0, 0, 0, 0.32), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
} as const;

/** A dropped panel carries the menu shadow plus a wider ambient layer. */
const PANEL_AMBIENT = {
  light: '0 12px 32px 0 rgba(0, 0, 0, 0.08)',
  dark: '0 12px 32px 0 rgba(0, 0, 0, 0.36)',
} as const;

export function resolveStaySearchPalette(theme: Theme): StaySearchPalette {
  const c = theme.colors;
  const { neutral: n } = resolveButtonRamps(theme);
  const menu = resolveMenuPalette(theme);
  const mode = theme.isDark ? 'dark' : 'light';

  return {
    barSurface: menu.surface,
    barSurfaceOpen: theme.isDark ? n[900] : n[100],
    border: menu.border,
    barShadow: STAY_SEARCH_BAR_SHADOW[mode],
    segmentHover: menu.rowHighlight,
    segmentHoverOpen: theme.isDark ? n[800] : n[200],
    segmentActive: theme.isDark ? n[700] : c.card,
    segmentActiveShadow: STAY_SEARCH_SEGMENT_SHADOW[mode],
    separator: theme.isDark ? n[700] : n[200],
    text: c.text,
    textSecondary: c.textSecondary,
    placeholder: c.textSecondary,
    tile: theme.isDark ? n[700] : n[100],
    rowHighlight: menu.rowHighlight,
    panelSurface: menu.surface,
    panelBorder: menu.border,
    panelShadow: `${menu.shadow}, ${PANEL_AMBIENT[mode]}`,
  };
}

export function useStaySearchPalette(): StaySearchPalette {
  const theme = useTheme();
  return useMemo(() => resolveStaySearchPalette(theme), [theme]);
}
